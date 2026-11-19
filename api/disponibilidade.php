<?php
/* Barra Boat Floripa | api/disponibilidade.php
   Datas ocupadas de cada lancha para o calendário do site, no mesmo formato do
   assets/data/disponibilidade.json da prévia: {"ocupadas": {"slug": ["AAAA-MM-DD"]}}.
   Só dia ocupado: nunca nome, valor ou motivo. */

require_once dirname(__DIR__) . '/lib/bb.php';

$o = bb_ocupadas();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=60');
if ($o === null) {
    http_response_code(503);
    echo '{"ocupadas":{}}';
    exit;
}
echo json_encode(['ocupadas' => (object) $o], JSON_UNESCAPED_SLASHES);
