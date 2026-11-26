<?php
/* Barra Boat Floripa | lib/google.php
   Agenda Google do parceiro conectada pela conta (OAuth), nos dois sentidos.

   - Conectar: o parceiro abre /conectar-agenda/?c=<convite> (conectar.php), autoriza no Google
     (api/google-volta.php) e escolhe a agenda onde anota as lanchas. O refresh token fica cifrado
     em bb_google_contas (só a service_role lê).
   - Ler: bb_google_dias_parceiro() lista os eventos da agenda escolhida e devolve o dia ocupado de
     cada lancha (dele e das que ele vende), pelo mesmo classificador do leitor por link
     (lib/agenda.php). Roda quando o Google avisa que a agenda mudou (api/google-aviso.php), pelo
     cron a cada minuto e pelo "Ler agora" do painel.
   - Escrever: passeio marcado, mudado ou cancelado numa lancha de parceiro conectado vira evento
     na agenda dele (bb_google_fila, preenchida por gatilho no banco; bb_google_processa_fila()).
     Os eventos que o sistema escreve levam extendedProperties.private.bb_passeio e o leitor os pula.

   Configuração (config.local.php): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_CHAVE (texto
   aleatório longo: assina os convites e cifra os tokens). Compatível com PHP 7.4+. */

require_once __DIR__ . '/agenda.php';

define('BB_GOOGLE_ESCOPOS', 'openid email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly');
define('BB_GOOGLE_API', 'https://www.googleapis.com/calendar/v3/');
define('BB_GOOGLE_DIR', BB_CACHE . '/google');

function bb_google_pronto()
{
    return bb_config('GOOGLE_CLIENT_ID') && bb_config('GOOGLE_CLIENT_SECRET') && strlen((string) bb_config('GOOGLE_CHAVE')) >= 32;
}

/* Endereço do site (o webhook e a volta do Google precisam do endereço completo). */
function bb_google_base()
{
    $u = bb_config('SITE_URL');
    if ($u) return rtrim($u, '/') . '/';
    if (!empty($_SERVER['HTTP_HOST']) && preg_match('/^(novo\.)?barraboatfloripa\.com\.br$/', $_SERVER['HTTP_HOST'])) return 'https://' . $_SERVER['HTTP_HOST'] . '/';
    return strpos(str_replace('\\', '/', BB_RAIZ), '/novo') !== false ? 'https://novo.barraboatfloripa.com.br/' : 'https://barraboatfloripa.com.br/';
}

function bb_google_volta() { return bb_google_base() . 'api/google-volta.php'; }

/* ---------- convite assinado e cifra ---------- */

