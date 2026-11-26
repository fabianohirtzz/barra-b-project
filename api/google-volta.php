<?php
/* Barra Boat Floripa | api/google-volta.php
   Volta da autorização do Google: troca o código pelos tokens, guarda o refresh token cifrado em
   bb_google_contas e leva o dono à escolha da agenda (/conectar-agenda/?etapa=agenda). */

require_once dirname(__DIR__) . '/lib/google.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

$c = (string) ($_GET['state'] ?? '');
$pid = bb_google_pronto() ? bb_google_confere_convite($c) : null;
$volta = function ($q) use ($c) { header('Location: /conectar-agenda/?c=' . rawurlencode($c) . $q, true, 303); exit; };
if (!$pid) { header('Location: /conectar-agenda/', true, 303); exit; }
if (!empty($_GET['error'])) $volta('&erro=negou');
$code = (string) ($_GET['code'] ?? '');
if ($code === '') $volta('&erro=google');

$t = bb_google_troca_codigo($code);
if (!$t['ok']) $volta('&erro=google');
$tem = function ($e) use ($t) { return in_array($e, $t['escopos'], true); };
if (!$tem('https://www.googleapis.com/auth/calendar.events') || !$tem('https://www.googleapis.com/auth/calendar.calendarlist.readonly')) {
    if (!empty($t['refresh'])) bb_google_http('POST', 'https://oauth2.googleapis.com/revoke', ['token' => $t['refresh']], null, true);
    $volta('&erro=escopos');
}
if (empty($t['refresh'])) $volta('&erro=google');

$antes = bb_google_conta($pid);
list($st) = bb_supabase('POST', 'bb_google_contas?on_conflict=parceiro_id', [
    'parceiro_id' => $pid, 'email' => $t['email'], 'refresh_cripto' => bb_google_cifra($t['refresh']), 'updated_at' => gmdate('c'),
], 'resolution=merge-duplicates,return=minimal');
if ($st < 200 || $st >= 300) $volta('&erro=google');
// outra conta Google: a agenda escolhida antes não vale mais
if ($antes && $antes['email'] !== $t['email'] && $antes['agenda_id']) {
    bb_google_canal_fecha($antes);
    bb_supabase('PATCH', 'bb_google_contas?parceiro_id=eq.' . rawurlencode($pid), ['agenda_id' => null, 'agenda_nome' => null, 'canal_id' => null, 'canal_recurso' => null, 'canal_expira' => null]);
}
bb_google_guarda_acesso($pid, $t['access'], $t['expira']);
$volta('&etapa=agenda');
