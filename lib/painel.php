<?php
/* Barra Boat Floripa | lib/painel.php
   Base dos endpoints chamados pelo painel (api/agenda.php, api/equipe.php):
   resposta JSON e quem está pedindo (token do login conferido no próprio Supabase). */

require_once __DIR__ . '/bb.php';

function bb_responde($st, $dados)
{
    http_response_code($st);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* Chamada ao Auth do Supabase com a service_role. [status, corpo] */
function bb_auth($metodo, $caminho, $corpo = null, $token = null)
{
    $chave = bb_config('SUPABASE_SERVICE_KEY');
    $cab = ['apikey: ' . $chave, 'Authorization: Bearer ' . ($token ?: $chave), 'Accept: application/json'];
    if ($corpo !== null) $cab[] = 'Content-Type: application/json';
    $ch = curl_init(BB_SUPABASE . '/auth/v1/' . $caminho);
    curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => $metodo, CURLOPT_HTTPHEADER => $cab, CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_TIMEOUT => 10]);
    if ($corpo !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($corpo));
    $txt = curl_exec($ch);
    $st = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$txt === false ? 0 : $st, $txt === false ? null : json_decode($txt, true)];
}

/* Confere o POST e o login. Devolve ['id' => user_id, 'papel' => ...] ou responde o erro e encerra. */
function bb_quem_pede(array $papeis)
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') bb_responde(405, ['ok' => false, 'erro' => 'Use POST.']);
    $aut = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($aut === '' && function_exists('getallheaders')) foreach (getallheaders() as $k => $v) if (strtolower($k) === 'authorization') $aut = $v;
    if (!preg_match('/^Bearer\s+([\w.-]+)$/', $aut, $m)) bb_responde(401, ['ok' => false, 'erro' => 'Entre no painel de novo.']);
    $chave = bb_config('SUPABASE_SERVICE_KEY');
    if (!$chave || strpos($chave, 'COLE_AQUI') !== false) bb_responde(503, ['ok' => false, 'erro' => 'O servidor ainda não está configurado.']);
    list($st, $u) = bb_auth('GET', 'user', null, $m[1]);
    if ($st !== 200 || empty($u['id'])) bb_responde(401, ['ok' => false, 'erro' => 'Entre no painel de novo.']);
    list($st, $eq) = bb_supabase('GET', 'bb_equipe?select=papel&ativo=eq.true&user_id=eq.' . rawurlencode($u['id']));
    if ($st !== 200 || empty($eq) || !in_array($eq[0]['papel'], $papeis, true)) bb_responde(403, ['ok' => false, 'erro' => 'Seu acesso não permite isso.']);
    return ['id' => $u['id'], 'papel' => $eq[0]['papel']];
}

function bb_entrada()
{
    $in = json_decode((string) file_get_contents('php://input'), true);
    return is_array($in) ? $in : [];
}
