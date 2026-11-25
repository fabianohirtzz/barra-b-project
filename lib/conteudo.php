<?php
/* Barra Boat Floripa | lib/conteudo.php
   Trechos do site que a Michele edita no painel: perguntas frequentes e avaliações (home),
   paradas e regras dos roteiros. Mesma marcação do tools/gerar_paginas.py e do index.html
   (o tools/conferir_php.php compara com a prévia estática). Sem linha no banco, o trecho
   fica como está no molde. */

/* ---------- home: perguntas frequentes ---------- */
function bb_faq_html($faq)
{
    $out = [];
    foreach ($faq as $f) {
        $ps = array_filter(array_map('trim', preg_split('/\n\s*\n/', (string) $f['resposta'])), 'strlen');
        $out[] = '        <details name="faq">' . "\n" .
            '          <summary>' . bb_e($f['pergunta']) . '</summary>' . "\n" .
            implode("\n", array_map(function ($p) { return '          <p>' . nl2br(bb_e($p), false) . '</p>'; }, $ps)) . "\n" .
            '        </details>';
    }
    return implode("\n", $out);
}

function bb_faq_ld($faq)
{
    return array_map(function ($f) {
        $txt = trim(preg_replace('/\s+/', ' ', (string) $f['resposta']));
        return ['@type' => 'Question', 'name' => $f['pergunta'], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $txt]];
    }, array_values($faq));
}

/* ---------- home: avaliações ---------- */
function bb_avaliacoes_html($avs)
{
    $out = [];
    foreach (array_values($avs) as $i => $a) {
        $nome = trim((string) $a['nome']);
        $ini = function_exists('mb_substr') ? mb_strtoupper(mb_substr($nome, 0, 1, 'UTF-8'), 'UTF-8') : strtoupper(substr($nome, 0, 1));
        $lang = (isset($a['idioma']) && $a['idioma'] !== 'pt') ? ' lang="' . bb_e($a['idioma']) . '"' : '';
        $out[] = '        <figure class="avaliacao' . ($i === 0 ? ' avaliacao--destaque' : '') . '"' . $lang . '>' . "\n" .
            '          <blockquote>' . bb_e($a['texto']) . '</blockquote>' . "\n" .
            '          <figcaption><span class="avaliacao__inicial" aria-hidden="true">' . bb_e($ini) . '</span><span><b>' . bb_e($nome) . '</b>' . bb_e((string) $a['data_label']) . '</span></figcaption>' . "\n" .
            '        </figure>';
    }
    return implode("\n", $out);
}

/* ---------- roteiros ---------- */
function bb_paradas_html($paradas, $pre)
{
    $out = [];
    foreach (array_values($paradas) as $i => $p) {
        $foto = !empty($p['foto'])
            ? "\n" . '              <img class="rota-v__foto" src="' . bb_e(bb_url($p['foto'], $pre)) . '" alt="' . bb_e(isset($p['alt']) ? $p['alt'] : '') . '" width="1400" height="1050" loading="lazy">'
            : '';
        $out[] = '          <li class="rota-v__parada' . ($foto ? '' : ' rota-v__parada--sem-foto') . '">' . "\n" .
            '            <span class="rota-v__n">' . ($i + 1) . '</span>' . "\n" .
            '            <div class="rota-v__corpo">' . "\n" .
            '              <div><h3>' . bb_e($p['nome']) . '</h3><p>' . bb_e($p['texto']) . '</p></div>' . $foto . "\n" .
            '            </div>' . "\n" .
            '          </li>';
    }
    return implode("\n", $out);
}

function bb_regras_secao($nome, $regras)
{
    return '    <section class="secao" aria-labelledby="regras-titulo">' . "\n" .
        '      <div class="aviso-regras">' . "\n" .
        '        <h2 id="regras-titulo" class="titulo">Regras da ' . bb_e($nome) . '</h2>' . "\n" .
        '        <p class="secao__intro">Valem para todos os passeios deste roteiro.</p>' . "\n" .
        '        <ul>' . "\n" . bb_regras_lis($regras) . "\n" . '        </ul>' . "\n" .
        '      </div>' . "\n" .
        '    </section>' . "\n\n";
}

function bb_regras_lis($regras)
{
    return implode("\n", array_map(function ($r) { return '          <li>' . bb_e($r) . '</li>'; }, array_values($regras)));
}