function bb_b64u($s) { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function bb_b64u_dec($s) { return base64_decode(strtr($s, '-_', '+/')); }

function bb_google_hmac($txt) { return hash_hmac('sha256', $txt, 'assina|' . bb_config('GOOGLE_CHAVE'), true); }

/* Convite do parceiro: válido por $dias. */
function bb_google_convite($parceiro_id, $dias = 14)
{
    $d = bb_b64u(json_encode(['p' => $parceiro_id, 'e' => time() + $dias * 86400]));
    return $d . '.' . bb_b64u(bb_google_hmac($d));
}

/* Devolve o id do parceiro do convite, ou null (assinatura errada ou vencido). */
function bb_google_confere_convite($c)
{
    if (!is_string($c) || !preg_match('/^([\w-]+)\.([\w-]+)$/', $c, $m)) return null;
    if (!hash_equals(bb_b64u(bb_google_hmac($m[1])), $m[2])) return null;
    $d = json_decode((string) bb_b64u_dec($m[1]), true);
    if (!is_array($d) || empty($d['p']) || (int) ($d['e'] ?? 0) < time()) return null;
    return preg_match('/^[0-9a-f-]{36}$/i', $d['p']) ? $d['p'] : null;
}

/* Token do canal de aviso (o Google devolve em cada aviso). */
function bb_google_token_canal($parceiro_id) { return bb_b64u(bb_google_hmac('canal|' . $parceiro_id)); }

function bb_google_cifra($txt)
{
    $k = hash('sha256', 'cifra|' . bb_config('GOOGLE_CHAVE'), true);
    $iv = random_bytes(12);
    $tag = '';
    $c = openssl_encrypt($txt, 'aes-256-gcm', $k, OPENSSL_RAW_DATA, $iv, $tag);
    return bb_b64u($iv . $tag . $c);
}

function bb_google_decifra($s)
{
    $b = bb_b64u_dec((string) $s);
    if (strlen($b) < 29) return null;
    $k = hash('sha256', 'cifra|' . bb_config('GOOGLE_CHAVE'), true);
    $t = openssl_decrypt(substr($b, 28), 'aes-256-gcm', $k, OPENSSL_RAW_DATA, substr($b, 0, 12), substr($b, 12, 16));
    return $t === false ? null : $t;
}

/* ---------- HTTP ---------- */

/* [status, corpo decodificado]. $form: corpo application/x-www-form-urlencoded. */
function bb_google_http($metodo, $url, $corpo = null, $token = null, $form = false)
{
    $cab = ['Accept: application/json'];
    if ($token) $cab[] = 'Authorization: Bearer ' . $token;
    $ch = curl_init($url);
    $o = [CURLOPT_CUSTOMREQUEST => $metodo, CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_TIMEOUT => 20];
    if ($corpo !== null) {
        if ($form) { $cab[] = 'Content-Type: application/x-www-form-urlencoded'; $o[CURLOPT_POSTFIELDS] = http_build_query($corpo); }
        else { $cab[] = 'Content-Type: application/json'; $o[CURLOPT_POSTFIELDS] = json_encode($corpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); }
    }
    $o[CURLOPT_HTTPHEADER] = $cab;
    curl_setopt_array($ch, $o);
    $txt = curl_exec($ch);
    $st = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($txt === false) return [0, null];
    return [$st, $txt === '' ? null : json_decode($txt, true)];
}

/* ---------- OAuth ---------- */

function bb_google_url_autorizacao($state)
{
    return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
        'client_id' => bb_config('GOOGLE_CLIENT_ID'),
        'redirect_uri' => bb_google_volta(),
        'response_type' => 'code',
        'scope' => BB_GOOGLE_ESCOPOS,
        'access_type' => 'offline',
        'prompt' => 'consent',          // garante o refresh token mesmo se ele já autorizou antes
        'include_granted_scopes' => 'true',
        'state' => $state,
    ]);
}

/* Troca o código da volta pelos tokens. ['ok' => true, 'refresh', 'access', 'expira', 'email', 'escopos'] ou ['ok' => false, 'erro']. */
function bb_google_troca_codigo($code)
{
    list($st, $r) = bb_google_http('POST', 'https://oauth2.googleapis.com/token', [
        'code' => $code, 'client_id' => bb_config('GOOGLE_CLIENT_ID'), 'client_secret' => bb_config('GOOGLE_CLIENT_SECRET'),
        'redirect_uri' => bb_google_volta(), 'grant_type' => 'authorization_code',
    ], null, true);
    if ($st !== 200 || empty($r['access_token'])) return ['ok' => false, 'erro' => 'O Google não confirmou a autorização. Tente de novo.'];
    $email = null;
    if (!empty($r['id_token']) && count($partes = explode('.', $r['id_token'])) === 3) {
        $id = json_decode((string) bb_b64u_dec($partes[1]), true);
        $email = $id['email'] ?? null;
    }
    return ['ok' => true, 'refresh' => $r['refresh_token'] ?? null, 'access' => $r['access_token'], 'expira' => time() + (int) ($r['expires_in'] ?? 3600) - 120,
            'email' => $email, 'escopos' => explode(' ', (string) ($r['scope'] ?? ''))];
}

function bb_google_guarda_acesso($pid, $access, $expira)
{
    if (!is_dir(BB_GOOGLE_DIR)) @mkdir(BB_GOOGLE_DIR, 0700, true);
    @file_put_contents(BB_GOOGLE_DIR . '/acesso-' . $pid . '.json', json_encode(['t' => bb_google_cifra($access), 'e' => $expira]), LOCK_EX);
}

/* Conta conectada do parceiro (linha de bb_google_contas) ou null. */
function bb_google_conta($pid)
{
    list($st, $r) = bb_supabase('GET', 'bb_google_contas?select=*&parceiro_id=eq.' . rawurlencode($pid));
    return $st === 200 && !empty($r[0]) ? $r[0] : null;
}

