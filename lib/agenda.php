<?php
/* Barra Boat Floripa | lib/agenda.php
   Leitor das agendas dos donos das lanchas (item 48). Usado pelo cron
   (cron/agendas.php, a cada 15 min) e pelo botão "Ler agora" do painel (api/agenda.php).

   - Google Agenda (ou qualquer agenda iCal: iCloud, Outlook): endereço secreto .ics.
     Lê eventos de dia inteiro e com horário, repetições (RRULE), exceções (EXDATE)
     e ocorrências alteradas (RECURRENCE-ID). Evento cancelado não conta.
   - Planilha do Google publicada como CSV: cada linha com data é um dia ocupado;
     duas datas na linha viram um período; linha com "livre", "disponível", "vago"
     ou "cancelado" é ignorada.

   Só o DIA ocupado é guardado (bb_agenda_dono). Título, nome de cliente e
   qualquer outro texto da agenda pessoal do dono não saem deste arquivo.
   Compatível com PHP 7.4+. */

require_once __DIR__ . '/bb.php';

define('BB_TZ', 'America/Sao_Paulo');
define('BB_AGENDA_DIAS', 366);            // mesma janela do calendário do site
define('BB_AGENDA_MAX_BYTES', 10485760);   // 10 MB

function bb_tz()
{
    static $tz = null;
    if ($tz === null) $tz = new DateTimeZone(BB_TZ);
    return $tz;
}

function bb_hoje()
{
    return new DateTimeImmutable('today', bb_tz());
}

/* ---------- download ---------- */

/* Endereço que de fato devolve os dados. Planilha: troca o link de edição ou de
   página publicada pelo de CSV. webcal:// (iCloud) vira https://. */
function bb_agenda_url_real($tipo, $url)
{
    $url = trim($url);
    if (stripos($url, 'webcal://') === 0) $url = 'https://' . substr($url, 9);
    if ($tipo !== 'planilha') return $url;
    $gid = preg_match('/[#&?]gid=(\d+)/', $url, $m) ? $m[1] : null;
    if (preg_match('~^https://docs\.google\.com/spreadsheets/d/e/([\w-]+)/~', $url, $m)) {
        return 'https://docs.google.com/spreadsheets/d/e/' . $m[1] . '/pub?output=csv' . ($gid !== null ? '&gid=' . $gid . '&single=true' : '');
    }
    if (preg_match('~^https://docs\.google\.com/spreadsheets/d/([\w-]+)~', $url, $m)) {
        return 'https://docs.google.com/spreadsheets/d/' . $m[1] . '/export?format=csv' . ($gid !== null ? '&gid=' . $gid : '');
    }
    return $url;
}

/* Só https e só endereço público (o link vem do banco: nada de apontar para a rede interna). */
function bb_url_publica($url)
{
    $p = parse_url($url);
    if (!$p || strtolower($p['scheme'] ?? '') !== 'https' || empty($p['host'])) return false;
    $ips = @gethostbynamel($p['host']);
    if (!$ips) return false;
    foreach ($ips as $ip) {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return false;
    }
    return true;
}

/* [status http, corpo] ou [0, motivo] */
function bb_agenda_baixa($url)
{
    if (!bb_url_publica($url)) return [0, 'endereco'];
    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_USERAGENT => 'BarraBoat-Agenda/1.0',
        CURLOPT_ENCODING => '',
        CURLOPT_NOPROGRESS => false,
        CURLOPT_XFERINFOFUNCTION => function ($c, $total, $agora) { return $agora > BB_AGENDA_MAX_BYTES ? 1 : 0; },
    ];
    if (defined('CURLOPT_PROTOCOLS')) $opts[CURLOPT_PROTOCOLS] = CURLPROTO_HTTPS;
    if (defined('CURLOPT_REDIR_PROTOCOLS')) $opts[CURLOPT_REDIR_PROTOCOLS] = CURLPROTO_HTTPS;
    curl_setopt_array($ch, $opts);
    $txt = curl_exec($ch);
    $st = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($txt === false) return [0, 'rede'];
    return [$st, $txt];
}

