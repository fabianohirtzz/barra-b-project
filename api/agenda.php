<?php
/* Barra Boat Floripa | api/agenda.php
   Botão "Ler agora" do painel: lê na hora a agenda do dono de UMA lancha.
   POST {"lancha_id": "..."} com o login do painel (Authorization: Bearer <token>).
   Só a dona e a atendente podem. Responde {"ok": true, "total": n} ou {"ok": false, "erro": "..."}. */

require_once dirname(__DIR__) . '/lib/painel.php';
require_once dirname(__DIR__) . '/lib/agenda.php';

bb_quem_pede(['dona', 'atendente']);

$in = bb_entrada();
$id = (string) ($in['lancha_id'] ?? '');
if (!preg_match('/^[0-9a-f-]{36}$/i', $id)) bb_responde(400, ['ok' => false, 'erro' => 'Lancha não encontrada.']);

// no máximo uma leitura a cada 20 s por lancha
if (!is_dir(BB_CACHE)) @mkdir(BB_CACHE, 0755, true);
$marca = BB_CACHE . '/ler-' . $id . '.marca';
if (is_file($marca) && time() - filemtime($marca) < 20) bb_responde(429, ['ok' => false, 'erro' => 'Acabei de ler esta agenda. Espere alguns segundos.']);
@touch($marca);

$ls = bb_agenda_lanchas($id);
if ($ls === null) bb_responde(503, ['ok' => false, 'erro' => 'Não consegui falar com o banco agora. Tente de novo.']);
if (!$ls) bb_responde(404, ['ok' => false, 'erro' => 'Esta lancha não tem agenda conectada por link.']);
bb_responde(200, bb_agenda_ler_lancha($ls[0]));