/* Token de acesso válido (guardado em disco por ~58 min). Devolve [token, erro]. erro 'desconectado' quando o
   parceiro tirou a permissão no Google. */
function bb_google_acesso($pid, $conta = null)
{
    $arq = BB_GOOGLE_DIR . '/acesso-' . $pid . '.json';
    $g = is_file($arq) ? json_decode((string) @file_get_contents($arq), true) : null;
    if (is_array($g) && (int) ($g['e'] ?? 0) > time() && ($t = bb_google_decifra($g['t'] ?? ''))) return [$t, null];
    $conta = $conta ?: bb_google_conta($pid);
    if (!$conta) return [null, 'sem conta'];
    $refresh = bb_google_decifra($conta['refresh_cripto']);
    if (!$refresh) return [null, 'desconectado'];
    list($st, $r) = bb_google_http('POST', 'https://oauth2.googleapis.com/token', [
        'refresh_token' => $refresh, 'client_id' => bb_config('GOOGLE_CLIENT_ID'), 'client_secret' => bb_config('GOOGLE_CLIENT_SECRET'), 'grant_type' => 'refresh_token',
    ], null, true);
    if ($st === 400 && in_array($r['error'] ?? '', ['invalid_grant', 'unauthorized_client'], true)) return [null, 'desconectado'];
    if ($st !== 200 || empty($r['access_token'])) return [null, 'rede'];
    bb_google_guarda_acesso($pid, $r['access_token'], time() + (int) ($r['expires_in'] ?? 3600) - 120);
    return [$r['access_token'], null];
}

/* Chamada à API do Calendar em nome do parceiro: [status, corpo]. status -1 = conexão desfeita. */
function bb_google_api($pid, $metodo, $caminho, $corpo = null, $conta = null)
{
    list($t, $erro) = bb_google_acesso($pid, $conta);
    if (!$t) return [$erro === 'desconectado' ? -1 : 0, null];
    $url = preg_match('~^https://~', $caminho) ? $caminho : BB_GOOGLE_API . $caminho;
    list($st, $r) = bb_google_http($metodo, $url, $corpo, $t);
    if ($st === 401) {   // token recusado: pede outro uma vez
        @unlink(BB_GOOGLE_DIR . '/acesso-' . $pid . '.json');
        list($t, $erro) = bb_google_acesso($pid, $conta);
        if (!$t) return [$erro === 'desconectado' ? -1 : 0, null];
        list($st, $r) = bb_google_http($metodo, $url, $corpo, $t);
    }
    return [$st, $r];
}

const BB_GOOGLE_DESCONECTADO = 'A conta Google do dono foi desconectada (ele tirou a permissão ou trocou a senha). Mande o link de conexão de novo.';

/* Agendas onde a conta pode escrever: [[id, nome, principal], ...] ou null. */
function bb_google_agendas($pid)
{
    list($st, $r) = bb_google_api($pid, 'GET', 'users/me/calendarList?minAccessRole=writer&maxResults=250');
    if ($st !== 200 || !isset($r['items'])) return null;
    $saida = [];
    foreach ($r['items'] as $c) $saida[] = ['id' => $c['id'], 'nome' => $c['summaryOverride'] ?? $c['summary'] ?? $c['id'], 'principal' => !empty($c['primary'])];
    usort($saida, function ($a, $b) { return $b['principal'] <=> $a['principal'] ?: strcasecmp($a['nome'], $b['nome']); });
    return $saida;
}

/* ---------- leitura ---------- */

/* Eventos da API -> [id da lancha => [dias]] (mesma regra do iCal: dia inteiro com fim exclusivo, evento
   que termina à meia-noite não ocupa o dia seguinte). Pula cancelados e os que o próprio sistema escreveu. */
