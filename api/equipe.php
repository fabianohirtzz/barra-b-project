<?php
/* Barra Boat Floripa | api/equipe.php
   Logins do painel. Só a dona. Criar login precisa da chave de administrador do
   Supabase (service_role), que só existe aqui no servidor.

   POST {"acao": "criar", "email", "nome", "papel": "atendente|parceiro|marinheiro", "parceiro_id"?, "marinheiro_id"?}
     -> {"ok": true, "senha": "..."}            login novo, com senha provisória
     -> {"ok": true, "senha": null, "ja_tinha": true}   o e-mail já tinha login neste projeto
   POST {"acao": "nova_senha", "user_id"} -> {"ok": true, "senha": "..."}

   O projeto do Supabase é dividido com outros clientes: só gera senha nova para
   login criado por aqui (marca bb_criado no app_metadata, que o usuário não altera). */

require_once dirname(__DIR__) . '/lib/painel.php';

$eu = bb_quem_pede(['dona']);
$in = bb_entrada();
$acao = (string) ($in['acao'] ?? '');

function senha_nova()
{
    $letras = 'abcdefghjkmnpqrstuvwxyz23456789';   // sem 0/o, 1/l/i: a pessoa digita no celular
    $s = '';
    for ($i = 0; $i < 12; $i++) {
        if ($i === 4 || $i === 8) $s .= '-';
        $s .= $letras[random_int(0, strlen($letras) - 1)];
    }
    return $s;
}

function uuid_ok($v)
{
    return is_string($v) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $v);
}

if ($acao === 'criar') {
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $nome = trim((string) ($in['nome'] ?? ''));
    $papel = (string) ($in['papel'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) bb_responde(400, ['ok' => false, 'erro' => 'Esse e-mail não parece certo. Confira.']);
    if ($nome === '' || mb_strlen($nome) > 80) bb_responde(400, ['ok' => false, 'erro' => 'Escreva o nome da pessoa.']);
    if (!in_array($papel, ['atendente', 'parceiro', 'marinheiro'], true)) bb_responde(400, ['ok' => false, 'erro' => 'Escolha o tipo de acesso.']);
    $linha = ['nome' => $nome, 'papel' => $papel, 'ativo' => true, 'parceiro_id' => null, 'marinheiro_id' => null];
    if ($papel === 'parceiro') {
        if (!uuid_ok($in['parceiro_id'] ?? null)) bb_responde(400, ['ok' => false, 'erro' => 'Escolha o parceiro.']);
        $linha['parceiro_id'] = $in['parceiro_id'];
    }
    if ($papel === 'marinheiro') {
        if (!uuid_ok($in['marinheiro_id'] ?? null)) bb_responde(400, ['ok' => false, 'erro' => 'Escolha o marinheiro.']);
        $linha['marinheiro_id'] = $in['marinheiro_id'];
    }

    list($st, $achou) = bb_supabase('POST', 'rpc/bb_usuario_por_email', ['p_email' => $email]);
    if ($st !== 200 || !is_array($achou)) bb_responde(503, ['ok' => false, 'erro' => 'Não consegui falar com o banco agora. Tente de novo.']);
    $senha = null;
    if ($achou) {
        $uid = $achou[0]['id'];
        list($st, $ja) = bb_supabase('GET', 'bb_equipe?select=papel&user_id=eq.' . rawurlencode($uid));
        if ($st === 200 && $ja) bb_responde(409, ['ok' => false, 'erro' => 'Esse e-mail já tem acesso ao painel. Procure a pessoa na lista.']);
    } else {
        $senha = senha_nova();
        list($st, $u) = bb_auth('POST', 'admin/users', [
            'email' => $email, 'password' => $senha, 'email_confirm' => true,
            'app_metadata' => ['bb_criado' => true], 'user_metadata' => ['nome' => $nome],
        ]);
        if (($st !== 200 && $st !== 201) || empty($u['id'])) bb_responde(502, ['ok' => false, 'erro' => 'Não consegui criar o login agora. Tente de novo.']);
        $uid = $u['id'];
    }
    $linha['user_id'] = $uid;
    list($st) = bb_supabase('POST', 'bb_equipe', $linha, 'return=minimal');
    if ($st !== 201) bb_responde(502, ['ok' => false, 'erro' => 'O login foi criado, mas não consegui liberar o painel. Tente de novo.']);
    bb_responde(200, ['ok' => true, 'user_id' => $uid, 'senha' => $senha, 'ja_tinha' => $senha === null]);
}

if ($acao === 'nova_senha') {
    $uid = $in['user_id'] ?? null;
    if (!uuid_ok($uid)) bb_responde(400, ['ok' => false, 'erro' => 'Pessoa não encontrada.']);
    if ($uid === $eu['id']) bb_responde(400, ['ok' => false, 'erro' => 'Para trocar a sua senha, use "Trocar minha senha".']);
    list($st, $eq) = bb_supabase('GET', 'bb_equipe?select=papel&user_id=eq.' . rawurlencode($uid));
    if ($st !== 200 || !$eq) bb_responde(404, ['ok' => false, 'erro' => 'Essa pessoa não tem acesso ao painel.']);
    list($st, $u) = bb_auth('GET', 'admin/users/' . rawurlencode($uid));
    if ($st !== 200 || empty($u['app_metadata']['bb_criado'])) {
        bb_responde(403, ['ok' => false, 'erro' => 'Este login não foi criado pelo painel da Barra Boat. A pessoa troca a senha por onde criou a conta.']);
    }
    $senha = senha_nova();
    list($st) = bb_auth('PUT', 'admin/users/' . rawurlencode($uid), ['password' => $senha]);
    if ($st !== 200) bb_responde(502, ['ok' => false, 'erro' => 'Não consegui trocar a senha agora. Tente de novo.']);
    bb_responde(200, ['ok' => true, 'senha' => $senha]);
}

bb_responde(400, ['ok' => false, 'erro' => 'Ação desconhecida.']);
