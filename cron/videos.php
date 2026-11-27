<?php
// Barra Boat Floripa | cron/videos.php
// Também troca as fotos de lancha que a IA melhorou (lib/fotos_ia.php).
// Prepara os vídeos do Instagram enviados pelo painel (fila em midia/instagram/fila/) com
// lib/videos.php e marca cada um como pronto no banco. Só roda pela linha de comando
// (cron do cPanel, a cada 5 min):
//
//   */5 * * * *   /usr/local/bin/php -q /home/barraboa/public_html/cron/videos.php > /dev/null 2>&1

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

require_once dirname(__DIR__) . '/lib/bb.php';
require_once dirname(__DIR__) . '/lib/videos.php';
require_once dirname(__DIR__) . '/lib/fotos_ia.php';

define('MIDIA', BB_RAIZ . '/midia/instagram');
define('POR_RODADA', 3);

if (!is_dir(BB_CACHE)) @mkdir(BB_CACHE, 0755, true);
$trava = fopen(BB_CACHE . '/videos.lock', 'c');
if (!$trava || !flock($trava, LOCK_EX | LOCK_NB)) { echo "Outra rodada ainda está preparando vídeos.\n"; exit(0); }
if (!is_executable(BB_FFMPEG)) { fwrite(STDERR, "ffmpeg não encontrado em cron/bin/ffmpeg.\n"); exit(1); }

/* Grava no vídeo do banco. true só se achou a linha (o PATCH responde ok mesmo sem achar nada). */
function marca($video_url, $dados)
{
    list($st, $r) = bb_supabase('PATCH', 'bb_instagram?select=id&video_url=eq.' . rawurlencode($video_url), $dados, 'return=representation');
    return $st === 200 && is_array($r) && count($r) > 0;
}

function tem_linha($video_url)
{
    list($st, $r) = bb_supabase('GET', 'bb_instagram?select=id&video_url=eq.' . rawurlencode($video_url));
    return $st === 200 ? (is_array($r) && count($r) > 0) : null;   // null: banco fora do ar
}

$fila = array_values(array_filter(glob(MIDIA . '/fila/*') ?: [], function ($f) {
    return preg_match('/\/[0-9]{6}-[0-9a-f]{8}\.(mp4|mov|m4v|webm|3gp)$/i', $f);
}));
sort($fila);
$feitos = 0;
foreach (array_slice($fila, 0, POR_RODADA) as $orig) {
    $id = pathinfo($orig, PATHINFO_FILENAME);
    $url = "/midia/instagram/$id.mp4";
    // o painel grava a linha logo depois do envio; sem linha há mais de 2 horas, o envio foi abandonado
    $linha = tem_linha($url);
    if ($linha === null) { echo "Banco fora do ar: fica para a próxima rodada.\n"; break; }
    if (!$linha) {
        if (time() - filemtime($orig) > 7200) { @unlink($orig); echo "$id: envio abandonado, apagado.\n"; }
        continue;
    }
    $antes = filesize($orig);
    $t = microtime(true);
    $r = bb_video_preparar($orig, MIDIA . "/$id.mp4", MIDIA . "/$id.webp");
    if (!$r['ok']) {
        marca($url, ['erro' => $r['erro']]);
        rename($orig, $orig . '.erro');   // não tenta de novo; fica para conferir
        echo "$id: falhou. " . $r['saida'] . "\n";
        continue;
    }
    $capa = is_file(MIDIA . "/$id.webp") ? "/midia/instagram/$id.webp" : null;
    if (marca($url, ['pronto' => true, 'erro' => null, 'largura' => $r['w'] ?: null, 'altura' => $r['h'] ?: null, 'poster_url' => $capa])) {
        @unlink($orig);
        $feitos++;
        printf("%s: pronto em %.0f s (%s, %d KB -> %d KB, %dx%d)\n", $id, microtime(true) - $t, $r['copia'] ? 'só reorganizado' : 'comprimido', $antes / 1024, filesize(MIDIA . "/$id.mp4") / 1024, $r['w'], $r['h']);
    } else {
        echo "$id: pronto, mas não consegui gravar no banco (tento de novo na próxima rodada).\n";
        @unlink(MIDIA . "/$id.mp4");
    }
}
// fotos das lanchas que a IA melhorou no computador (tools/melhorar_fotos.py)
$feitos += bb_fotos_ia_trocar();
if ($feitos) bb_limpa_cache();
flock($trava, LOCK_UN);
