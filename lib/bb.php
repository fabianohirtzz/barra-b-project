<?php
/* Barra Boat Floripa | lib/bb.php
   Leitura do Supabase pelo servidor, com a service_role do config.local.php.
   Tudo passa por um cache em disco (pasta cache/, fechada pela web). Se o Supabase
   cair, o site continua com a última cópia boa; sem cópia nenhuma, devolve null e
   quem chamou serve a página estática. Compatível com PHP 7.4+. */

define('BB_RAIZ', dirname(__DIR__));
define('BB_SUPABASE', 'https://euzmbswywwhmicjlszqw.supabase.co');
define('BB_CACHE', BB_RAIZ . '/cache');

function bb_config($nome)
{
    static $cfg = null;
    if ($cfg === null) {
        $cfg = [];
        $arq = BB_RAIZ . '/config.local.php';
        if (is_file($arq)) {
            $cfg = (function ($arq) { include $arq; return get_defined_vars(); })($arq);
            unset($cfg['arq']);
        }
    }
    return isset($cfg[$nome]) ? $cfg[$nome] : null;
}

/* Chamada crua ao PostgREST. Devolve [status, corpo decodificado] ou [0, null]. */
function bb_supabase($metodo, $caminho, $corpo = null, $prefer = null)
{
    $chave = bb_config('SUPABASE_SERVICE_KEY');
    if (!$chave || strpos($chave, 'COLE_AQUI') !== false) return [0, null];
    $cab = ['apikey: ' . $chave, 'Authorization: Bearer ' . $chave, 'Accept: application/json'];
    if ($corpo !== null) $cab[] = 'Content-Type: application/json';
    if ($prefer) $cab[] = 'Prefer: ' . $prefer;
    $ch = curl_init(BB_SUPABASE . '/rest/v1/' . $caminho);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $metodo,
        CURLOPT_HTTPHEADER => $cab,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 8,
    ]);
    if ($corpo !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($corpo));
    $txt = curl_exec($ch);
    $st = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($txt === false) return [0, null];
    return [$st, json_decode($txt, true)];
}

/* Lê com cache. $busca é uma função que devolve o dado ou null em falha.
   Cópia nova (< $ttl s) sai do disco; vencida, tenta buscar e, se falhar, usa a vencida. */
function bb_cache($nome, $ttl, callable $busca)
{
    $arq = BB_CACHE . '/' . preg_replace('/[^a-z0-9_-]/i', '_', $nome) . '.json';
    $tem = is_file($arq);
    if ($tem && (time() - filemtime($arq)) < $ttl) {
        $d = json_decode(file_get_contents($arq), true);
        if ($d !== null) return $d;
    }
    $novo = $busca();
    if ($novo !== null) {
        if (!is_dir(BB_CACHE)) @mkdir(BB_CACHE, 0755, true);
        $tmp = $arq . '.' . getmypid() . '.tmp';
        if (@file_put_contents($tmp, json_encode($novo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) !== false) @rename($tmp, $arq);
        return $novo;
    }
    if ($tem) {
        @touch($arq, time() - $ttl + 60);   // tenta de novo em 1 minuto, sem martelar o Supabase
        return json_decode(file_get_contents($arq), true);
    }
    return null;
}

function bb_limpa_cache()
{
    foreach (glob(BB_CACHE . '/*.json') ?: [] as $f) @unlink($f);
}

/* Lanchas que aparecem no site, na ordem do painel. */
function bb_lanchas()
{
    return bb_cache('lanchas', 120, function () {
        list($st, $d) = bb_supabase('GET', 'bb_lanchas?select=slug,nome,pes,passageiros,regiao,descricao,itens,capa_url,fotos,ordem&ativo=eq.true&order=ordem,nome');
        return ($st === 200 && is_array($d)) ? $d : null;
    });
}

/* {slug: [AAAA-MM-DD]} dos próximos 12 meses: passeios, agenda do dono e bloqueios. */
function bb_ocupadas()
{
    return bb_cache('ocupadas', 120, function () {
        $ate = date('Y-m-d', strtotime('+366 days'));
        list($st, $d) = bb_supabase('POST', 'rpc/bb_disponibilidade_site', ['ate' => $ate]);
        return ($st === 200 && is_array($d)) ? $d : null;
    });
}

/* Perguntas, avaliações e roteiros que o painel edita. null se o banco não respondeu
   (o site fica com o texto do molde). */
function bb_conteudo()
{
    return bb_cache('conteudo', 120, function () {
        list($s1, $faq) = bb_supabase('GET', 'bb_faq?select=pergunta,resposta&ativo=eq.true&order=ordem,pergunta');
        list($s2, $av) = bb_supabase('GET', 'bb_avaliacoes?select=nome,texto,nota,data_label,idioma&ativo=eq.true&order=ordem,created_at');
        list($s3, $rt) = bb_supabase('GET', 'bb_roteiros?select=slug,nome,paradas,regras&order=ordem');
        if ($s1 !== 200 || $s2 !== 200 || $s3 !== 200 || !is_array($faq) || !is_array($av) || !is_array($rt)) return null;
        // vídeos: só os prontos (o cron já comprimiu); antes da migração de 25/11 a coluna não existe e fica o molde
        list($s4, $ig) = bb_supabase('GET', 'bb_instagram?select=video_url,poster_url,legenda,largura,altura&ativo=eq.true&pronto=eq.true&order=ordem,created_at');
        // fichas dos roteiros (migração 16): leitura à parte, para a falta da coluna não derrubar o resto
        list($s5, $fi) = bb_supabase('GET', 'bb_roteiros?select=slug,fichas');
        if ($s5 === 200 && is_array($fi)) {
            $por = [];
            foreach ($fi as $x) if (isset($x['slug'])) $por[$x['slug']] = $x['fichas'] ?? null;
            foreach ($rt as &$r) $r['fichas'] = $por[$r['slug']] ?? null;
            unset($r);
        }
        return ['faq' => $faq, 'avaliacoes' => $av, 'roteiros' => $rt, 'instagram' => ($s4 === 200 && is_array($ig)) ? $ig : []];
    });
}