/* ---------- iCal ---------- */

/* Data/hora iCal -> [DateTimeImmutable no fuso de SP, dia inteiro?] */
function bb_ical_data($v, $tzid)
{
    $v = trim($v);
    if (preg_match('/^(\d{4})(\d{2})(\d{2})$/', $v, $m)) {
        return [new DateTimeImmutable("$m[1]-$m[2]-$m[3] 00:00:00", bb_tz()), true];
    }
    if (!preg_match('/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z?)$/', $v, $m)) return [null, false];
    $txt = "$m[1]-$m[2]-$m[3] $m[4]:$m[5]:" . ($m[6] !== '' ? $m[6] : '00');
    if ($m[7] === 'Z') $tz = new DateTimeZone('UTC');
    else {
        try { $tz = $tzid ? new DateTimeZone($tzid) : bb_tz(); } catch (Exception $e) { $tz = bb_tz(); }  // fuso do Outlook/Windows: assume SP
    }
    return [(new DateTimeImmutable($txt, $tz))->setTimezone(bb_tz()), false];
}

function bb_ical_duracao($v)
{
    if (!preg_match('/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/', trim($v), $m)) return null;
    $seg = ((int) ($m[2] ?? 0)) * 604800 + ((int) ($m[3] ?? 0)) * 86400 + ((int) ($m[4] ?? 0)) * 3600 + ((int) ($m[5] ?? 0)) * 60 + ((int) ($m[6] ?? 0));
    return ($m[1] ?? '') === '-' ? 0 : $seg;
}

/* Lê o texto iCal em eventos: [{start, allday, fim|null, dur|null, rrule, exdates[], recid|null, uid, cancelado}] */
function bb_ical_eventos($txt)
{
    $txt = str_replace(["\r\n", "\r"], "\n", $txt);
    $txt = preg_replace("/\n[ \t]/", '', $txt);          // linhas dobradas
    $evs = [];
    $ev = null;
    foreach (explode("\n", $txt) as $linha) {
        if ($linha === 'BEGIN:VEVENT') { $ev = ['exdates' => [], 'rrule' => null, 'recid' => null, 'uid' => '', 'cancelado' => false, 'start' => null, 'allday' => false, 'fim' => null, 'dur' => null]; continue; }
        if ($linha === 'END:VEVENT') { if ($ev && $ev['start']) $evs[] = $ev; $ev = null; continue; }
        if ($ev === null) continue;
        $dp = strpos($linha, ':');
        if ($dp === false) continue;
        $cab = substr($linha, 0, $dp);
        $val = substr($linha, $dp + 1);
        $partes = explode(';', $cab);
        $nome = strtoupper(array_shift($partes));
        $tzid = null;
        foreach ($partes as $p) if (stripos($p, 'TZID=') === 0) $tzid = trim(substr($p, 5), '"');
        switch ($nome) {
            case 'DTSTART': list($ev['start'], $ev['allday']) = bb_ical_data($val, $tzid); break;
            case 'DTEND': list($ev['fim']) = bb_ical_data($val, $tzid); break;
            case 'DURATION': $ev['dur'] = bb_ical_duracao($val); break;
            case 'RRULE': $ev['rrule'] = $val; break;
            case 'EXDATE': foreach (explode(',', $val) as $x) { list($d) = bb_ical_data($x, $tzid); if ($d) $ev['exdates'][$d->format('Y-m-d')] = true; } break;
            case 'RECURRENCE-ID': list($d) = bb_ical_data($val, $tzid); if ($d) $ev['recid'] = $d->format('Y-m-d'); break;
            case 'UID': $ev['uid'] = $val; break;
            case 'STATUS': if (strtoupper(trim($val)) === 'CANCELLED') $ev['cancelado'] = true; break;
        }
    }
    return $evs;
}