function bb_google_eventos_dias(array $eventos, $classifica, $de, $ate)
{
    $por = [];
    foreach ($eventos as $e) {
        if (($e['status'] ?? '') === 'cancelled') continue;
        if (!empty($e['extendedProperties']['private']['bb_passeio'])) continue;
        $s = $e['start'] ?? []; $f = $e['end'] ?? [];
        try {
            if (!empty($s['date'])) {
                $ini = new DateTimeImmutable($s['date'], bb_tz());
                $fim = !empty($f['date']) ? new DateTimeImmutable($f['date'], bb_tz()) : $ini->modify('+1 day');
                $allday = true;
            } elseif (!empty($s['dateTime'])) {
                $ini = (new DateTimeImmutable($s['dateTime']))->setTimezone(bb_tz());
                $fim = !empty($f['dateTime']) ? (new DateTimeImmutable($f['dateTime']))->setTimezone(bb_tz()) : $ini;
                $allday = false;
            } else continue;
        } catch (Exception $x) { continue; }
        $ids = $classifica((string) ($e['summary'] ?? ''), (string) ($e['description'] ?? ''));
        if (!$ids) continue;
        $dias = [];
        bb_ical_dias_ocorrencia($ini, $allday, $fim->getTimestamp() - $ini->getTimestamp(), $dias, $de, $ate);
        foreach ($ids as $id) $por[$id] = ($por[$id] ?? []) + $dias;
    }
    return bb_agenda_ordena($por);
}

/* Lê a agenda escolhida do parceiro. Devolve [erro ou null, [id => [dias]]]. */
function bb_google_dias_parceiro(array $p, $classifica, $de, $ate)
{
    if (!bb_google_pronto()) return ['A conexão com o Google ainda não está configurada no servidor.', null];
    $conta = bb_google_conta($p['id']);
    if (!$conta || empty($conta['agenda_id'])) return ['O dono ainda não terminou de conectar a agenda: falta escolher a agenda no fim da conexão.', null];
    $q = http_build_query([
        'singleEvents' => 'true', 'maxResults' => 2500, 'showDeleted' => 'false',
        'timeMin' => $de . 'T00:00:00-03:00', 'timeMax' => (new DateTimeImmutable($ate, bb_tz()))->modify('+1 day')->format('Y-m-d') . 'T00:00:00-03:00',
        'fields' => 'items(id,status,summary,description,start,end,extendedProperties),nextPageToken',
    ]);
    $eventos = [];
    $pagina = null;
    for ($i = 0; $i < 20; $i++) {
        list($st, $r) = bb_google_api($p['id'], 'GET', 'calendars/' . rawurlencode($conta['agenda_id']) . '/events?' . $q . ($pagina ? '&pageToken=' . rawurlencode($pagina) : ''), null, $conta);
        if ($st === -1) return [BB_GOOGLE_DESCONECTADO, null];
        if ($st === 404) return ['A agenda escolhida não existe mais na conta do dono. Mande o link de conexão de novo para ele escolher a agenda.', null];
        if ($st !== 200 || !is_array($r)) return ['O Google não respondeu direito agora. Tento de novo em 1 minuto.', null];
        $eventos = array_merge($eventos, $r['items'] ?? []);
        $pagina = $r['nextPageToken'] ?? null;
        if (!$pagina) break;
    }
    return [null, bb_google_eventos_dias($eventos, $classifica, $de, $ate)];
}

/* Lê um parceiro agora (aviso do Google, "Ler agora", conexão). Uma leitura por parceiro de cada vez:
   se chegar outro aviso durante a leitura, lê de novo no fim (assim nenhuma mudança fica para trás). */
function bb_google_ler_agora($pid)
{
    if (!is_dir(BB_GOOGLE_DIR)) @mkdir(BB_GOOGLE_DIR, 0700, true);
    $pend = BB_GOOGLE_DIR . '/pendente-' . $pid;
    $trava = fopen(BB_GOOGLE_DIR . '/ler-' . $pid . '.lock', 'c');
    if (!$trava || !flock($trava, LOCK_EX | LOCK_NB)) { @touch($pend); return ['ok' => true, 'fila' => true]; }
    $r = null;
    for ($i = 0; $i < 3; $i++) {
        @unlink($pend);
        $ps = bb_agenda_parceiros($pid);
        if (!$ps) { $r = ['ok' => false, 'erro' => $ps === null ? 'Não consegui falar com o banco agora.' : 'Este parceiro não tem agenda conectada.']; break; }
        $r = bb_agenda_ler_parceiro($ps[0][0], $ps[0][1], $ps[0][2]);
        if (!is_file($pend)) break;
    }
    flock($trava, LOCK_UN);
    return $r;
}

