<?php
/* Barra Boat Floripa | api/agenda.php
   Botão "Ler agora" do painel: lê na hora a agenda de UM parceiro (todas as lanchas dele).
   POST {"parceiro_id": "..."} com o login do painel (Authorization: Bearer <token>).
   Só a dona e a atendente podem. Responde {"ok": true, "total": n, "lanchas": {nome: n}} ou {"ok": false, "erro": "..."}. */

require_once dirname(__DIR__) . '/lib/painel.php';
require_once dirname(__DIR__) . '/lib/agenda.php';

bb_quem_pede(['dona', 'atendente']);

$in = bb_entrada();
$id = (string) ($in['parceiro_id'] ?? '');
if (!preg_match('/^[0-9a-f-]{36}$/i', $id)) bb_responde(400, ['ok' => false, 'erro' => 'Parceiro não encontrado.']);
// no máximo uma leitura a cada 20 s por parceiro
if (!is_dir(BB_CACHE)) @mkdir(BB_CACHE, 0755, true);
$marca = BB_CACHE . '/ler-' . $id . '.marca';
if (is_file($marca) && time() - filemtime($marca) < 20) bb_responde(429, ['ok' => false, 'erro' => 'Acabei de ler esta agenda. Espere alguns segundos.']);
@touch($marca);
$ps = bb_agenda_parceiros($id);
if ($ps === null) bb_responde(503, ['ok' => false, 'erro' => 'Não consegui falar com o banco agora. Tente de novo.']);
if (!$ps) bb_responde(404, ['ok' => false, 'erro' => 'Este parceiro não tem agenda conectada por link.']);
bb_responde(200, bb_agenda_ler_parceiro($ps[0][0], $ps[0][1]));
