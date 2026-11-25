<?php
/* Barra Boat Floripa | api/videos.php
   Vídeos do Instagram da home enviados pelo painel. Dona e atendente.
   O arquivo entra na fila (midia/instagram/fila/, fechada para a web) como veio do celular;
   o cron/videos.php comprime com o ffmpeg, gera a capa e marca o vídeo como pronto.

   POST multipart acao=enviar, video=<arquivo>
     -> {"ok": true, "video_url": "/midia/instagram/<id>.mp4", "poster_url": "/midia/instagram/<id>.webp"}
        (os dois arquivos só existem depois do cron; o painel grava a linha com pronto = false)
   POST json {"acao": "apagar", "video_url"} -> {"ok": true} */

require_once dirname(__DIR__) . '/lib/painel.php';

bb_quem_pede(['dona', 'atendente']);

define('BB_MIDIA', BB_RAIZ . '/midia/instagram');
$multipart = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') === 0;
$in = $multipart ? $_POST : bb_entrada();
$acao = (string) ($in['acao'] ?? '');

if ($acao === 'enviar') {
    $f = $_FILES['video'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK) {
        $grande = $f && in_array($f['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true);
        bb_responde(400, ['ok' => false, 'erro' => $grande ? 'Vídeo grande demais para enviar.' : 'O vídeo não chegou. Tente de novo com uma internet mais firme.']);
    }
    if ($f['size'] > 400 * 1048576) bb_responde(400, ['ok' => false, 'erro' => 'Vídeo grande demais (mais de 400 MB). Envie um trecho menor.']);
    // o tipo vem do conteúdo do arquivo, não do nome
    $tipo = function_exists('finfo_open') ? finfo_file(finfo_open(FILEINFO_MIME_TYPE), $f['tmp_name']) : '';
    $ext = ['video/mp4' => 'mp4', 'video/quicktime' => 'mov', 'video/x-m4v' => 'm4v', 'video/webm' => 'webm', 'video/3gpp' => '3gp'][$tipo] ?? null;
    if ($ext === null) bb_responde(400, ['ok' => false, 'erro' => 'Esse arquivo não é um vídeo que o site aceita (MP4, MOV ou WebM).']);
    if (!is_dir(BB_MIDIA . '/fila') && !@mkdir(BB_MIDIA . '/fila', 0755, true)) bb_responde(500, ['ok' => false, 'erro' => 'Não consegui guardar o vídeo no servidor.']);
    $id = date('ymd') . '-' . bin2hex(random_bytes(4));
    if (!move_uploaded_file($f['tmp_name'], BB_MIDIA . "/fila/$id.$ext")) bb_responde(500, ['ok' => false, 'erro' => 'Não consegui guardar o vídeo no servidor.']);
    bb_responde(200, ['ok' => true, 'video_url' => "/midia/instagram/$id.mp4", 'poster_url' => "/midia/instagram/$id.webp"]);
}

if ($acao === 'apagar') {
    // só apaga o que é nosso (midia/instagram/); os vídeos que vieram com o site ficam em assets/ e só saem da lista
    $url = (string) ($in['video_url'] ?? '');
    if (preg_match('#^/midia/instagram/([0-9]{6}-[0-9a-f]{8})\.mp4$#', $url, $m)) {
        @unlink(BB_MIDIA . "/{$m[1]}.mp4");
        @unlink(BB_MIDIA . "/{$m[1]}.webp");
        foreach (glob(BB_MIDIA . "/fila/{$m[1]}.*") ?: [] as $x) @unlink($x);
    }
    bb_limpa_cache();
    bb_responde(200, ['ok' => true]);
}

bb_responde(400, ['ok' => false, 'erro' => 'Ação desconhecida.']);
