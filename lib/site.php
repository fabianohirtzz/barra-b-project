<?php
/* Barra Boat Floripa | lib/site.php
   Monta as páginas do site no servidor. O molde de cada página é o HTML estático que o
   tools/gerar_paginas.py gera (cabeçalho, menu, rodapé e textos ficam lá); daqui só
   troca o que vem do banco: lanchas, cards, opções do formulário e números da frota.
   bb_render() não lê o banco: recebe as lanchas, o que deixa conferir_php.php testar
   com os dados da carga. */

require_once __DIR__ . '/lanchas.php';

function bb_molde($rel)
{
    $arq = BB_RAIZ . '/' . $rel;
    // o Git no Windows pode gravar CRLF; as marcas abaixo procuram \n
    return is_file($arq) ? str_replace("\r\n", "\n", file_get_contents($arq)) : null;
}

/* Troca o conteúdo de <ul ... marca ...> até o </ul> que fecha (conta os <ul> de dentro). */
function bb_troca_ul($html, $marca, $novo)
{
    $i = strpos($html, $marca);
    if ($i === false) return $html;
    $ini = strpos($html, '>', $i) + 1;
    $nivel = 1;
    $pos = $ini;
    while ($nivel > 0 && preg_match('#<ul\b|</ul>#', $html, $m, PREG_OFFSET_CAPTURE, $pos)) {
        $nivel += ($m[0][0] === '</ul>') ? -1 : 1;
        $pos = $m[0][1] + strlen($m[0][0]);
        if ($nivel === 0) return substr($html, 0, $ini) . $novo . substr($html, $m[0][1]);
    }
    return $html;
}

function bb_troca_entre($html, $ini, $fim, $novo)
{
    $a = strpos($html, $ini);
    if ($a === false) return $html;
    $a += strlen($ini);
    $b = strpos($html, $fim, $a);
    return $b === false ? $html : substr($html, 0, $a) . $novo . substr($html, $b);
}

/* Números da frota nos textos fixos do molde (menu, capas, descrições). */
function bb_textos_frota($html, $f)
{
    return preg_replace(
        ['/\b17 lanchas\b/u', '/\bde 23 a 37 pés\b/u', '/\b(de|para) 7 a 13 pessoas\b/u'],
        [$f['n'] . ' lanchas', 'de ' . $f['pes_min'] . ' a ' . $f['pes_max'] . ' pés', '$1 ' . $f['pax_min'] . ' a ' . $f['pax_max'] . ' pessoas'],
        $html
    );
}

