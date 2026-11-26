<?php
/* Traduz o site inteiro para os idiomas do BB_IDIOMAS e grava i18n/<idioma>.json (vai para o Git).
   Junta os textos de todas as páginas montadas pelo PHP (com o conteúdo da carga do banco), do 404
   e dos T('...') do JavaScript, e manda à API só o que ainda não tem tradução. Tradução corrigida
   à mão no JSON nunca é refeita. Texto que mudou em português vira chave nova (a velha some com --limpar).

   Uso:
     ANTHROPIC_API_KEY=... php tools/i18n.php                 (todos os idiomas)
     php tools/i18n.php --idiomas=es,en
     php tools/i18n.php --listar                              (só conta o que falta, sem chamar a API)
     php tools/i18n.php --limpar                              (tira dos JSON as chaves que o site não usa mais) */

require dirname(__DIR__) . '/lib/bb.php';
require dirname(__DIR__) . '/lib/site.php';
require dirname(__DIR__) . '/lib/i18n.php';
require dirname(__DIR__) . '/lib/claude.php';

$args = array_slice($argv, 1);
$idiomas = array_values(array_diff(array_keys(BB_IDIOMAS), ['pt']));
$listar = in_array('--listar', $args, true);
$limpar = in_array('--limpar', $args, true);
$refazer = null;   // --refazer=marinheiro: traduz de novo os textos em português que têm essa palavra (ex.: glossário mudou)
foreach ($args as $a) {
    if (preg_match('/^--idiomas=(.+)$/', $a, $m)) $idiomas = array_values(array_intersect(explode(',', $m[1]), $idiomas));
    if (preg_match('/^--refazer=(.+)$/', $a, $m)) $refazer = '/' . str_replace('/', '\/', $m[1]) . '/iu';
}

/* ---------- os mesmos dados do conferir_php.php ---------- */
function carga($arq)
{
    preg_match('/\$carga\$(.*?)\$carga\$/s', file_get_contents(BB_RAIZ . '/supabase/seed/' . $arq), $m);
    return json_decode($m[1], true);
}
$lanchas = carga('01-lanchas-roteiros.sql');
$conteudo = carga('02-conteudo.sql');
foreach ($conteudo['roteiros'] as &$r) $r['nome'] = $r['slug'] === 'ilha-do-campeche' ? 'Ilha do Campeche' : 'Costa da Lagoa';
unset($r);
$conteudo['instagram'] = carga('03-instagram.sql');

$paginas = [''];
foreach (glob(BB_RAIZ . '/*/index.html') as $f) $paginas[] = basename(dirname($f)) . '/';
foreach (glob(BB_RAIZ . '/lanchas/*/index.html') as $f) $paginas[] = 'lanchas/' . basename(dirname($f)) . '/';
$paginas = array_values(array_filter($paginas, function ($p) { return !preg_match('#^(painel|docs|supabase|tools|node_modules)/#', $p); }));

$onde = [];   // texto => primeira página onde aparece (contexto para a tradução)
$todas = [];
$junta = function ($lista, $pg) use (&$onde, &$todas) {
    foreach ($lista as $c) { $todas[$c] = true; if (!isset($onde[$c])) $onde[$c] = $pg; }
};
foreach ($paginas as $p) {
    list($st, $h) = bb_render($p, $lanchas, 'api/disponibilidade.php', $conteudo);
    if ($st !== 200) { echo "  (pulei /$p: $st)\n"; continue; }
    $junta(bb_i18n_chaves_da_pagina($h, $p), '/' . $p);
}
$junta(bb_i18n_chaves_da_pagina(bb_molde('404.html'), '404'), 'página 404');
$junta(bb_i18n_textos_js(), 'mensagens do JavaScript (formulário de reserva, calendário, vídeos)');
$todas = array_keys($todas);
echo count($paginas) . " páginas, " . count($todas) . " textos para traduzir.\n";

if (!is_dir(BB_I18N_DIR)) mkdir(BB_I18N_DIR, 0755, true);
foreach ($idiomas as $idi) {
    $arq = BB_I18N_DIR . "/$idi.json";
    $dic = is_file($arq) ? (json_decode(file_get_contents($arq), true) ?: []) : [];
    if ($limpar) {
        $antes = count($dic);
        $dic = array_intersect_key($dic, array_flip($todas));
        echo "$idi: " . ($antes - count($dic)) . " chaves velhas tiradas\n";
    }
    if ($refazer) foreach (array_keys($dic) as $k) if (preg_match($refazer, $k)) unset($dic[$k]);
    $falta = array_values(array_filter($todas, function ($t) use ($dic) { return !isset($dic[$t]); }));
    echo "$idi: " . count($falta) . " sem tradução\n";
    if (!$falta || $listar) { if ($limpar) grava($arq, $dic); continue; }
    $ini = microtime(true);
    // grava a cada lote: se a rodada cair no meio, a próxima continua de onde parou
    $novo = bb_claude_traduz_tudo($idi, $falta, $onde, 50, function ($n, $total, $lote) use ($idi, $arq, &$dic) {
        $dic = $lote + $dic;
        grava($arq, $dic);
        echo "  $idi: $n de $total\n";
    });
    $sobrou = count($falta) - count($novo);
    echo "$idi: " . count($novo) . " traduzidos em " . round(microtime(true) - $ini) . " s" . ($sobrou ? ", $sobrou recusados na conferência (rode de novo)" : '') . "\n";
}
$in = $out = 0;
foreach (isset($GLOBALS['bb_claude_uso']) ? $GLOBALS['bb_claude_uso'] : [] as $u) { $in += isset($u['input_tokens']) ? $u['input_tokens'] : 0; $out += isset($u['output_tokens']) ? $u['output_tokens'] : 0; }
if ($in) printf("Uso: %d tokens de entrada, %d de saída (cerca de US$ %.2f)\n", $in, $out, $in * 4 / 1e6 + $out * 20 / 1e6);

function grava($arq, $dic)
{
    ksort($dic, SORT_STRING);
    file_put_contents($arq, json_encode($dic, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n");
}
