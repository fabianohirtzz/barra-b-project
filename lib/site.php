<?php
/* Barra Boat Floripa | lib/site.php
   Monta as páginas do site no servidor. O molde de cada página é o HTML estático que o
   tools/gerar_paginas.py gera (cabeçalho, menu, rodapé e textos ficam lá); daqui só
   troca o que vem do banco: lanchas, cards, opções do formulário e números da frota.
   bb_render() não lê o banco: recebe as lanchas, o que deixa conferir_php.php testar
   com os dados da carga. */

require_once __DIR__ . '/lanchas.php';
require_once __DIR__ . '/conteudo.php';

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

/* Opções de lancha dos formulários de reserva (a capa da home e o popup, que está em todas as páginas). */
function bb_opcoes_form($html, $lanchas)
{
    $ini = '<select name="lancha" data-lancha>' . "\n";
    $fim = "\n            </select>";
    $novo = bb_opcoes($lanchas);
    $de = 0;
    while (($a = strpos($html, $ini, $de)) !== false) {
        $a += strlen($ini);
        $b = strpos($html, $fim, $a);
        if ($b === false) break;
        $html = substr($html, 0, $a) . $novo . substr($html, $b);
        $de = $a + strlen($novo);
    }
    return $html;
}

/* Números da frota nos textos fixos do molde (menu, capas, descrições). */
function bb_textos_frota($html, $f)
{
    return preg_replace(
        ['/\b17 lanchas\b/u', '/\bde 23 a 37 pés\b/u', '/\b(de|para) 7 a 13 pessoas\b/u', '#<b data-frota-n>\d+</b>#', '#(<input name="pessoas" type="number" min="1" max=")\d+(")#'],
        [$f['n'] . ' lanchas', 'de ' . $f['pes_min'] . ' a ' . $f['pes_max'] . ' pés', '$1 ' . $f['pax_min'] . ' a ' . $f['pax_max'] . ' pessoas', '<b data-frota-n>' . $f['n'] . '</b>', '${1}' . $f['pax_max'] . '$2'],
        $html
    );
}

