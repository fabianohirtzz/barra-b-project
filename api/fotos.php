<?php
/* Barra Boat Floripa | api/fotos.php
   Fotos das lanchas enviadas pelo painel. Dona e atendente.
   O navegador já manda a foto reduzida (JPEG até 2400 px, com a rotação certa).
   Aqui: recorte quadrado no centro, WebP 1400 px (galeria) e 480 px (miniatura),
   mesmo padrão das fotos do site. Tudo em fotos/lanchas/<slug>/, fora do Git
   (o deploy nunca apaga) e fora de assets/.

   POST multipart  acao=enviar, lancha_id, foto=<arquivo>
     -> {"ok": true, "foto": {"url", "url_p", "melhorar": bool, "lado": n}}
        melhorar = a foto tinha menos de 1400 px: entra no site como veio e a IA
        (Real-ESRGAN, no computador da Freela) melhora depois. O original fica em orig/.
   POST json {"acao": "capa", "lancha_id", "url", "antiga"?} -> {"ok": true, "capa_url"}
   POST json {"acao": "apagar", "lancha_id", "url"} -> {"ok": true}
   POST json {"acao": "cache"} -> limpa o cache do site (lancha salva no painel) */

require_once dirname(__DIR__) . '/lib/painel.php';

bb_quem_pede(['dona', 'atendente']);

define('BB_FOTOS', BB_RAIZ . '/fotos/lanchas');
define('LADO_GRANDE', 1400);
define('LADO_MINI', 480);
define('LADO_CAPA', 900);

$multipart = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') === 0;
$in = $multipart ? $_POST : bb_entrada();
$acao = (string) ($in['acao'] ?? '');

if ($acao === 'cache') { bb_limpa_cache(); bb_responde(200, ['ok' => true]); }

/* Foto de uma parada de roteiro: 4:3, 1400 x 1050, em fotos/roteiros/<slug>/.
   multipart acao=parada, roteiro_id, foto=<arquivo>, antiga? -> {"ok": true, "url"} */
if ($acao === 'parada') {
    $rid = (string) ($in['roteiro_id'] ?? '');
    if (!preg_match('/^[0-9a-f-]{36}$/i', $rid)) bb_responde(400, ['ok' => false, 'erro' => 'Roteiro não encontrado.']);
    list($st, $rs) = bb_supabase('GET', 'bb_roteiros?select=slug&id=eq.' . rawurlencode($rid));
    if ($st !== 200 || !$rs || !preg_match('/^[a-z0-9-]+$/', $rs[0]['slug'])) bb_responde(404, ['ok' => false, 'erro' => 'Roteiro não encontrado.']);
    $f = $_FILES['foto'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK || $f['size'] > 30 * 1048576) bb_responde(400, ['ok' => false, 'erro' => 'A foto não chegou. Tente de novo.']);
    $info = @getimagesize($f['tmp_name']);
    if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true) || $info[0] * $info[1] > 40e6) bb_responde(400, ['ok' => false, 'erro' => 'Esse arquivo não é uma foto em JPG, PNG ou WebP.']);
    $img = $info[2] === IMAGETYPE_JPEG ? @imagecreatefromjpeg($f['tmp_name']) : ($info[2] === IMAGETYPE_PNG ? @imagecreatefrompng($f['tmp_name']) : @imagecreatefromwebp($f['tmp_name']));
    if (!$img) bb_responde(400, ['ok' => false, 'erro' => 'Não consegui abrir essa foto.']);
    $w = imagesx($img); $h = imagesy($img);
    // recorte 4:3 no centro
    if ($w / $h > 4 / 3) { $cw = (int) round($h * 4 / 3); $ch = $h; } else { $cw = $w; $ch = (int) round($w * 3 / 4); }
    if ($cw < 400) bb_responde(400, ['ok' => false, 'erro' => 'Foto pequena demais para o site.']);
    $ow = min($cw, 1400); $oh = (int) round($ow * 3 / 4);
    $out = imagecreatetruecolor($ow, $oh);
    imagecopyresampled($out, $img, 0, 0, (int) (($w - $cw) / 2), (int) (($h - $ch) / 2), $ow, $oh, $cw, $ch);
    $dir = BB_RAIZ . '/fotos/roteiros/' . $rs[0]['slug'];
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) bb_responde(500, ['ok' => false, 'erro' => 'Não consegui guardar a foto no servidor.']);
    $nome = date('ymd') . '-' . bin2hex(random_bytes(4)) . '.webp';
    $ok = imagewebp($out, "$dir/$nome", 82);
    imagedestroy($img); imagedestroy($out);
    if (!$ok) bb_responde(500, ['ok' => false, 'erro' => 'Não consegui guardar a foto no servidor.']);
    // a foto anterior da parada sai (só se for nossa; as do site antigo ficam em assets/)
    $web = '/fotos/roteiros/' . $rs[0]['slug'] . '/';
    $antiga = (string) ($in['antiga'] ?? '');
    if (strpos($antiga, $web) === 0 && preg_match('/^[a-z0-9-]+\.webp$/', substr($antiga, strlen($web)))) @unlink($dir . '/' . substr($antiga, strlen($web)));
    bb_responde(200, ['ok' => true, 'url' => $web . $nome]);
}

