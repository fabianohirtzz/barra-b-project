<?php
/* Barra Boat Floripa | site.php
   Porta de entrada das páginas no servidor (o .htaccess manda as pastas para cá).
   Lê as lanchas do banco (com cache) e entrega a página montada por lib/site.php. */

require_once __DIR__ . '/lib/bb.php';
require_once __DIR__ . '/lib/site.php';
require_once __DIR__ . '/lib/i18n.php';

// Depois da troca, a pasta novo/ continua dentro da raiz: pelo domínio oficial ela não pode virar
// um segundo site indexável. Quem chegar em barraboatfloripa.com.br/novo/... vai para a página certa.
if (bb_eh_producao($_SERVER['HTTP_HOST'] ?? '') && basename(BB_RAIZ) === 'novo') {
    $alvo = preg_replace('#^/novo(?=/|$)#', '', parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
    header('Location: https://barraboatfloripa.com.br' . ($alvo === '' ? '/' : $alvo), true, 301);
    exit;
}

// "/es/lanchas/" chega aqui como p=es/lanchas/: o idioma sai da frente e a página é montada em português
list($idioma, $p) = bb_separa_idioma(isset($_GET['p']) ? (string) $_GET['p'] : '');
if (getenv('REDIRECT_STATUS') === '404' || isset($_SERVER['REDIRECT_STATUS']) && $_SERVER['REDIRECT_STATUS'] == 404) {
    list($st, $html) = bb_404();
} else {
    list($st, $html) = bb_render($p, bb_lanchas(), 'api/disponibilidade.php', bb_conteudo());
    if ($st === 301) {
        header('Location: /' . ($idioma === 'pt' ? '' : $idioma . '/') . $html, true, 301);
        exit;
    }
    if ($st === 200) $html = bb_traduz_pagina($html, $idioma, $p);
}

if (bb_eh_producao($_SERVER['HTTP_HOST'] ?? '')) $html = bb_producao($html, $st, $p);
if ($st === 200) header('Content-Language: ' . BB_IDIOMAS[$idioma][0]);

http_response_code($st);
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=60');
echo $html;