function bb_ld_script($grafo)
{
    $j = json_encode(['@context' => 'https://schema.org', '@graph' => $grafo], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    return '<script type="application/ld+json">' . "\n  " . str_replace("\n", "\n  ", $j) . "\n  </script>";
}

/* Imagem de compartilhamento: o og.php entrega a foto em JPEG 1200x630 (/og/<foto>.jpg). Igual ao og_url do gerador. */
function bb_og_url($foto)
{
    return BB_DOM . 'og/' . preg_replace('#\.(webp|jpg)(\?.*)?$#', '', ltrim($foto, '/')) . '.jpg';
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
    $html = preg_replace('#<meta property="og:url" content="[^"]*">#', '<meta property="og:url" content="' . bb_e($canonico) . '">', $html, 1);
    $html = preg_replace('#<meta property="og:image" content="[^"]*">#', '<meta property="og:image" content="' . bb_e(bb_og_url($og)) . '">', $html, 1);
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

/* No domínio oficial a página sai indexável e com o Google Tag Manager de sempre (ligado às contas de
   anúncio) e a verificação do Search Console. Na prévia (GitHub Pages e novo.) nada disso entra, para não
   indexar nem sujar os dados dos anúncios: o molde estático já vem com noindex. */
const BB_GTM = 'GTM-5FJVHJRJ';
function bb_eh_producao($host)
{
    return (bool) preg_match('/^(www\.)?barraboatfloripa\.com\.br$/i', (string) $host);
}
function bb_producao($h, $st, $p)
{
    if ($st === 200) $h = preg_replace('#\s*<!-- PRÉVIA:[^>]*-->\s*<meta name="robots" content="noindex, nofollow">#u', '', $h, 1);
    $verif = $p === '' ? "\n  <meta name=\"google-site-verification\" content=\"google5eba1bbfca68b875\">" : '';
    $gtm = "<!-- Google Tag Manager -->\n  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});"
        . "var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;"
        . "j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','" . BB_GTM . "');</script>";
    $h = preg_replace('#<head>#', "<head>\n  " . $gtm . $verif, $h, 1);
    $ns = '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=' . BB_GTM . '" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>';
    return preg_replace('#(<body[^>]*>)#', "$1\n" . $ns, $h, 1);
}

function bb_404()
{
    $h = bb_molde('404.html');
    // o 404 aparece em qualquer profundidade: os caminhos dele são da raiz
    return [404, $h === null ? 'Página não encontrada' : preg_replace('#<head>#', "<head>\n  <base href=\"/\">", $h, 1)];
}

/* $p: caminho pedido sem a barra inicial ("", "lanchas/", "lanchas/1564/", "sobre/").
   $lanchas: lanchas ativas na ordem do site, ou null se o banco não respondeu.
   $conteudo: ['faq' => [...], 'avaliacoes' => [...], 'roteiros' => [...]] do painel, ou null.
   Devolve [status, html]; com status 301, o segundo item é o caminho de destino (sem o idioma). */
function bb_render($p, $lanchas, $fonte_api = 'api/disponibilidade.php', $conteudo = null)
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
        // escondida no painel: se a lancha já teve página (o Google e links antigos conhecem o endereço),
        // leva para a lista de lanchas; endereço que nunca existiu é 404
        if ($l === null) return is_file(BB_RAIZ . '/' . $p . 'index.html') ? [301, 'lanchas/'] : bb_404();
        $h = bb_molde($p . 'index.html');
        if ($h === null) {
            $outras = glob(BB_RAIZ . '/lanchas/*/index.html') ?: [];
            // lancha nova (cadastrada no painel, sem página no gerador): o molde de outra lancha serve de
            // casca; o miolo inteiro é trocado abaixo. Sempre pelo bb_molde, que troca CRLF por LF.
            $h = $outras ? bb_molde(substr($outras[0], strlen(BB_RAIZ) + 1)) : null;
        }
        if ($h === null) return bb_404();
        list($titulo, $desc, $og, $corpo, $ld) = bb_pagina_lancha($l, $lanchas, $pre, $pre . $fonte_api);
        $h = bb_cabeca($h, $titulo, $desc, BB_DOM . $p, $og, $ld);
        $antes = $h;
        $h = bb_troca_entre($h, '<main id="conteudo">' . "\n", "\n  </main>", $corpo);
        if ($h === $antes) return bb_404();   // não achou onde trocar: melhor 404 que a página de outra lancha
        return [200, bb_textos_frota(bb_opcoes_form($h, $lanchas), bb_frota($lanchas))];
    }

    $h = bb_molde($p . 'index.html');
    if ($h === null) return bb_404();
    $h = bb_conteudo_na_pagina($h, $p, $pre, $conteudo);
    if ($lanchas === null) return [200, $h];

    // página de roteiro: a amostra de lanchas sai das ativas
    if (strpos($h, '<h2 id="escolha-titulo"') !== false) {
        $h = bb_troca_ul($h, '<ul class="grade-lanchas" data-grade-lanchas>', "
" . bb_cards(bb_lanchas_amostra($lanchas), $pre) . "
          ");
    }

    if ($p === '') {
        $h = bb_troca_ul($h, '<ul class="trilho__lista" data-trilho-lista>', "\n" . bb_cards($lanchas, $pre) . "\n        ");
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
    return [200, bb_textos_frota(bb_opcoes_form($h, $lanchas), bb_frota($lanchas))];
}

/* Perguntas e avaliações (home) e paradas e regras (página do roteiro), quando o banco tem. */
function bb_conteudo_na_pagina($h, $p, $pre, $c)
{
    if (!is_array($c)) return $h;
    if ($p === '') {
        if (!empty($c['faq'])) {
            $h = bb_troca_entre($h, '<div class="faq__lista">' . "
", "
      </div>
    </section>", bb_faq_html($c['faq']));
            $ld = bb_faq_ld($c['faq']);
            $h = bb_mexe_ld($h, function ($g) use ($ld) {
                foreach ($g as &$n) if (isset($n['@type']) && $n['@type'] === 'FAQPage') $n['mainEntity'] = $ld;
                return $g;
            });
        }
        if (!empty($c['instagram'])) {
            $h = bb_troca_entre($h, '<ul class="trilho__lista insta__lista">' . "
", "
        </ul>", bb_reels_html($c['instagram'], $pre));
        }
        if (!empty($c['avaliacoes'])) {
            $h = bb_troca_entre($h, '<div class="avaliacoes__galeria">' . "
", "
      </div>
    </section>", bb_avaliacoes_html($c['avaliacoes']));
        }
    }
    foreach (isset($c['roteiros']) ? $c['roteiros'] : [] as $r) {
        if ($p === $r['slug'] . '/') $h = bb_pagina_roteiro($h, $r, $pre);
    }
    return bb_fichas_na_pagina($h, $p, $c);
}