/* Dias (Y-m-d) cobertos por uma ocorrência que começa em $ini, com a duração do evento. */
function bb_ical_dias_ocorrencia(DateTimeImmutable $ini, $allday, $seg, array &$dias, $de, $ate)
{
    $seg = min(max(0, (int) $seg), 60 * 86400);          // evento de mais de 60 dias: corta
    $fim = $ini->modify('+' . $seg . ' seconds');
    if ($allday) $ultimo = $seg > 0 ? $fim->modify('-1 day') : $ini;        // DTEND de dia inteiro é exclusivo
    else $ultimo = ($fim > $ini && $fim->format('H:i:s') === '00:00:00') ? $fim->modify('-1 day') : $fim;  // termina à meia-noite: não ocupa o dia seguinte
    $d = new DateTimeImmutable($ini->format('Y-m-d'), bb_tz());
    $u = $ultimo->format('Y-m-d');
    for ($i = 0; $i < 62 && $d->format('Y-m-d') <= $u; $i++, $d = $d->modify('+1 day')) {
        $k = $d->format('Y-m-d');
        if ($k >= $de && $k <= $ate) $dias[$k] = true;
    }
}

/* Inícios das ocorrências de um evento que se repete, até $ate (Y-m-d). */
function bb_ical_ocorrencias(DateTimeImmutable $ini, $rrule, $ate, $de = null)
{
    $r = [];
    foreach (explode(';', $rrule) as $p) { $kv = explode('=', $p, 2); if (count($kv) === 2) $r[strtoupper($kv[0])] = strtoupper($kv[1]); }
    $freq = $r['FREQ'] ?? '';
    $int = max(1, (int) ($r['INTERVAL'] ?? 1));
    $count = isset($r['COUNT']) ? (int) $r['COUNT'] : null;
    $until = null;
    if (!empty($r['UNTIL'])) { list($u) = bb_ical_data($r['UNTIL'], null); if ($u) $until = $u->format('Y-m-d'); }
    $limite = ($until !== null && $until < $ate) ? $until : $ate;
    $hora = $ini->format('H:i:s');
    $sem = ['MO' => 1, 'TU' => 2, 'WE' => 3, 'TH' => 4, 'FR' => 5, 'SA' => 6, 'SU' => 7];
    $byday = [];
    foreach (array_filter(explode(',', $r['BYDAY'] ?? '')) as $b) {
        if (preg_match('/^([+-]?\d+)?(MO|TU|WE|TH|FR|SA|SU)$/', $b, $m)) $byday[] = [$m[1] !== '' ? (int) $m[1] : 0, $sem[$m[2]]];
    }
    $bymd = array_map('intval', array_filter(explode(',', $r['BYMONTHDAY'] ?? '')));
    $ordinais = [1 => 'first', 'second', 'third', 'fourth', 'fifth'];
    $nomes = [1 => 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    $saida = [];
    $n = 0;
    $em = function (DateTimeImmutable $dia) use ($hora) { return new DateTimeImmutable($dia->format('Y-m-d') . ' ' . $hora, bb_tz()); };
    $base = new DateTimeImmutable($ini->format('Y-m-d'), bb_tz());
    // série antiga sem COUNT: pula direto para perto da janela (com folga de 2 meses
    // para ocorrências longas que ainda entram nela)
    $inicio = 0;
    if ($count === null && $de !== null) {
        $alvo = (new DateTimeImmutable($de, bb_tz()))->modify('-62 days');
        if ($alvo > $base) {
            $dd = $base->diff($alvo);
            $un = ['DAILY' => $dd->days, 'WEEKLY' => intdiv($dd->days, 7), 'MONTHLY' => $dd->y * 12 + $dd->m, 'YEARLY' => $dd->y];
            $inicio = max(0, intdiv($un[$freq] ?? 0, $int) - 1);
        }
    }
    for ($passo = $inicio; $passo < $inicio + 3000; $passo++) {
        $candidatos = [];
        if ($freq === 'DAILY') {
            $candidatos[] = $base->modify('+' . ($passo * $int) . ' days');
        } elseif ($freq === 'WEEKLY') {
            $seg = $base->modify('-' . ($base->format('N') - 1) . ' days')->modify('+' . ($passo * $int) . ' weeks');
            $dias = $byday ? array_map(function ($b) { return $b[1]; }, $byday) : [(int) $base->format('N')];
            sort($dias);
            foreach (array_unique($dias) as $wd) $candidatos[] = $seg->modify('+' . ($wd - 1) . ' days');
        } elseif ($freq === 'MONTHLY') {
            $mes = $base->modify('first day of this month')->modify('+' . ($passo * $int) . ' months');
            $tam = (int) $mes->format('t');
            if ($byday) {
                foreach ($byday as $b) {
                    list($ord, $wd) = $b;
                    $c = null;
                    if ($ord >= 1 && $ord <= 5) $c = $mes->modify($ordinais[$ord] . ' ' . $nomes[$wd] . ' of this month');
                    elseif ($ord <= -1 && $ord >= -5) $c = $mes->modify('last ' . $nomes[$wd] . ' of this month')->modify('-' . ((-$ord) - 1) . ' weeks');
                    if ($c !== null && $c->format('Y-m') === $mes->format('Y-m')) $candidatos[] = $c;
                    if ($ord === 0) { for ($d = $mes; $d->format('m') === $mes->format('m'); $d = $d->modify('+1 day')) if ((int) $d->format('N') === $wd) $candidatos[] = $d; }
                }
            } else {
                foreach ($bymd ?: [(int) $base->format('j')] as $md) {
                    $md = $md < 0 ? $tam + 1 + $md : $md;
                    if ($md >= 1 && $md <= $tam) $candidatos[] = $mes->modify('+' . ($md - 1) . ' days');
                }
            }
        } elseif ($freq === 'YEARLY') {
            $ano = (int) $base->format('Y') + $passo * $int;
            if (checkdate((int) $base->format('m'), (int) $base->format('d'), $ano)) $candidatos[] = new DateTimeImmutable($ano . $base->format('-m-d'), bb_tz());
        } else {
            return [$ini];   // repetição que não entendemos: conta só a primeira
        }
        usort($candidatos, function ($a, $b) { return $a <=> $b; });
        $passou = false;
        foreach ($candidatos as $c) {
            if ($c < $base) continue;
            $k = $c->format('Y-m-d');
            if ($k > $limite) { $passou = true; break; }
            $saida[] = $em($c);
            $n++;
            if ($count !== null && $n >= $count) return $saida;
        }
        if ($passou) break;
        if (!$candidatos && $freq !== 'MONTHLY' && $freq !== 'YEARLY') break;
    }
    return $saida;
}

/* Texto iCal -> lista de dias ocupados (Y-m-d) entre $de e $ate. null se não for iCal. */
function bb_ical_dias($txt, $de, $ate)
{
    if (strpos($txt, 'BEGIN:VCALENDAR') === false) return null;
    $evs = bb_ical_eventos($txt);
    $alteradas = [];   // uid => [dia original => true]: ocorrências que viraram evento próprio
    foreach ($evs as $e) if ($e['recid'] !== null) $alteradas[$e['uid']][$e['recid']] = true;
    $dias = [];
    foreach ($evs as $e) {
        if ($e['cancelado']) continue;
        $ini = $e['start'];
        if ($e['fim'] !== null) $seg = $e['fim']->getTimestamp() - $ini->getTimestamp();
        elseif ($e['dur'] !== null) $seg = $e['dur'];
        else $seg = $e['allday'] ? 86400 : 0;
        if ($e['rrule'] && $e['recid'] === null) {
            $fora = $e['exdates'] + ($alteradas[$e['uid']] ?? []);
            foreach (bb_ical_ocorrencias($ini, $e['rrule'], $ate, $de) as $oc) {
                if (isset($fora[$oc->format('Y-m-d')])) continue;
                bb_ical_dias_ocorrencia($oc, $e['allday'], $seg, $dias, $de, $ate);
            }
        } else {
            bb_ical_dias_ocorrencia($ini, $e['allday'], $seg, $dias, $de, $ate);
        }
    }
    $dias = array_keys($dias);
    sort($dias);
    return $dias;
}

/* ---------- planilha (CSV) ---------- */

/* Datas de uma célula: 23/11/2026, 23-11-26, 2026-11-23 ou 23/11 (sem ano: a próxima). */
function bb_csv_datas_celula($c, DateTimeImmutable $hoje)
{
    $saida = [];
    if (preg_match_all('~(?<!\d)(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)~', $c, $mm, PREG_SET_ORDER)) {
        foreach ($mm as $m) if (checkdate((int) $m[2], (int) $m[3], (int) $m[1])) $saida[] = sprintf('%04d-%02d-%02d', $m[1], $m[2], $m[3]);
        return $saida;
    }
    if (preg_match_all('~(?<![\d/.-])(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?(?![\d/.-])~', $c, $mm, PREG_SET_ORDER)) {
        foreach ($mm as $m) {
            $d = (int) $m[1]; $mes = (int) $m[2];
            if (isset($m[3]) && $m[3] !== '') {
                $a = (int) $m[3];
                if ($a < 100) $a += 2000;
            } else {
                // sem ano: o ano que deixa a data entre 1 mês atrás e 11 meses à frente
                $a = (int) $hoje->format('Y');
                if (checkdate($mes, $d, $a) && sprintf('%04d-%02d-%02d', $a, $mes, $d) < $hoje->modify('-1 month')->format('Y-m-d')) $a++;
            }
            if ($a >= 2000 && $a <= 2100 && checkdate($mes, $d, $a)) $saida[] = sprintf('%04d-%02d-%02d', $a, $mes, $d);
        }
    }
    return $saida;
}

/* Texto CSV -> [dias ocupados entre $de e $ate, achou alguma data na planilha?]. null se não for CSV. */
function bb_csv_dias($txt, $de, $ate)
{
    if (preg_match('/^\s*<(!doctype|html)/i', $txt)) return null;
    $hoje = bb_hoje();
    $f = fopen('php://temp', 'r+');
    fwrite($f, $txt);
    rewind($f);
    $dias = [];
    $achou = false;
    while (($cels = fgetcsv($f, 0, ',', '"', '\\')) !== false) {
        $linha = implode(' ', array_map('strval', $cels));
        if (trim($linha) === '') continue;
        $datas = [];
        foreach ($cels as $c) foreach (bb_csv_datas_celula((string) $c, $hoje) as $d) $datas[] = $d;
        if (!$datas) continue;
        $achou = true;
        if (preg_match('/\b(livre|dispon[ií]vel|vago|cancelad[oa]|cancelou)\b/iu', $linha)) continue;
        if (count($datas) === 2 && $datas[1] > $datas[0] && (strtotime($datas[1]) - strtotime($datas[0])) <= 31 * 86400) {
            // período: início e fim na mesma linha
            for ($t = strtotime($datas[0] . ' 12:00'); date('Y-m-d', $t) <= $datas[1]; $t += 86400) $datas[] = date('Y-m-d', $t);
        }
        foreach ($datas as $d) if ($d >= $de && $d <= $ate) $dias[$d] = true;
    }
    fclose($f);
    $dias = array_keys($dias);
    sort($dias);
    return [$dias, $achou];
}

/* ---------- leitura de uma lancha ---------- */

/* Lê a agenda e grava. $l = [id, nome, agenda_tipo, agenda_url].
   Devolve ['ok' => bool, 'total' => n, 'entraram' => n, 'sairam' => n] ou ['ok' => false, 'erro' => texto]. */
function bb_agenda_ler_lancha(array $l)
{
    $tipo = $l['agenda_tipo'] ?? '';
    if (!in_array($tipo, ['google', 'planilha'], true) || empty($l['agenda_url'])) return ['ok' => false, 'erro' => 'Esta lancha não tem agenda conectada por link.'];
    $hoje = bb_hoje();
    $de = $hoje->format('Y-m-d');
    $ate = $hoje->modify('+' . BB_AGENDA_DIAS . ' days')->format('Y-m-d');
    $google = $tipo === 'google';

    list($st, $txt) = bb_agenda_baixa(bb_agenda_url_real($tipo, $l['agenda_url']));
    $erro = null;
    $dias = null;
    if ($st === 0 && $txt === 'endereco') $erro = 'O link salvo não é um endereço válido. Cole o link de novo.';
    elseif ($st === 0) $erro = 'Não consegui abrir o link agora. Tento de novo na próxima leitura.';
    elseif (in_array($st, [401, 403, 404, 410], true)) {
        $erro = $google ? 'O Google recusou o link. O dono pode ter trocado o endereço secreto da agenda: peça o link de novo.'
                        : 'A planilha não está publicada na web. Peça ao dono para publicar de novo (Arquivo, Compartilhar, Publicar na Web, formato CSV).';
    } elseif ($st >= 500 || $st < 200 || $st >= 300) $erro = 'O site da agenda não respondeu direito agora. Tento de novo na próxima leitura.';
    elseif ($google) {
        $dias = bb_ical_dias($txt, $de, $ate);
        if ($dias === null) $erro = 'Esse link não é de uma agenda. Confira se é o "Endereço secreto no formato iCal" (termina em .ics).';
    } else {
        $r = bb_csv_dias($txt, $de, $ate);
        if ($r === null) $erro = 'A planilha não está publicada como CSV. Peça ao dono para publicar na web escolhendo "Valores separados por vírgula (.csv)".';
        elseif (!$r[1] && trim($txt) !== '') $erro = 'Não achei nenhuma data na planilha. As datas precisam estar como 23/11/2026.';
        else $dias = $r[0];
    }

    if ($erro !== null) {
        bb_supabase('POST', 'rpc/bb_agenda_falha', ['p_lancha' => $l['id'], 'p_erro' => $erro]);
        return ['ok' => false, 'erro' => $erro];
    }
    list($st2, $res) = bb_supabase('POST', 'rpc/bb_agenda_troca', ['p_lancha' => $l['id'], 'p_origem' => $tipo, 'p_dias' => $dias, 'p_de' => $de]);
    if ($st2 !== 200 || !is_array($res)) return ['ok' => false, 'erro' => 'Li a agenda, mas não consegui gravar no painel. Tento de novo na próxima leitura.'];
    if (($res['entraram'] ?? 0) + ($res['sairam'] ?? 0) > 0) @unlink(BB_CACHE . '/ocupadas.json');   // o calendário do site pega na hora
    return ['ok' => true, 'total' => (int) ($res['total'] ?? count($dias)), 'entraram' => (int) ($res['entraram'] ?? 0), 'sairam' => (int) ($res['sairam'] ?? 0)];
}

/* Lanchas com agenda por link. */
function bb_agenda_lanchas($id = null)
{
    $q = 'bb_lanchas?select=id,nome,agenda_tipo,agenda_url&agenda_tipo=in.(google,planilha)&agenda_url=not.is.null';
    if ($id !== null) $q .= '&id=eq.' . rawurlencode($id);
    list($st, $d) = bb_supabase('GET', $q);
    return ($st === 200 && is_array($d)) ? $d : null;
}