/* ---------- aviso do Google (canal) ---------- */

/* Abre (ou renova) o canal que avisa o servidor quando a agenda do parceiro muda. Validade de 7 dias;
   o cron renova quando falta menos de 1 dia. */
function bb_google_canal_abre($pid, $conta = null)
{
    $conta = $conta ?: bb_google_conta($pid);
    if (!$conta || empty($conta['agenda_id'])) return false;
    $id = bin2hex(random_bytes(16));
    list($st, $r) = bb_google_api($pid, 'POST', 'calendars/' . rawurlencode($conta['agenda_id']) . '/events/watch', [
        'id' => $id, 'type' => 'web_hook', 'address' => bb_google_base() . 'api/google-aviso.php',
        'token' => bb_google_token_canal($pid), 'params' => ['ttl' => '604800'],
    ], $conta);
    if ($st !== 200 || empty($r['resourceId'])) return false;
    bb_google_canal_fecha($conta);   // o anterior, se havia
    bb_supabase('PATCH', 'bb_google_contas?parceiro_id=eq.' . rawurlencode($pid), [
        'canal_id' => $id, 'canal_recurso' => $r['resourceId'],
        'canal_expira' => gmdate('c', (int) (($r['expiration'] ?? (time() + 604800) * 1000) / 1000)), 'updated_at' => gmdate('c'),
    ]);
    return true;
}

function bb_google_canal_fecha($conta)
{
    if (empty($conta['canal_id']) || empty($conta['canal_recurso'])) return;
    bb_google_api($conta['parceiro_id'], 'POST', 'channels/stop', ['id' => $conta['canal_id'], 'resourceId' => $conta['canal_recurso']], $conta);
}

/* ---------- escrita: passeios na agenda do dono ---------- */

function bb_google_evento($ps)
{
    $lancha = $ps['lancha']['nome'] ?? 'Lancha';
    $cliente = trim((string) ($ps['lead']['nome'] ?? ''));
    $titulo = 'Reserva Barra Boat: ' . $lancha . ($cliente !== '' ? ', ' . $cliente : '') . (!empty($ps['pessoas']) ? ', ' . (int) $ps['pessoas'] . ' pessoas' : '');
    $linhas = [];
    $linhas[] = 'Lancha: ' . $lancha;
    if (!empty($ps['roteiro']['nome'])) $linhas[] = 'Roteiro: ' . $ps['roteiro']['nome'];
    if (!empty($ps['pedido'])) $linhas[] = 'Pedido do cliente: ' . $ps['pedido'];
    if ($cliente !== '') $linhas[] = 'Cliente: ' . $cliente;
    if (!empty($ps['pessoas'])) $linhas[] = 'Pessoas: ' . (int) $ps['pessoas'];
    $emb = trim((string) ($ps['embarque_local'] ?? ''));
    $linhas[] = 'Embarque: ' . (!empty($ps['hora_saida']) ? substr($ps['hora_saida'], 0, 5) . ', ' : '') . ($emb !== '' ? $emb : 'Canal da Barra da Lagoa');
    if (!empty($ps['embarque_maps'])) $linhas[] = 'Mapa: ' . $ps['embarque_maps'];
    if (!empty($ps['marinheiro']['nome'])) $linhas[] = 'Marinheiro: ' . $ps['marinheiro']['nome'];
    $linhas[] = '';
    $linhas[] = 'Reserva marcada pela equipe da Barra Boat. Para mudar ou cancelar, fale com a equipe: o sistema atualiza este evento sozinho.';
    $ev = [
        'summary' => $titulo,
        'description' => implode("\n", $linhas),
        'colorId' => '9',
        'extendedProperties' => ['private' => ['bb_passeio' => $ps['id']]],
    ];
    if (!empty($ps['hora_saida'])) {
        $ini = new DateTimeImmutable($ps['dia'] . ' ' . substr($ps['hora_saida'], 0, 5), bb_tz());
        $fim = $ini->modify('+7 hours');
        if ($fim->format('Y-m-d') !== $ini->format('Y-m-d')) $fim = new DateTimeImmutable($ps['dia'] . ' 23:59', bb_tz());
        $ev['start'] = ['dateTime' => $ini->format('c'), 'timeZone' => BB_TZ];
        $ev['end'] = ['dateTime' => $fim->format('c'), 'timeZone' => BB_TZ];
    } else {
        $ev['start'] = ['date' => $ps['dia']];
        $ev['end'] = ['date' => (new DateTimeImmutable($ps['dia'], bb_tz()))->modify('+1 day')->format('Y-m-d')];
    }
    return $ev;
}