$id = (string) ($in['lancha_id'] ?? '');
if (!preg_match('/^[0-9a-f-]{36}$/i', $id)) bb_responde(400, ['ok' => false, 'erro' => 'Lancha não encontrada.']);
list($st, $ls) = bb_supabase('GET', 'bb_lanchas?select=slug,nome&id=eq.' . rawurlencode($id));
if ($st !== 200 || !$ls) bb_responde(404, ['ok' => false, 'erro' => 'Lancha não encontrada.']);
$slug = $ls[0]['slug'];
if (!preg_match('/^[a-z0-9-]+$/', $slug)) bb_responde(400, ['ok' => false, 'erro' => 'Endereço da lancha inválido.']);
$pasta = BB_FOTOS . '/' . $slug;
$web = '/fotos/lanchas/' . $slug . '/';

function quadrado($img, $lado)
{
    $w = imagesx($img); $h = imagesy($img);
    $s = min($w, $h);
    $out = imagecreatetruecolor($lado, $lado);
    imagecopyresampled($out, $img, 0, 0, (int) (($w - $s) / 2), (int) (($h - $s) / 2), $lado, $lado, $s, $s);
    return $out;
}

/* Caminho no disco de uma foto nossa (só dentro de fotos/lanchas/<slug>/). null se for de outro lugar. */
function caminho_nosso($url, $web, $pasta)
{
    $url = (string) $url;
    if (strpos($url, $web) !== 0) return null;
    $nome = substr($url, strlen($web));
    if (!preg_match('/^[a-z0-9-]+\.webp$/', $nome)) return null;
    return $pasta . '/' . $nome;
}

