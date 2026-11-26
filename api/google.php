<?php
/* Barra Boat Floripa | api/google.php
   Painel (dona e atendente), POST com o login:
   {"acao": "link", "parceiro_id"}        -> {"ok", "url"}  link de conexão para mandar ao dono (vale 14 dias)
   {"acao": "desconectar", "parceiro_id"} -> {"ok"}         desliga a conta Google do dono
   {"acao": "fila"}                       -> {"ok", "n"}    leva na hora os passeios mudados às agendas dos donos */

require_once dirname(__DIR__) . '/lib/painel.php';
require_once dirname(__DIR__) . '/lib/google.php';

bb_quem_pede(['dona', 'atendente']);
if (!bb_google_pronto()) bb_responde(503, ['ok' => false, 'erro' => 'A conexão com o Google ainda não está configurada no servidor.']);

$in = bb_entrada();
$acao = (string) ($in['acao'] ?? '');
$pid = (string) ($in['parceiro_id'] ?? '');
if ($acao !== 'fila' && !preg_match('/^[0-9a-f-]{36}$/i', $pid)) bb_responde(400, ['ok' => false, 'erro' => 'Parceiro não encontrado.']);

if ($acao === 'link') bb_responde(200, ['ok' => true, 'url' => bb_google_base() . 'conectar-agenda/?c=' . bb_google_convite($pid)]);
if ($acao === 'desconectar') { bb_google_desconecta($pid); bb_responde(200, ['ok' => true]); }
if ($acao === 'fila') bb_responde(200, ['ok' => true, 'n' => bb_google_processa_fila()]);
bb_responde(400, ['ok' => false, 'erro' => 'Ação desconhecida.']);