function bb_google_marca_passeio($id, array $campos)
{
    bb_supabase('PATCH', 'bb_passeios?id=eq.' . rawurlencode($id), $campos + ['google_sync_at' => gmdate('c')]);
}

/* Processa a fila de passeios a levar para as agendas dos donos. Devolve quantos passeios tratou. */
function bb_google_processa_fila($limite = 50)
{
    if (!bb_google_pronto()) return 0;
    if (!is_dir(BB_GOOGLE_DIR)) @mkdir(BB_GOOGLE_DIR, 0700, true);
    $trava = fopen(BB_GOOGLE_DIR . '/fila.lock', 'c');
    if (!$trava || !flock($trava, LOCK_EX)) return 0;   // espera a outra rodada terminar (evita evento em dobro)
    list($st, $fila) = bb_supabase('GET', 'bb_google_fila?select=*&order=id&limit=' . (int) $limite);
    if ($st !== 200 || !$fila) { flock($trava, LOCK_UN); return 0; }
    $grupos = [];
    foreach ($fila as $f) $grupos[$f['passeio_id']][] = $f;
    $contas = [];
    $conta = function ($pid) use (&$contas) {
        if (!$pid) return null;
        if (!array_key_exists($pid, $contas)) $contas[$pid] = bb_google_conta($pid);
        return $contas[$pid] && !empty($contas[$pid]['agenda_id']) ? $contas[$pid] : null;
    };
    $feitos = [];
    $hoje = bb_hoje()->modify('-1 day')->format('Y-m-d');
    foreach ($grupos as $pid_passeio => $linhas) {
        list($st, $r) = bb_supabase('GET', 'bb_passeios?select=*,lancha:bb_lanchas(nome,parceiro_id),lead:bb_leads(nome),roteiro:bb_roteiros(nome),marinheiro:bb_marinheiros(nome)&id=eq.' . rawurlencode($pid_passeio));
        if ($st !== 200) continue;   // banco fora: tenta no próximo minuto
        $ps = $r[0] ?? null;
        // onde o evento está hoje
        $onde = $ps ? $ps['google_parceiro'] : null;
        $ev_id = $ps ? $ps['google_evento_id'] : null;
        if (!$ps) foreach ($linhas as $l) if ($l['evento_id']) { $onde = $l['parceiro_id']; $ev_id = $l['evento_id']; }
        // onde ele deve estar
        $alvo = null;
        if ($ps && $ps['status'] !== 'cancelado' && $ps['dia'] >= $hoje && !empty($ps['lancha']['parceiro_id']) && $conta($ps['lancha']['parceiro_id'])) $alvo = $ps['lancha']['parceiro_id'];
        $ok = true;
        if ($ev_id && $onde && $onde !== $alvo) {
            $c = $conta($onde);
            if ($c) {
                list($s2) = bb_google_api($onde, 'DELETE', 'calendars/' . rawurlencode($c['agenda_id']) . '/events/' . rawurlencode($ev_id), null, $c);
                if (!in_array($s2, [200, 204, 404, 410, -1], true)) $ok = false;
            }
            if ($ok) { $ev_id = null; if ($ps) bb_google_marca_passeio($ps['id'], ['google_evento_id' => null, 'google_parceiro' => null, 'google_erro' => null]); }
        }
        if ($ok && $alvo) {
            $c = $conta($alvo);
            $corpo = bb_google_evento($ps);
            $base = 'calendars/' . rawurlencode($c['agenda_id']) . '/events';
            $s2 = 0; $res = null;
            if ($ev_id) list($s2, $res) = bb_google_api($alvo, 'PUT', $base . '/' . rawurlencode($ev_id), $corpo, $c);
            if (!$ev_id || in_array($s2, [404, 410], true)) list($s2, $res) = bb_google_api($alvo, 'POST', $base, $corpo, $c);
            if (in_array($s2, [200, 201], true) && !empty($res['id'])) bb_google_marca_passeio($ps['id'], ['google_evento_id' => $res['id'], 'google_parceiro' => $alvo, 'google_erro' => null]);
            elseif ($s2 === -1) bb_google_marca_passeio($ps['id'], ['google_erro' => BB_GOOGLE_DESCONECTADO]);
            elseif ($s2 === 403) bb_google_marca_passeio($ps['id'], ['google_erro' => 'O Google não deixou escrever na agenda do dono (a agenda escolhida não permite edição).']);
            elseif ($s2 >= 400 && $s2 < 500 && $s2 !== 429) bb_google_marca_passeio($ps['id'], ['google_erro' => 'O Google recusou o evento (' . $s2 . ').']);
            else $ok = false;   // rede, 429 ou 5xx: tenta de novo no próximo minuto
        } elseif ($ok && $ps && !$alvo && $ps['google_erro']) {
            bb_google_marca_passeio($ps['id'], ['google_erro' => null]);
        }
        if ($ok) foreach ($linhas as $l) $feitos[] = (int) $l['id'];
    }
    if ($feitos) bb_supabase('DELETE', 'bb_google_fila?id=in.(' . implode(',', $feitos) . ')');
    flock($trava, LOCK_UN);
    return count($grupos);
}

