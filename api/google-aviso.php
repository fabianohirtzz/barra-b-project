<?php
/* Barra Boat Floripa | api/google-aviso.php
   O Google chama este endereço quando a agenda conectada de um parceiro muda (canal aberto por
   bb_google_canal_abre). Responde na hora e lê a agenda dele em seguida. */

require_once dirname(__DIR__) . '/lib/google.php';

$canal = (string) ($_SERVER['HTTP_X_GOOG_CHANNEL_ID'] ?? '');
$token = (string) ($_SERVER['HTTP_X_GOOG_CHANNEL_TOKEN'] ?? '');
$estado = (string) ($_SERVER['HTTP_X_GOOG_RESOURCE_STATE'] ?? '');
http_response_code(200);
header('Content-Length: 0');
if (!preg_match('/^[0-9a-f]{32}$/', $canal) || $estado === 'sync' || !bb_google_pronto()) exit;

list($st, $r) = bb_supabase('GET', 'bb_google_contas?select=parceiro_id&canal_id=eq.' . $canal);
$pid = $st === 200 && !empty($r[0]) ? $r[0]['parceiro_id'] : null;
if (!$pid || !hash_equals(bb_google_token_canal($pid), $token)) exit;

// devolve a resposta ao Google antes de ler (ele espera poucos segundos)
ignore_user_abort(true);
if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
elseif (function_exists('litespeed_finish_request')) litespeed_finish_request();
else { @ob_end_flush(); flush(); }
bb_google_ler_agora($pid);
