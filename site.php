<?php
/* Barra Boat Floripa | site.php
   Porta de entrada das páginas no servidor (o .htaccess manda as pastas para cá).
   Lê as lanchas do banco (com cache) e entrega a página montada por lib/site.php. */

require_once __DIR__ . '/lib/bb.php';
require_once __DIR__ . '/lib/site.php';

$p = isset($_GET['p']) ? (string) $_GET['p'] : '';
if (getenv('REDIRECT_STATUS') === '404' || isset($_SERVER['REDIRECT_STATUS']) && $_SERVER['REDIRECT_STATUS'] == 404) {
    list($st, $html) = bb_404();
} else {
    list($st, $html) = bb_render($p, bb_lanchas());
}

http_response_code($st);
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=60');
echo $html;
