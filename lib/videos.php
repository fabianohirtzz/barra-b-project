<?php
/* Barra Boat Floripa | lib/videos.php
   Prepara um vídeo para a home com o ffmpeg do servidor (cron/bin/ffmpeg, fora do Git):
   comprime até 1080 px de largura (H.264 + AAC, começa a tocar antes de baixar tudo) e tira
   a capa em WebP. Se o original já é um MP4 (H.264) menor que a versão comprimida, fica ele,
   só reorganizado (sem recomprimir). A hospedagem limita processos paralelos: tudo com uma
   tarefa só (threads 1). Um vídeo de 15 s leva uns 25 s. */

define('BB_FFMPEG', dirname(__DIR__) . '/cron/bin/ffmpeg');

function bb_ff($args, &$saida = null)
{
    $linhas = [];
    exec('nice -n 10 ' . escapeshellarg(BB_FFMPEG) . ' -hide_banner -nostdin ' . $args . ' 2>&1', $linhas, $cod);
    $saida = implode("\n", $linhas);
    return $cod === 0;
}

/* Codecs e tamanho da imagem (já virada, se o celular gravou de lado). */
function bb_video_info($arq)
{
    bb_ff('-i ' . escapeshellarg($arq), $t);   // sem arquivo de saída o ffmpeg "falha", mas descreve o arquivo
    $v = preg_match('/Stream #\S+.*?Video: (\w+).*?, (\d{2,5})x(\d{2,5})/', $t, $m) ? $m : null;
    $rot = 0;
    if (preg_match('/rotation of (-?\d+(?:\.\d+)?) degrees/', $t, $r) || preg_match('/rotate\s*:\s*(-?\d+)/', $t, $r)) $rot = (int) round(abs((float) $r[1])) % 360;
    $deitado = $rot === 90 || $rot === 270;
    return [
        'video' => $v ? $v[1] : null,
        'w' => $v ? (int) ($deitado ? $v[3] : $v[2]) : 0,
        'h' => $v ? (int) ($deitado ? $v[2] : $v[3]) : 0,
        'audio' => preg_match('/Stream #\S+.*?Audio: (\w+)/', $t, $a) ? $a[1] : null,
    ];
}

/* $orig -> $mp4 e $capa. Devolve ['ok' => bool, 'copia' => bool, 'w', 'h', 'erro' => texto ou null, 'saida']. */
function bb_video_preparar($orig, $mp4, $capa)
{
    $i = bb_video_info($orig);
    if (!$i['video']) return ['ok' => false, 'copia' => false, 'w' => 0, 'h' => 0, 'saida' => '', 'erro' => 'Esse arquivo não tem um vídeo que o servidor consiga abrir. Envie de novo o vídeo baixado do Instagram.'];
    $tmp = $mp4 . '.tmp.mp4';
    $ok = bb_ff('-y -threads 1 -filter_threads 1 -i ' . escapeshellarg($orig) .
        ' -vf "scale=\'min(1080,iw)\':-2" -c:v libx264 -preset medium -crf 23 -x264-params threads=1:lookahead_threads=1' .
        ' -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k -threads 1 ' . escapeshellarg($tmp), $saida);
    $mp4orig = in_array(strtolower(pathinfo($orig, PATHINFO_EXTENSION)), ['mp4', 'm4v'], true) && $i['video'] === 'h264' && in_array($i['audio'], [null, 'aac'], true);
    $copia = $mp4orig && (!$ok || !is_file($tmp) || filesize($tmp) >= filesize($orig));
    if ($copia) $ok = bb_ff('-y -i ' . escapeshellarg($orig) . ' -c copy -movflags +faststart ' . escapeshellarg($tmp), $saida);
    if (!$ok || !is_file($tmp) || filesize($tmp) < 1000) {
        @unlink($tmp);
        return ['ok' => false, 'copia' => $copia, 'w' => 0, 'h' => 0, 'saida' => substr($saida, -800), 'erro' => 'Não consegui preparar este vídeo. Tente enviar de novo, de preferência o arquivo baixado do Instagram.'];
    }
    rename($tmp, $mp4);
    // capa: um quadro do primeiro segundo (ou o primeiro, se o vídeo for curtinho), 720 px de largura
    $vf = ' -frames:v 1 -vf "scale=\'min(720,iw)\':-2" -c:v libwebp -quality 80 ' . escapeshellarg($capa);
    if (!bb_ff('-y -ss 1 -i ' . escapeshellarg($mp4) . $vf) || !is_file($capa) || filesize($capa) < 100) bb_ff('-y -i ' . escapeshellarg($mp4) . $vf);
    $f = bb_video_info($mp4);
    return ['ok' => true, 'copia' => $copia, 'w' => $f['w'], 'h' => $f['h'], 'saida' => '', 'erro' => null];
}