/* Depois de conectar ou trocar de agenda: os eventos escritos na agenda antiga saem e os passeios
   futuros do parceiro entram de novo na fila. */
function bb_google_reenvia_parceiro($pid, $agenda_antiga = null)
{
    if ($agenda_antiga) {
        list($st, $ps) = bb_supabase('GET', 'bb_passeios?select=id,google_evento_id&google_parceiro=eq.' . rawurlencode($pid) . '&google_evento_id=not.is.null');
        if ($st === 200) foreach ((array) $ps as $x) {
            bb_google_api($pid, 'DELETE', 'calendars/' . rawurlencode($agenda_antiga) . '/events/' . rawurlencode($x['google_evento_id']));
            bb_google_marca_passeio($x['id'], ['google_evento_id' => null, 'google_parceiro' => null]);
        }
    }
    bb_supabase('POST', 'rpc/bb_google_enfileira_parceiro', ['p_parceiro' => $pid]);
    return bb_google_processa_fila(200);
}

/* Desliga a conta do parceiro: fecha o aviso, apaga os eventos que o sistema escreveu, revoga o acesso
   no Google e esquece o token. Os dias lidos dele saem (gatilho ao trocar agenda_tipo). */
function bb_google_desconecta($pid)
{
    $conta = bb_google_conta($pid);
    if ($conta) {
        bb_google_canal_fecha($conta);
        if (!empty($conta['agenda_id'])) {
            list($st, $ps) = bb_supabase('GET', 'bb_passeios?select=id,google_evento_id&google_parceiro=eq.' . rawurlencode($pid) . '&google_evento_id=not.is.null&dia=gte.' . bb_hoje()->format('Y-m-d'));
            if ($st === 200) foreach ((array) $ps as $x) bb_google_api($pid, 'DELETE', 'calendars/' . rawurlencode($conta['agenda_id']) . '/events/' . rawurlencode($x['google_evento_id']), null, $conta);
        }
        $refresh = bb_google_decifra($conta['refresh_cripto']);
        if ($refresh) bb_google_http('POST', 'https://oauth2.googleapis.com/revoke', ['token' => $refresh], null, true);
    }
    bb_supabase('PATCH', 'bb_passeios?google_parceiro=eq.' . rawurlencode($pid), ['google_evento_id' => null, 'google_parceiro' => null, 'google_erro' => null]);
    bb_supabase('DELETE', 'bb_google_contas?parceiro_id=eq.' . rawurlencode($pid));
    bb_supabase('PATCH', 'bb_parceiros?id=eq.' . rawurlencode($pid), ['agenda_tipo' => null, 'google_email' => null, 'google_agenda_nome' => null, 'agenda_erro' => null, 'agenda_lida_at' => null]);
    @unlink(BB_GOOGLE_DIR . '/acesso-' . $pid . '.json');
    @unlink(BB_CACHE . '/ocupadas.json');
}