if ($acao === 'enviar') {
    $f = $_FILES['foto'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK) bb_responde(400, ['ok' => false, 'erro' => 'A foto não chegou. Tente de novo.']);
    if ($f['size'] > 30 * 1048576) bb_responde(400, ['ok' => false, 'erro' => 'Foto grande demais.']);
    $info = @getimagesize($f['tmp_name']);
    if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) bb_responde(400, ['ok' => false, 'erro' => 'Esse arquivo não é uma foto em JPG, PNG ou WebP.']);
    if ($info[0] * $info[1] > 40e6) bb_responde(400, ['ok' => false, 'erro' => 'Foto grande demais.']);
    $img = $info[2] === IMAGETYPE_JPEG ? @imagecreatefromjpeg($f['tmp_name']) : ($info[2] === IMAGETYPE_PNG ? @imagecreatefrompng($f['tmp_name']) : @imagecreatefromwebp($f['tmp_name']));
    if (!$img) bb_responde(400, ['ok' => false, 'erro' => 'Não consegui abrir essa foto.']);
    $lado = min(imagesx($img), imagesy($img));
    if ($lado < 300) bb_responde(400, ['ok' => false, 'erro' => 'Foto pequena demais para o site. Peça a foto original ao dono.']);
    if (!is_dir($pasta) && !@mkdir($pasta, 0755, true)) bb_responde(500, ['ok' => false, 'erro' => 'Não consegui guardar a foto no servidor.']);
    $nome = date('ymd') . '-' . bin2hex(random_bytes(4));
    $grande = quadrado($img, min($lado, LADO_GRANDE));
    $mini = quadrado($img, min($lado, LADO_MINI));
    $ok = imagewebp($grande, "$pasta/$nome.webp", 82) && imagewebp($mini, "$pasta/$nome-p.webp", 78);
    $melhorar = $lado < LADO_GRANDE;
    if ($ok && $melhorar) {
        // guarda o quadrado original para a IA melhorar depois
        if (!is_dir("$pasta/orig")) @mkdir("$pasta/orig", 0755, true);
        $q = quadrado($img, $lado);
        imagejpeg($q, "$pasta/orig/$nome.jpg", 95);
        imagedestroy($q);
    }
    imagedestroy($img); imagedestroy($grande); imagedestroy($mini);
    if (!$ok) bb_responde(500, ['ok' => false, 'erro' => 'Não consegui guardar a foto no servidor.']);
    bb_responde(200, ['ok' => true, 'foto' => ['url' => $web . "$nome.webp", 'url_p' => $web . "$nome-p.webp", 'melhorar' => $melhorar, 'lado' => $lado]]);
}

if ($acao === 'capa') {
    // a capa (lista de lanchas) sai da foto grande escolhida: da pasta nova ou das que vieram do site antigo
    $url = (string) ($in['url'] ?? '');
    $arq = caminho_nosso($url, $web, $pasta);
    if ($arq === null && preg_match('#^/assets/img/lanchas/' . preg_quote($slug, '#') . '/[0-9a-z-]+\.webp$#', $url)) $arq = BB_RAIZ . $url;
    if ($arq === null || !is_file($arq)) bb_responde(400, ['ok' => false, 'erro' => 'Foto não encontrada.']);
    $img = @imagecreatefromwebp($arq);
    if (!$img) bb_responde(400, ['ok' => false, 'erro' => 'Não consegui abrir essa foto.']);
    if (!is_dir($pasta)) @mkdir($pasta, 0755, true);
    $nome = 'capa-' . bin2hex(random_bytes(4));
    $c = quadrado($img, min(min(imagesx($img), imagesy($img)), LADO_CAPA));
    $ok = imagewebp($c, "$pasta/$nome.webp", 82);
    imagedestroy($img); imagedestroy($c);
    if (!$ok) bb_responde(500, ['ok' => false, 'erro' => 'Não consegui guardar a capa.']);
    $antiga = caminho_nosso($in['antiga'] ?? '', $web, $pasta);
    if ($antiga && strpos(basename($antiga), 'capa-') === 0) @unlink($antiga);
    bb_responde(200, ['ok' => true, 'capa_url' => $web . "$nome.webp"]);
}

if ($acao === 'apagar') {
    // só apaga arquivo nosso; foto que veio do site antigo (assets/) só sai da lista
    $arq = caminho_nosso($in['url'] ?? '', $web, $pasta);
    if ($arq !== null) {
        $base = substr($arq, 0, -5);
        @unlink($arq); @unlink($base . '-p.webp');
        @unlink(dirname($arq) . '/orig/' . basename($base) . '.jpg');
    }
    bb_responde(200, ['ok' => true]);
}

bb_responde(400, ['ok' => false, 'erro' => 'Ação desconhecida.']);
