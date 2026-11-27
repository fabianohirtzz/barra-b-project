<?php
/* Barra Boat Floripa | lib/roteiros.php
   Roteiros cadastrados no painel aparecem no site sozinhos (pedido do Fabiano em 27/11/2026):
   - página própria em /<slug>/ (Ilha do Campeche e Costa da Lagoa têm molde do gerador; roteiro novo
     usa a página da Costa da Lagoa como casca e troca o miolo);
   - card na home (mais de 2 roteiros: galeria com setas) e em /roteiros/ (cards);
   - links no menu e no rodapé, opções da lista "Roteiro" dos formulários (capa, popup e contato).
   Roteiro desativado no painel sai de tudo; a página dele leva a /roteiros/.
   Sem banco (conteúdo null), vale o molde estático como sempre. */

/* Roteiros ativos na ordem do painel. Sem a coluna ativo (carga de teste), conta como ativo. */
function bb_rot_ativos($c)
{
    $rs = is_array($c) && isset($c['roteiros']) && is_array($c['roteiros']) ? $c['roteiros'] : [];
    return array_values(array_filter($rs, function ($r) {
        return !empty($r['slug']) && preg_match('/^[a-z0-9-]+$/', $r['slug']) && trim((string) ($r['nome'] ?? '')) !== ''
            && (!array_key_exists('ativo', $r) || $r['ativo'] !== false);
    }));
}

function bb_rot_por_slug($c, $slug, $so_ativos = true)
{
    $rs = $so_ativos ? bb_rot_ativos($c) : (is_array($c) && isset($c['roteiros']) ? (array) $c['roteiros'] : []);
    foreach ($rs as $r) if (($r['slug'] ?? '') === $slug) return $r;
    return null;
}

/* Sem emojis no site (regra de texto da marca), mesmo quando o texto veio assim do painel. */
function bb_sem_emoji($t)
{
    $t = preg_replace('/[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2300}-\x{23FF}\x{2B00}-\x{2BFF}\x{FE0F}\x{20E3}\x{200D}]/u', '', (string) $t);
    return trim(preg_replace('/[ \t]{2,}/u', ' ', $t));
}

function bb_mb_low($t) { return function_exists('mb_strtolower') ? mb_strtolower($t, 'UTF-8') : strtolower($t); }

