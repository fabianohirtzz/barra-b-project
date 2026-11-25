<?php
/* Barra Boat Floripa | lib/fotos_ia.php
   Troca no banco as fotos que a IA melhorou (tools/melhorar_fotos.py, rodado no computador,
   sobe <nome>-ia.webp e <nome>-ia-p.webp na pasta da lancha). Chamado pelo cron/videos.php.
   Para cada foto com melhorar: true que já tem a versão -ia: aponta para ela, tira o
   "vai melhorar", refaz a capa se for a primeira foto e apaga a versão pequena e o original. */

function bb_capa_de($arq_webp, $pasta)
{
    $img = @imagecreatefromwebp($arq_webp);
    if (!$img) return null;
    $s = min(imagesx($img), imagesy($img));
    $lado = min($s, 900);
    $out = imagecreatetruecolor($lado, $lado);
    imagecopyresampled($out, $img, 0, 0, (int) ((imagesx($img) - $s) / 2), (int) ((imagesy($img) - $s) / 2), $lado, $lado, $s, $s);
    $nome = 'capa-' . bin2hex(random_bytes(4)) . '.webp';
    $ok = imagewebp($out, "$pasta/$nome", 82);
    imagedestroy($img); imagedestroy($out);
    return $ok ? $nome : null;
}

/* Devolve quantas fotos trocou. */
function bb_fotos_ia_trocar()
{
    list($st, $ls) = bb_supabase('GET', 'bb_lanchas?select=id,slug,fotos,capa_url');
    if ($st !== 200 || !is_array($ls)) return 0;
    $total = 0;
    foreach ($ls as $l) {
        if (!preg_match('/^[a-z0-9-]+$/', $l['slug']) || !is_array($l['fotos'])) continue;
        $web = '/fotos/lanchas/' . $l['slug'] . '/';
        $pasta = BB_RAIZ . '/fotos/lanchas/' . $l['slug'];
        $fotos = $l['fotos'];
        $trocou = [];
        foreach ($fotos as $i => $f) {
            if (empty($f['melhorar']) || strpos((string) $f['url'], $web) !== 0) continue;
            $nome = basename($f['url'], '.webp');
            if (!preg_match('/^[0-9]{6}-[0-9a-f]{8}$/', $nome)) continue;
            if (!is_file("$pasta/$nome-ia.webp") || !is_file("$pasta/$nome-ia-p.webp")) continue;
            $fotos[$i]['url'] = $web . "$nome-ia.webp";
            $fotos[$i]['url_p'] = $web . "$nome-ia-p.webp";
            $fotos[$i]['melhorar'] = false;
            $fotos[$i]['ia'] = true;
            $trocou[$i] = $nome;
        }
        if (!$trocou) continue;
        $muda = ['fotos' => $fotos];
        $capa_velha = null;
        if (isset($trocou[0])) {   // a primeira é a capa: refaz a partir da versão melhorada
            $c = bb_capa_de("$pasta/{$trocou[0]}-ia.webp", $pasta);
            if ($c) { $muda['capa_url'] = $web . $c; $capa_velha = $l['capa_url']; }
        }
        list($st2) = bb_supabase('PATCH', 'bb_lanchas?id=eq.' . rawurlencode($l['id']), $muda, 'return=minimal');
        if ($st2 < 200 || $st2 >= 300) continue;
        foreach ($trocou as $nome) {
            @unlink("$pasta/$nome.webp"); @unlink("$pasta/$nome-p.webp"); @unlink("$pasta/orig/$nome.jpg");
        }
        if ($capa_velha && strpos($capa_velha, $web . 'capa-') === 0) @unlink($pasta . '/' . basename($capa_velha));
        $total += count($trocou);
        echo $l['slug'] . ': ' . count($trocou) . " foto(s) melhorada(s) trocada(s)\n";
    }
    return $total;
}
