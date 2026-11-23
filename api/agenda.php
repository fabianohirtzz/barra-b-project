<?php
/* Barra Boat Floripa | api/agenda.php
   Botão "Ler agora" do painel: lê na hora a agenda do dono de UMA lancha.
   POST {"lancha_id": "..."} com o login do painel (Authorization: Bearer <token>).
   Só a dona e a atendente podem. Responde {"ok": true, "total": n} ou {"ok": false, "erro": "..."}. */

require_once dirname(__DIR__) . '/lib/agenda.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function responde($st, $dados)
{
    http_response_code($st);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') responde(405, ['ok' => false, 'erro' => 'Use POST.']);

// quem está pedindo: o token do login do painel, conferido no próprio Supabase
$aut = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if ($aut === '' && function_exists('getallheaders')) foreach (getallheaders() as $k => $v) if (strtolower($k) === 'authorization') $aut = $v;
if (!preg_match('/^Bearer\s+([\w.-]+)$/', $aut, $m)) responde(401, ['ok' => false, 'erro' => 'Entre no painel de novo.']);
$chave = bb_config('SUPABASE_SERVICE_KEY');
if (!$chave) responde(503, ['ok' => false, 'erro' => 'O servidor ainda não está configurado.']);
$ch = curl_init(BB_SUPABASE . '/auth/v1/user');
curl_setopt_array($ch, [CURLOPT_HTTPHEADER => ['apikey: ' . $chave, 'Authorization: Bearer ' . $m[1]], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8]);
$u = json_decode((string) curl_exec($ch), true);
$st = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if ($st !== 200 || empty($u['id'])) responde(401, ['ok' => false, 'erro' => 'Entre no painel de novo.']);
list($st, $eq) = bb_supabase('GET', 'bb_equipe?select=papel&ativo=eq.true&user_id=eq.' . rawurlencode($u['id']));
if ($st !== 200 || empty($eq) || !in_array($eq[0]['papel'], ['dona', 'atendente'], true)) responde(403, ['ok' => false, 'erro' => 'Seu acesso não pode ler agendas.']);

$in = json_decode((string) file_get_contents('php://input'), true);
$id = is_array($in) ? (string) ($in['lancha_id'] ?? '') : '';
if (!preg_match('/^[0-9a-f-]{36}$/i', $id)) responde(400, ['ok' => false, 'erro' => 'Lancha não encontrada.']);

// no máximo uma leitura a cada 20 s por lancha
if (!is_dir(BB_CACHE)) @mkdir(BB_CACHE, 0755, true);
$marca = BB_CACHE . '/ler-' . $id . '.marca';
if (is_file($marca) && time() - filemtime($marca) < 20) responde(429, ['ok' => false, 'erro' => 'Acabei de ler esta agenda. Espere alguns segundos.']);
@touch($marca);

$ls = bb_agenda_lanchas($id);
if ($ls === null) responde(503, ['ok' => false, 'erro' => 'Não consegui falar com o banco agora. Tente de novo.']);
if (!$ls) responde(404, ['ok' => false, 'erro' => 'Esta lancha não tem agenda conectada por link.']);
responde(200, bb_agenda_ler_lancha($ls[0]));