/* Troca paradas, regras e o itinerário do JSON-LD na página de um roteiro. */
function bb_pagina_roteiro($h, $r, $pre)
{
    $paradas = is_array($r['paradas']) ? $r['paradas'] : [];
    $regras = array_values(array_filter(is_array($r['regras']) ? $r['regras'] : [], function ($x) { return trim((string) $x) !== ''; }));
    if ($paradas) $h = bb_troca_entre($h, '<ol class="rota-v">' . "\n", "\n        </ol>", bb_paradas_html($paradas, $pre));

    $tem = strpos($h, '<div class="aviso-regras">') !== false;
    if ($tem && $regras) {
        $i = strpos($h, '<div class="aviso-regras">');
        $h = substr($h, 0, $i) . bb_troca_entre(substr($h, $i), '<ul>' . "\n", "\n        </ul>", bb_regras_lis($regras));
    } elseif ($tem) {
        $h = preg_replace('#    <section class="secao" aria-labelledby="regras-titulo">.*?</section>\n\n#s', '', $h, 1);
    } elseif ($regras) {
        $marca = '    <section class="secao" aria-labelledby="escolha-titulo">';
        $h = str_replace($marca, bb_regras_secao($r['nome'], $regras) . $marca, $h);
    }

    if ($paradas) {
        $h = bb_mexe_ld($h, function ($g) use ($paradas) {
            foreach ($g as &$n) {
                if (isset($n['@type']) && $n['@type'] === 'TouristTrip') {
                    $n['itinerary'] = ['@type' => 'ItemList', 'itemListElement' => array_map(function ($p, $i) {
                        return ['@type' => 'ListItem', 'position' => $i + 1, 'item' => ['@type' => 'Place', 'name' => $p['nome']]];
                    }, array_values($paradas), array_keys(array_values($paradas)))];
                }
            }
            return $g;
        });
    }
    return $h;
}

/* As 4 lanchas da seção "Escolha a lancha para este roteiro": uma de cada faixa de tamanho,
   como o gerador (1ª, 4ª, 9ª e última da ordem). */
function bb_lanchas_amostra($lanchas)
{
    $l = array_values($lanchas);
    $n = count($l);
    if ($n <= 4) return $l;
    $idx = array_unique([0, min(3, $n - 1), min(8, $n - 1), $n - 1]);
    return array_map(function ($i) use ($l) { return $l[$i]; }, $idx);
}

/* ---------- home: vídeos do Instagram ---------- */
function bb_reels_html($vids, $pre)
{
    $out = [];
    foreach ($vids as $v) {
        $leg = bb_e((string) $v['legenda']);
        $w = (int) ($v['largura'] ?: 720);
        $h = (int) ($v['altura'] ?: 1280);
        $poster = !empty($v['poster_url']) ? ' poster="' . bb_e(bb_url($v['poster_url'], $pre)) . '"' : '';
        $out[] = '          <li class="reel">' . "\n" .
            '            <figure class="reel__quadro">' . "\n" .
            '              <video class="reel__video" src="' . bb_e(bb_url($v['video_url'], $pre)) . '"' . $poster . ' width="' . $w . '" height="' . $h . '" preload="none" playsinline aria-label="' . $leg . '"></video>' . "\n" .
            '              <button class="reel__play" type="button" data-reel-play aria-label="Reproduzir vídeo"><span><svg aria-hidden="true"><use href="#i-play"/></svg></span></button>' . "\n" .
            '              <div class="reel__barra">' . "\n" .
            '                <button class="reel__btn" type="button" data-reel-play aria-label="Reproduzir vídeo"><svg class="reel__i-play" aria-hidden="true"><use href="#i-play"/></svg><svg class="reel__i-pausa" aria-hidden="true"><use href="#i-pausa"/></svg></button>' . "\n" .
            '                <button class="reel__btn" type="button" data-reel-som aria-label="Desativar som" aria-pressed="false"><svg class="reel__i-vol" aria-hidden="true"><use href="#i-volume"/></svg><svg class="reel__i-mudo" aria-hidden="true"><use href="#i-mudo"/></svg></button>' . "\n" .
            '                <input class="reel__vol" type="range" min="0" max="1" step="0.05" value="0.8" data-reel-vol aria-label="Volume">' . "\n" .
            '                <button class="reel__btn reel__btn--ampliar" type="button" data-reel-ampliar aria-label="Ver em tela cheia"><svg aria-hidden="true"><use href="#i-ampliar"/></svg></button>' . "\n" .
            '              </div>' . "\n" .
            '              <span class="reel__progresso" aria-hidden="true"></span>' . "\n" .
            '              <figcaption class="sr">' . $leg . '</figcaption>' . "\n" .
            '            </figure>' . "\n" .
            '          </li>';
    }
    return implode("\n", $out);
}