function bb_ld_script($grafo)
{
    $j = json_encode(['@context' => 'https://schema.org', '@graph' => $grafo], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    return '<script type="application/ld+json">' . "\n  " . str_replace("\n", "\n  ", $j) . "\n  </script>";
}

function bb_cabeca($html, $titulo, $desc, $canonico, $og, $grafo)
{
    $t = bb_e($titulo);
    $d = bb_e($desc);
    $html = preg_replace('#<title>.*?</title>#s', '<title>' . $t . '</title>', $html, 1);
    $html = preg_replace('#<meta name="description" content="[^"]*">#', '<meta name="description" content="' . $d . '">', $html, 1);
    $html = preg_replace('#<link rel="canonical" href="[^"]*">#', '<link rel="canonical" href="' . bb_e($canonico) . '">', $html, 1);
    $html = preg_replace('#<meta property="og:title" content="[^"]*">#', '<meta property="og:title" content="' . $t . '">', $html, 1);
    $html = preg_replace('#<meta property="og:description" content="[^"]*">#', '<meta property="og:description" content="' . $d . '">', $html, 1);
    $html = preg_replace('#<meta property="og:image" content="[^"]*">#', '<meta property="og:image" content="' . BB_DOM . bb_e($og) . '">', $html, 1);
    $ld = bb_ld_script($grafo);
    return preg_replace_callback('#<script type="application/ld\+json">.*?</script>#s', function () use ($ld) { return $ld; }, $html, 1);
}

/* Lê o JSON-LD do molde, deixa uma função mexer no @graph e grava de volta. */
function bb_mexe_ld($html, callable $f)
{
    if (!preg_match('#<script type="application/ld\+json">(.*?)</script>#s', $html, $m)) return $html;
    $j = json_decode($m[1], true);
    if (!$j || !isset($j['@graph'])) return $html;
    $ld = bb_ld_script($f($j['@graph']));
    return str_replace($m[0], $ld, $html);
}

function bb_404()
{
    $h = bb_molde('404.html');
    // o 404 aparece em qualquer profundidade: os caminhos dele são da raiz
    return [404, $h === null ? 'Página não encontrada' : preg_replace('#<head>#', "<head>\n  <base href=\"/\">", $h, 1)];
}

/* $p: caminho pedido sem a barra inicial ("", "lanchas/", "lanchas/1564/", "sobre/").
   $lanchas: lanchas ativas na ordem do site, ou null se o banco não respondeu.
   Devolve [status, html]. */
function bb_render($p, $lanchas, $fonte_api = 'api/disponibilidade.php')
{
    $p = ltrim($p, '/');
    if ($p !== '' && substr($p, -1) !== '/') $p .= '/';
    if (strpos($p, '..') !== false || !preg_match('#^([a-z0-9-]+/){0,2}$#', $p)) return bb_404();
    $pre = str_repeat('../', substr_count($p, '/'));

    // página de lancha: sai do banco; sem banco, vale a estática
    if (preg_match('#^lanchas/([a-z0-9-]+)/$#', $p, $m)) {
        if ($lanchas === null) {
            $h = bb_molde($p . 'index.html');
            return $h === null ? bb_404() : [200, $h];
        }
        $l = null;
        foreach ($lanchas as $x) if ($x['slug'] === $m[1]) $l = $x;
        if ($l === null) return bb_404();   // não existe ou está escondida no painel
        $h = bb_molde($p . 'index.html');
        if ($h === null) {
            $outras = glob(BB_RAIZ . '/lanchas/*/index.html') ?: [];
            $h = $outras ? file_get_contents($outras[0]) : null;
        }
        if ($h === null) return bb_404();
        list($titulo, $desc, $og, $corpo, $ld) = bb_pagina_lancha($l, $lanchas, $pre, $pre . $fonte_api);
        $h = bb_cabeca($h, $titulo, $desc, BB_DOM . $p, $og, $ld);
        $h = bb_troca_entre($h, '<main id="conteudo">' . "\n", "\n  </main>", $corpo);
        return [200, bb_textos_frota($h, bb_frota($lanchas))];
    }

    $h = bb_molde($p . 'index.html');
    if ($h === null) return bb_404();
    if ($lanchas === null) return [200, $h];

    if ($p === '') {
        $h = bb_troca_ul($h, '<ul class="trilho__lista" data-trilho-lista>', "\n" . bb_cards($lanchas, $pre) . "\n        ");
        $h = bb_troca_entre($h, '<select name="lancha" data-lancha>' . "\n", "\n            </select>", bb_opcoes($lanchas));
    } elseif ($p === 'lanchas/') {
        $h = bb_troca_ul($h, '<ul class="grade-lanchas" data-grade-lanchas>', "\n" . bb_cards($lanchas, $pre) . "\n          ");
        $h = bb_mexe_ld($h, function ($g) use ($lanchas) {
            foreach ($g as &$n) {
                if (isset($n['@type']) && $n['@type'] === 'ItemList') {
                    $n['numberOfItems'] = count($lanchas);
                    $n['itemListElement'] = [];
                    foreach (array_values($lanchas) as $i => $l) {
                        $n['itemListElement'][] = ['@type' => 'ListItem', 'position' => $i + 1, 'url' => BB_DOM . 'lanchas/' . $l['slug'] . '/', 'name' => $l['nome']];
                    }
                }
            }
            return $g;
        });
    }
    return [200, bb_textos_frota($h, bb_frota($lanchas))];
}