/* Nome escrito todo em maiúsculas vira "Ilha do Xavier, Piscinas Naturais e Lagoa da Conceição". */
function bb_rot_nome($r)
{
    $n = bb_sem_emoji(is_array($r) ? ($r['nome'] ?? '') : $r);
    if (!function_exists('mb_strtoupper') || mb_strtoupper($n, 'UTF-8') !== $n || !preg_match('/\p{L}{2}/u', $n)) return $n;
    $pequenas = ['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'em', 'na', 'no', 'nas', 'nos', 'com', 'para', 'por'];
    $ps = preg_split('/(\s+)/u', bb_mb_low($n), -1, PREG_SPLIT_DELIM_CAPTURE);
    foreach ($ps as $i => &$p) {
        if ($i > 0 && in_array(trim($p, ',.;:'), $pequenas, true)) continue;
        $p = mb_strtoupper(mb_substr($p, 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($p, 1, null, 'UTF-8');
    }
    return implode('', $ps);
}

/* Parágrafos do resumo, sem emojis e sem linhas vazias. */
function bb_rot_paragrafos($r)
{
    $ps = preg_split('/\n\s*\n/u', str_replace("\r", '', (string) ($r['resumo'] ?? '')));
    return array_values(array_filter(array_map('bb_sem_emoji', $ps), 'strlen'));
}

/* Frase de apresentação (capa e cards): o primeiro parágrafo que não é um título em maiúsculas,
   cortado no fim de frase (ou de palavra) perto de $max letras. */
function bb_rot_intro($r, $max = 220)
{
    // linhas inteiras em maiúsculas são títulos que a equipe escreveu no resumo: não servem de apresentação
    $ps = array_values(array_filter(array_map(function ($p) {
        return implode(' ', array_filter(preg_split('/\n/u', $p), function ($l) {
            $l = trim($l);
            return $l !== '' && !(function_exists('mb_strtoupper') && mb_strtoupper($l, 'UTF-8') === $l && preg_match('/\p{L}{3}/u', $l));
        }));
    }, bb_rot_paragrafos($r)), 'strlen'));
    $t = '';
    foreach ($ps as $p) {
        $p = trim(preg_replace('/\s+/u', ' ', $p));
        if (function_exists('mb_strtoupper') && mb_strtoupper($p, 'UTF-8') === $p && preg_match('/\p{L}{3}/u', $p)) continue;
        if (mb_strlen($p, 'UTF-8') >= 30) { $t = $p; break; }
        if ($t === '') $t = $p;
    }
    if ($t === '' && $ps) $t = trim(preg_replace('/\s+/u', ' ', $ps[0]));
    if (mb_strlen($t, 'UTF-8') <= $max) return $t;
    $corte = mb_substr($t, 0, $max, 'UTF-8');
    $fim = max(mb_strrpos($corte, '. ', 0, 'UTF-8') ?: 0, mb_strrpos($corte, '! ', 0, 'UTF-8') ?: 0);
    if ($fim > $max * 0.5) return mb_substr($corte, 0, $fim + 1, 'UTF-8');
    return rtrim(mb_substr($corte, 0, mb_strrpos($corte, ' ', 0, 'UTF-8') ?: $max, 'UTF-8'), ' ,;:') . '.';
}

/* Foto do roteiro: a primeira da galeria dele, senão a da primeira parada com foto. */
function bb_rot_foto($r)
{
    foreach ((array) ($r['fotos'] ?? []) as $f) if (!empty($f['url'])) return $f['url'];
    foreach ((array) ($r['paradas'] ?? []) as $p) if (!empty($p['foto'])) return $p['foto'];
    return '/assets/img/capas/roteiros.webp';
}

function bb_rot_paradas_nomes($r)
{
    return array_values(array_filter(array_map(function ($p) { return bb_sem_emoji($p['nome'] ?? ''); }, (array) ($r['paradas'] ?? [])), 'strlen'));
}

/* ---------- cards (mesma marcação dos cards do molde) ---------- */
function bb_rot_card_home($r, $pre)
{
    $nome = bb_e(bb_rot_nome($r));
    $href = $pre . $r['slug'] . '/';
    $dados = function_exists('bb_fichas') ? array_slice(bb_fichas($r), 0, 3) : [];
    $par = bb_rot_paradas_nomes($r);
    return '        <article class="roteiro">' . "\n" .
        '          <a class="roteiro__foto" href="' . $href . '" tabindex="-1" aria-hidden="true">' . "\n" .
        '            <img src="' . bb_e(bb_url(bb_rot_foto($r), $pre)) . '" alt="" width="1400" height="1050" loading="lazy">' . "\n" .
        '          </a>' . "\n" .
        '          <div class="roteiro__corpo">' . "\n" .
        '            <h3 class="roteiro__nome"><a href="' . $href . '">' . $nome . '</a></h3>' . "\n" .
        '            <p>' . bb_e(bb_rot_intro($r, 190)) . '</p>' . "\n" .
        ($dados ? '            <dl class="roteiro__dados">' . "\n" . bb_fichas_linhas($dados, '              ') . "\n" . '            </dl>' . "\n" : '') .
        (count($par) > 1 ? '            <ol class="roteiro__paradas" aria-label="Paradas do roteiro">' . "\n" .
            '              ' . implode('', array_map(function ($n) { return '<li>' . bb_e($n) . '</li>'; }, array_slice($par, 0, 6))) . "\n" .
            '            </ol>' . "\n" : '') .
        '          </div>' . "\n" .
        '        </article>';
}

function bb_rot_card_comparar($r, $pre)
{
    $nome = bb_e(bb_rot_nome($r));
    $href = $pre . $r['slug'] . '/';
    $dados = function_exists('bb_fichas') ? bb_fichas($r) : [];
    $par = bb_rot_paradas_nomes($r);
    return '        <article class="comparar__card">' . "\n" .
        '          <a class="comparar__foto" href="' . $href . '" tabindex="-1" aria-hidden="true"><img src="' . bb_e(bb_url(bb_rot_foto($r), $pre)) . '" alt="" width="1400" height="1050" loading="lazy"></a>' . "\n" .
        '          <div class="comparar__corpo">' . "\n" .
        '            <h3 class="comparar__nome"><a href="' . $href . '">' . $nome . '</a></h3>' . "\n" .
        ($dados ? '            <dl class="comparar__dados">' . "\n" . bb_fichas_linhas($dados, '              ') . "\n" . '            </dl>' . "\n" : '') .
        '            <p>' . bb_e(bb_rot_intro($r, 240)) . '</p>' . "\n" .
        ($par ? '            <p class="comparar__ideal"><b>Paradas:</b> ' . bb_e(implode(', ', $par)) . '.</p>' . "\n" : '') .
        '            <a class="botao botao--contorno" href="' . $href . '"><span>Ver o roteiro completo</span><svg aria-hidden="true"><use href="#i-seta"/></svg></a>' . "\n" .
        '          </div>' . "\n" .
        '        </article>';
}

/* Cards do molde por slug: [slug => html do <article>]. */
function bb_rot_artigos($bloco, $classe)
{
    $out = [];
    if (preg_match_all('#        <article class="' . $classe . '[^"]*">.*?</article>#s', $bloco, $ms)) {
        foreach ($ms[0] as $a) if (preg_match('#href="(?:\.\./)*([a-z0-9-]+)/"#', $a, $m)) $out[$m[1]] = $a;
    }
    return $out;
}

/* Troca a lista de cards: card do molde quando existe (texto escrito à mão), card montado quando o roteiro é novo. */
function bb_rot_troca_cards($h, $ini, $fim, $classe, $ativos, $pre, $monta, $galeria)
{
    $a = strpos($h, $ini);
    if ($a === false) return $h;
    $b = strpos($h, $fim, $a + strlen($ini));
    if ($b === false) return $h;
    $bloco = substr($h, $a, $b - $a);
    $molde = bb_rot_artigos($bloco, $classe);
    $sep = strpos($bloco, "</article>\n\n") !== false ? "\n\n" : "\n";
    $cards = [];
    foreach ($ativos as $r) $cards[] = isset($molde[$r['slug']]) ? $molde[$r['slug']] : $monta($r, $pre);
    if ($galeria && count($cards) > 2) {
        // mais de 2: galeria com setas (o trilho rola de lado; as setas andam um card)
        $abre = str_replace('">', ' roteiros__grade--galeria" data-rot-trilho>', $ini);
        $fecha = "\n      </div>";   // o </div> do molde que fecha o roteiros__grade
        $novo = '<div class="roteiros__galeria" data-rot-galeria>' . "\n      " . $abre . "\n" . implode($sep, $cards) . "\n      </div>\n" .
            '      <div class="roteiros__setas">' . "\n" .
            '        <button type="button" class="seta seta--volta" data-rot-volta aria-label="Roteiro anterior"><svg><use href="#i-seta"/></svg></button>' . "\n" .
            '        <button type="button" class="seta" data-rot-vai aria-label="Próximo roteiro"><svg><use href="#i-seta"/></svg></button>' . "\n" .
            '      </div>' . "\n      </div>";
        return substr($h, 0, $a) . $novo . substr($h, $b + strlen($fecha));
    }
    return substr($h, 0, $a) . $ini . "\n" . implode($sep, $cards) . substr($h, $b);
}

const BB_NUMEROS = [2 => 'Dois', 3 => 'Três', 4 => 'Quatro', 5 => 'Cinco', 6 => 'Seis', 7 => 'Sete', 8 => 'Oito', 9 => 'Nove', 10 => 'Dez'];

/* Links do menu e do rodapé, opções dos formulários e cards: em toda página. */
function bb_rot_no_site($h, $p, $pre, $c)
{
    $ativos = bb_rot_ativos($c);
    if (!$ativos) return $h;
    $links = implode('', array_map(function ($r) use ($pre) { return '<a href="' . $pre . $r['slug'] . '/">' . bb_e(bb_rot_nome($r)) . '</a>'; }, $ativos));
    $h = preg_replace('#<span class="rota__sub">.*?</span>#s', '<span class="rota__sub">' . str_replace('$', '\$', $links) . '</span>', $h, 1);
    $rod = implode("\n", array_map(function ($r) use ($pre) { return '        <a href="' . $pre . $r['slug'] . '/">' . bb_e(bb_rot_nome($r)) . '</a>'; }, $ativos));
    $h = preg_replace_callback('#(<h3>Roteiros</h3>\n)(?:        <a href="[^"]*">[^<]*</a>\n)+#', function ($m) use ($rod) { return $m[1] . $rod . "\n"; }, $h, 1);

    // lista "Roteiro" dos formulários: os ativos e o Personalizado
    $h = preg_replace_callback('#(<select name="roteiro" data-roteiro>\n)(.*?)(\n *</select>)#s', function ($m) use ($ativos) {
        preg_match('#^( *)<option#m', $m[2], $rec);
        $rec = $rec ? $rec[1] : '              ';
        $ops = [];
        foreach ($ativos as $i => $r) {
            $n = bb_e(bb_rot_nome($r));
            $ops[] = $rec . '<option value="' . $n . '" data-slug="' . $r['slug'] . '"' . ($i === 0 ? ' selected' : '') . '>' . $n . '</option>';
        }
        $ops[] = $rec . '<option value="Personalizado" data-slug="personalizado">Personalizado</option>';
        return $m[1] . implode("\n", $ops) . $m[3];
    }, $h);

    $n = count($ativos);
    if ($p === '') {
        $h = bb_rot_troca_cards($h, '<div class="roteiros__grade">', "\n      </div>\n    </section>", 'roteiro', $ativos, $pre, 'bb_rot_card_home', true);
        if (isset(BB_NUMEROS[$n])) $h = str_replace('Dois roteiros, uma saída', BB_NUMEROS[$n] . ' roteiros, uma saída', $h);
        elseif ($n > 10) $h = str_replace('Dois roteiros, uma saída', $n . ' roteiros, uma saída', $h);
    } elseif ($p === 'roteiros/') {
        $h = bb_rot_troca_cards($h, '<div class="comparar">', "\n      </div>\n    </section>", 'comparar__card', $ativos, $pre, 'bb_rot_card_comparar', false);
        if ($n !== 2) {
            $qt = isset(BB_NUMEROS[$n]) ? BB_NUMEROS[$n] : (string) $n;
            $h = preg_replace('#Dois passeios de dia inteiro saindo do Canal da Barra da Lagoa: mar aberto até a Ilha do Campeche ou águas calmas pela Costa da Lagoa\.#u',
                $n === 1 ? 'Passeio de dia inteiro saindo do Canal da Barra da Lagoa.' : $qt . ' passeios de dia inteiro saindo do Canal da Barra da Lagoa, do mar aberto às águas calmas da Lagoa da Conceição.', $h);
            $h = str_replace('Os dois usam a mesma lancha e saem às 10h.', 'Todos usam a mesma lancha e saem às 10h.', $h);
        }
    }
    return $h;
}

/* Página de um roteiro sem molde (criado no painel). $h = molde da Costa da Lagoa. */
function bb_rot_pagina_nova($h, $r, $pre, $p)
{
    $nome = bb_rot_nome($r);
    $ne = bb_e($nome);
    $intro = bb_rot_intro($r, 240);
    $foto = bb_rot_foto($r);
    $url = BB_DOM . $p;
    $desc = bb_rot_intro($r, 155);
    $grafo = [
        ['@type' => 'BreadcrumbList', 'itemListElement' => [
            ['@type' => 'ListItem', 'position' => 1, 'name' => 'Início', 'item' => BB_DOM],
            ['@type' => 'ListItem', 'position' => 2, 'name' => 'Roteiros', 'item' => BB_DOM . 'roteiros/'],
            ['@type' => 'ListItem', 'position' => 3, 'name' => $nome],
        ]],
        ['@type' => 'TouristTrip', 'name' => 'Passeio de lancha: ' . $nome, 'description' => $desc,
         'provider' => ['@id' => BB_DOM . '#empresa'], 'url' => $url],
    ];
    $h = bb_cabeca($h, 'Passeio de lancha: ' . $nome . ' | Barra Boat Floripa', $desc, $url, ltrim($foto, '/'), $grafo);

    $i = strpos($h, '<main id="conteudo">');
    $j = strpos($h, '</main>', $i);
    if ($i === false || $j === false) return null;
    $main = substr($h, $i, $j - $i);

    // capa
    $fichas = function_exists('bb_fichas') ? bb_fichas($r) : [];
    $capa = '<header class="capa capa--foto">' . "\n" .
        '      <picture class="capa__foto">' . "\n" .
        '        <img src="' . bb_e(bb_url($foto, $pre)) . '" alt="" width="1400" height="1050" fetchpriority="high">' . "\n" .
        '      </picture>' . "\n" .
        '      <div class="capa__conteudo">' . "\n" .
        '        <nav class="migalhas" aria-label="Você está em"><ol><li><a href="' . $pre . '">Início</a></li><li><a href="' . $pre . 'roteiros/">Roteiros</a></li><li aria-current="page">' . $ne . '</li></ol></nav>' . "\n" .
        '        <h1 class="capa__titulo">' . $ne . '</h1>' . "\n" .
        ($intro !== '' ? '        <p class="capa__texto">' . bb_e($intro) . '</p>' . "\n" : '') .
        ($fichas ? '        <dl class="capa__dados">' . implode('', array_map(function ($x) { return '<div><dt>' . bb_e(trim($x['rotulo'])) . '</dt><dd>' . bb_e(trim($x['valor'])) . '</dd></div>'; }, $fichas)) . '</dl>' . "\n" : '') .
        '      </div>' . "\n" .
        '    </header>';
    $main = preg_replace_callback('#<header class="capa capa--foto">.*?</header>#s', function () use ($capa) { return $capa; }, $main, 1);

    // "Por que escolher a Costa da Lagoa" sai; o resto do resumo (se houver) vira "Sobre o roteiro"
    $resto = [];
    foreach (bb_rot_paragrafos($r) as $x) {
        $x = trim($x);
        if ($intro !== '' && strpos(preg_replace('/\s+/u', ' ', $x), rtrim($intro, '.')) !== false) continue;
        $resto[] = $x;
    }
    $sobre = $resto ? '    <section class="secao" aria-labelledby="sobre-rot-titulo">' . "\n" .
        '      <div class="texto-roteiro">' . "\n" .
        '        <h2 id="sobre-rot-titulo" class="titulo">Sobre o roteiro</h2>' . "\n" .
        implode("\n", array_map(function ($x) { return '        <p>' . nl2br(bb_e($x), false) . '</p>'; }, $resto)) . "\n" .
        '      </div>' . "\n" .
        '    </section>' . "\n" : '';
    $main = preg_replace_callback('#    <section class="secao" aria-labelledby="calmo-titulo">.*?</section>\n#s', function () use ($sobre) { return $sobre; }, $main, 1);

    // sem paradas, a seção do caminho sai (senão ficariam as da Costa)
    if (!bb_rot_paradas_nomes($r)) $main = preg_replace('#    <section class="secao" aria-labelledby="rota-titulo">.*?</section>\n#s', '', $main, 1);

    // chamada do fim
    $main = str_replace('Quer fazer o roteiro Costa da Lagoa?', 'Quer fazer este roteiro?', $main);
    $main = str_replace('data-wa-texto="Olá! Vim pelo site da Barra Boat. Quero consultar um passeio para a Costa da Lagoa."',
        'data-reserva-roteiro="' . $ne . '" data-wa-texto="Olá! Vim pelo site da Barra Boat. Quero consultar o roteiro ' . $ne . '."', $main);

    $h = substr($h, 0, $i) . $main . substr($h, $j);
    return bb_pagina_roteiro($h, $r, $pre, 'Dicas e regras do roteiro');
}
