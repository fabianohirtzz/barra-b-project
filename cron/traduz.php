<?php
// Barra Boat Floripa | cron/traduz.php
// Traduz o que o site mostrou em outro idioma e ainda não tinha tradução (em geral texto novo
// que a equipe escreveu no painel: lancha, pergunta, parada de roteiro, cartões). A fila é
// traducoes/faltam.json, preenchida pelo site.php; o resultado vai para traducoes/<idioma>.json,
// que o site lê junto com o i18n/<idioma>.json do Git. Só roda pela linha de comando:
//
//   */15 * * * *   php -q $HOME/public_html/cron/traduz.php > /dev/null 2>&1
//
// Precisa de ANTHROPIC_API_KEY no config.local.php. Sem a chave, a fila só espera.

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

require_once dirname(__DIR__) . '/lib/bb.php';
require_once dirname(__DIR__) . '/lib/site.php';
require_once dirname(__DIR__) . '/lib/i18n.php';
require_once dirname(__DIR__) . '/lib/claude.php';

const POR_RODADA = 120;   // textos por idioma em cada rodada (o resto fica para a próxima)
const TENTATIVAS = 3;     // texto que a conferência recusa 3 vezes sai da fila

if (!is_dir(BB_TRAD_DIR)) @mkdir(BB_TRAD_DIR, 0755, true);
$trava = fopen(BB_TRAD_DIR . '/traduz.lock', 'c');
if (!$trava || !flock($trava, LOCK_EX | LOCK_NB)) { echo "Outra rodada ainda está rodando.\n"; exit(0); }
if (!bb_claude_chave()) { echo "Sem ANTHROPIC_API_KEY no config.local.php: nada traduzido.\n"; exit(0); }

$arq_fila = BB_TRAD_DIR . '/faltam.json';
$arq_tent = BB_TRAD_DIR . '/tentativas.json';
$le = function ($arq) { return is_file($arq) ? (json_decode(file_get_contents($arq), true) ?: []) : []; };
$fila = $le($arq_fila);

// Varre o site com os dados de agora (o que a equipe mudou no painel) e põe na fila o que nenhum
// dicionário tem, sem esperar alguém visitar a página no outro idioma.
$lanchas = bb_lanchas();
$conteudo = bb_conteudo();
$paginas = [''];
foreach (glob(BB_RAIZ . '/*/index.html') ?: [] as $f) $paginas[] = basename(dirname($f)) . '/';
foreach ((array) $lanchas as $l) $paginas[] = 'lanchas/' . $l['slug'] . '/';
$paginas = array_unique(array_filter($paginas, function ($p) { return !preg_match('#^(painel|docs|supabase|tools)/#', $p); }));
$chaves = [];
foreach ($paginas as $p) {
    list($st, $h) = bb_render($p, $lanchas, 'api/disponibilidade.php', $conteudo);
    if ($st === 200) foreach (bb_i18n_chaves_da_pagina($h, $p) as $c) $chaves[$c] = true;
}
foreach (bb_i18n_textos_js() as $c) $chaves[$c] = true;
foreach (array_keys($chaves) as $c) {
    foreach (array_keys(BB_IDIOMAS) as $idi) {
        if ($idi === 'pt') continue;
        $d = bb_i18n_dic($idi);
        if (!isset($d[$c]) && !in_array($idi, isset($fila[$c]) ? $fila[$c] : [], true)) $fila[$c][] = $idi;
    }
}
if (!$fila) { echo "Fila vazia.\n"; exit(0); }
$tent = $le($arq_tent);

// por idioma: o que falta e ainda não está em nenhum dicionário
$por_idioma = [];
foreach ($fila as $texto => $idiomas) {
    foreach ((array) $idiomas as $idi) {
        if (!bb_idioma_valido($idi) || $idi === 'pt') continue;
        $d = bb_i18n_dic($idi);
        if (isset($d[$texto])) continue;
        $por_idioma[$idi][] = $texto;
    }
}

$feitos = [];   // texto => [idiomas resolvidos]
foreach ($por_idioma as $idi => $textos) {
    $textos = array_slice($textos, 0, POR_RODADA);
    try {
        $novo = bb_claude_traduz_tudo($idi, $textos, [], 40);
    } catch (Throwable $e) {
        fwrite(STDERR, "$idi: " . $e->getMessage() . "\n");
        continue;
    }
    $arq = BB_TRAD_DIR . "/$idi.json";
    $dic = $le($arq);
    $dic = $novo + $dic;
    ksort($dic, SORT_STRING);
    file_put_contents($arq, json_encode($dic, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n", LOCK_EX);
    foreach ($textos as $t) {
        $k = $idi . '|' . $t;
        if (isset($novo[$t])) { $feitos[$t][] = $idi; unset($tent[$k]); continue; }
        $tent[$k] = (isset($tent[$k]) ? $tent[$k] : 0) + 1;
        if ($tent[$k] >= TENTATIVAS) { $feitos[$t][] = $idi; unset($tent[$k]); fwrite(STDERR, "$idi: desisti de \"" . mb_substr($t, 0, 80) . "\"\n"); }
    }
    printf("%s: %d de %d traduzidos\n", $idi, count($novo), count($textos));
}

// tira da fila o que foi resolvido (relê com trava: o site pode ter anotado coisa nova no meio)
$fp = fopen($arq_fila, 'c+');
if ($fp && flock($fp, LOCK_EX)) {
    $atual = json_decode(stream_get_contents($fp), true) ?: [];
    foreach ($atual as $t => $idiomas) {
        $resta = array_values(array_filter((array) $idiomas, function ($i) use ($t, $feitos) {
            if ($i === 'pt' || !bb_idioma_valido($i)) return false;
            if (isset($feitos[$t]) && in_array($i, $feitos[$t], true)) return false;
            $d = bb_i18n_dic($i);
            return !isset($d[$t]);
        }));
        if ($resta) $atual[$t] = $resta; else unset($atual[$t]);
    }
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($atual, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    flock($fp, LOCK_UN);
    fclose($fp);
    printf("%d textos ainda na fila.\n", count($atual));
}
file_put_contents($arq_tent, json_encode($tent, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
flock($trava, LOCK_UN);
