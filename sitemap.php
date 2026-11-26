<?php
/* Barra Boat Floripa | sitemap.php
   O /sitemap.xml do servidor (o .htaccess manda para cá): as páginas fixas e só as lanchas
   ativas no painel, cada uma nos 9 idiomas com as alternativas (hreflang). Sem banco, entrega o
   sitemap.xml estático do gerador. */

require_once __DIR__ . '/lib/bb.php';
require_once __DIR__ . '/lib/site.php';
require_once __DIR__ . '/lib/i18n.php';

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600');

$lanchas = bb_lanchas();
if ($lanchas === null) { readfile(__DIR__ . '/sitemap.xml'); exit; }

$fixas = ['', 'lanchas/', 'roteiros/', 'ilha-do-campeche/', 'costa-da-lagoa/', 'sobre/', 'contato/', 'politica-de-cancelamento/', 'politica-de-privacidade/'];
$urls = array_merge(array_slice($fixas, 0, 2), array_map(function ($l) { return 'lanchas/' . $l['slug'] . '/'; }, $lanchas), array_slice($fixas, 2));
$hoje = date('Y-m-d');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' . "\n";
foreach ($urls as $u) {
    $alt = '';
    foreach (BB_IDIOMAS as $c => $i) $alt .= "\n    <xhtml:link rel=\"alternate\" hreflang=\"{$i[0]}\" href=\"" . htmlspecialchars(bb_url_idioma($c, $u)) . '"/>';
    $alt .= "\n    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"" . htmlspecialchars(bb_url_idioma('pt', $u)) . '"/>';
    foreach (array_keys(BB_IDIOMAS) as $c) {
        echo '  <url><loc>' . htmlspecialchars(bb_url_idioma($c, $u)) . "</loc><lastmod>$hoje</lastmod>$alt\n  </url>\n";
    }
}
echo "</urlset>\n";
