<?php
/* Barra Boat Floripa | og.php
   Imagem de compartilhamento (WhatsApp, Facebook, LinkedIn, X): /og/<caminho da foto>.jpg vira um JPEG
   1200x630 recortado do WebP de mesmo caminho (o .htaccess manda para cá). Nem todo app mostra WebP na
   prévia do link; JPEG todos mostram. Só lê fotos de assets/img e fotos/lanchas|roteiros; guarda o
   resultado em cache/og/ e refaz quando a foto muda. */

$f = isset($_GET['f']) ? (string) $_GET['f'] : '';
if (!preg_match('#^(assets/img|fotos/(lanchas|roteiros))/[a-z0-9/_.-]+$#i', $f) || strpos($f, '..') !== false) {
    http_response_code(404);
    exit;
}
$orig = __DIR__ . '/' . $f . '.webp';
if (!is_file($orig)) { $orig = __DIR__ . '/' . $f . '.jpg'; }
if (!is_file($orig)) { http_response_code(404); exit; }

$dir = __DIR__ . '/cache/og';
$dest = $dir . '/' . md5($f) . '.jpg';
if (!is_file($dest) || filemtime($dest) < filemtime($orig)) {
    $img = substr($orig, -5) === '.webp' ? @imagecreatefromwebp($orig) : @imagecreatefromjpeg($orig);
    if (!$img) { http_response_code(404); exit; }
    $w = imagesx($img);
    $h = imagesy($img);
    // recorte central na proporção 1200x630 (1,905:1)
    $r = 1200 / 630;
    if ($w / $h > $r) { $cw = (int) round($h * $r); $ch = $h; } else { $cw = $w; $ch = (int) round($w / $r); }
    $out = imagecreatetruecolor(1200, 630);
    imagecopyresampled($out, $img, 0, 0, (int) (($w - $cw) / 2), (int) (($h - $ch) / 2), 1200, 630, $cw, $ch);
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    imageinterlace($out, true);
    imagejpeg($out, $dest . '.tmp', 84);
    @rename($dest . '.tmp', $dest);
}

header('Content-Type: image/jpeg');
header('Cache-Control: public, max-age=604800');
header('Content-Length: ' . filesize($dest));
readfile($dest);
