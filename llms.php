<?php
/* Barra Boat Floripa | llms.php
   O /llms.txt do servidor (o .htaccess manda para cá): o texto do llms.txt com os números da frota
   que estão no painel (quantas lanchas, pés e pessoas), como as páginas. Sem banco, vale o arquivo. */

require_once __DIR__ . '/lib/bb.php';
require_once __DIR__ . '/lib/site.php';

header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: public, max-age=3600');
$txt = (string) file_get_contents(__DIR__ . '/llms.txt');
$lanchas = bb_lanchas();
echo $lanchas ? bb_textos_frota($txt, bb_frota($lanchas)) : $txt;
