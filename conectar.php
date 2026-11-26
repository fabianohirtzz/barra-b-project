<?php
/* Barra Boat Floripa | conectar.php  (/conectar-agenda/?c=<convite>)
   Página que o dono da lancha abre pelo link que a equipe manda no WhatsApp:
   1. explica o que a Barra Boat vê e faz na agenda dele e leva ao Google;
   2. depois da autorização (api/google-volta.php), ele escolhe a agenda onde anota as lanchas;
   3. o servidor liga o aviso de mudança, lê a agenda e manda as reservas já marcadas. */

require_once __DIR__ . '/lib/google.php';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');

function cx($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }
function primeiro_nome($n) { $p = preg_split('/\s+/', trim((string) $n)); return $p[0] ?? ''; }

$c = (string) ($_REQUEST['c'] ?? '');
$pid = bb_google_pronto() ? bb_google_confere_convite($c) : null;
$etapa = (string) ($_REQUEST['etapa'] ?? '');
$parceiro = null; $dele = []; $vende = [];
if ($pid) {
    list($st, $r) = bb_supabase('GET', 'bb_parceiros?select=id,nome&id=eq.' . rawurlencode($pid));
    $parceiro = $st === 200 && !empty($r[0]) ? $r[0] : null;
    if ($parceiro) {
        list($st, $ls) = bb_supabase('GET', 'bb_lanchas?select=id,nome,agenda_palavra,parceiro_id&order=nome');
        list($st2, $vs) = bb_supabase('GET', 'bb_parceiro_lanchas?select=lancha_id&parceiro_id=eq.' . rawurlencode($pid));
        $vids = array_map(function ($v) { return $v['lancha_id']; }, (array) $vs);
        foreach ((array) $ls as $l) {
            if ($l['parceiro_id'] === $pid) $dele[] = $l;
            elseif (in_array($l['id'], $vids, true)) $vende[] = $l;
        }
    }
}
$nome_agenda = function ($l) { return $l['agenda_palavra'] ? trim(explode(',', $l['agenda_palavra'])[0]) : $l['nome']; };

$corpo = '';
$titulo = 'Conectar a sua agenda';
if (!bb_google_pronto()) {
    $corpo = '<h1>Conexão em preparação</h1><p>A conexão com o Google Agenda ainda está sendo configurada. Tente de novo mais tarde ou fale com a nossa equipe.</p>';
} elseif (!$pid || !$parceiro) {
    $corpo = '<h1>Este link venceu</h1><p>O link de conexão vale por 14 dias. Peça um novo à equipe da Barra Boat pelo WhatsApp.</p>'
           . '<a class="botao" href="https://wa.me/5548991153172">Falar com a equipe</a>';
} elseif ($etapa === 'salvar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $conta = bb_google_conta($pid);
    $agendas = $conta ? bb_google_agendas($pid) : null;
    $escolha = null;
    foreach ((array) $agendas as $a) if ($a['id'] === (string) ($_POST['agenda'] ?? '')) $escolha = $a;
    if (!$conta || !$escolha) {
        $corpo = '<h1>Não deu certo</h1><p>Não consegui confirmar a agenda escolhida. Toque no botão para tentar de novo.</p><a class="botao" href="?c=' . cx($c) . '">Tentar de novo</a>';
    } else {
        $antiga = $conta['agenda_id'] && $conta['agenda_id'] !== $escolha['id'] ? $conta['agenda_id'] : null;
        bb_supabase('PATCH', 'bb_google_contas?parceiro_id=eq.' . rawurlencode($pid), ['agenda_id' => $escolha['id'], 'agenda_nome' => $escolha['nome'], 'updated_at' => gmdate('c')]);
        bb_supabase('PATCH', 'bb_parceiros?id=eq.' . rawurlencode($pid), ['agenda_tipo' => 'conta', 'google_email' => $conta['email'], 'google_agenda_nome' => $escolha['nome'], 'agenda_erro' => null, 'agenda_lida_at' => null]);
        $conta = bb_google_conta($pid);
        bb_google_canal_abre($pid, $conta);
        $lido = bb_google_ler_agora($pid);
        bb_google_reenvia_parceiro($pid, $antiga);
        $nomes = array_map($nome_agenda, array_merge($dele, $vende));
        $titulo = 'Agenda conectada';
        $corpo = '<p class="selo">Pronto</p><h1>Agenda conectada</h1>'
            . '<p>A agenda <b>' . cx($escolha['nome']) . '</b> (' . cx($conta['email']) . ') está ligada à Barra Boat.'
            . (!empty($lido['ok']) && isset($lido['total']) ? ' Encontramos <b>' . (int) $lido['total'] . ' ' . ((int) $lido['total'] === 1 ? 'dia ocupado' : 'dias ocupados') . '</b> daqui para a frente.' : '') . '</p>'
            . ($nomes ? '<h2>No dia a dia</h2><p>Ao anotar uma reserva, escreva o nome da lancha no título do evento. Os nomes que valem:</p><ul class="nomes">'
                . implode('', array_map(function ($n) { return '<li>' . cx($n) . '</li>'; }, $nomes)) . '</ul>'
                . '<p class="ajuda">Exemplo: <i>' . cx($nomes[0]) . ', João, 8 pessoas</i>.' . (count($dele) > 1 ? ' Evento sem nome de lancha fecha todas as suas lanchas naquele dia.' : '') . '</p>' : '')
            . '<p>As reservas que a nossa equipe marcar nas suas lanchas aparecem nessa agenda com o título "Reserva Barra Boat". Pode fechar esta página.</p>';
    }
} elseif ($etapa === 'agenda') {
    $conta = bb_google_conta($pid);
    $agendas = $conta ? bb_google_agendas($pid) : null;
    if (!$conta || $agendas === null) {
        $corpo = '<h1>Falta autorizar</h1><p>Não encontrei a autorização do Google. Toque no botão para conectar de novo.</p><a class="botao" href="?c=' . cx($c) . '">Conectar de novo</a>';
    } else {
        $titulo = 'Escolha a agenda';
        $op = '';
        foreach ($agendas as $i => $a) {
            $marca = $conta['agenda_id'] ? $a['id'] === $conta['agenda_id'] : $i === 0;
            $op .= '<label class="opcao"><input type="radio" name="agenda" value="' . cx($a['id']) . '"' . ($marca ? ' checked' : '') . '><span><b>' . cx($a['nome']) . '</b>'
                 . ($a['principal'] ? '<small>Agenda principal da conta</small>' : '') . '</span></label>';
        }
        $corpo = '<p class="selo">Passo 2 de 2</p><h1>Onde você anota as lanchas?</h1>'
            . '<p>Conta conectada: <b>' . cx($conta['email']) . '</b>. Escolha a agenda onde você anota as reservas das lanchas.</p>'
            . '<form method="post" action="?etapa=salvar"><input type="hidden" name="c" value="' . cx($c) . '">' . $op
            . '<button class="botao" type="submit">Usar esta agenda</button></form>'
            . '<p class="ajuda">Não é esta conta? <a href="?c=' . cx($c) . '">Conectar com outra conta Google</a>.</p>';
    }
} else {
    $erro = (string) ($_GET['erro'] ?? '');
    $msg = ['negou' => 'Você não autorizou no Google. Sem a autorização, os dias ocupados não chegam ao site.',
            'escopos' => 'Faltou marcar as caixas de permissão da agenda na tela do Google. Toque em conectar de novo e marque todas.',
            'google' => 'O Google não confirmou a autorização. Toque em conectar de novo.'][$erro] ?? '';
    $dele_n = array_map($nome_agenda, $dele);
    $corpo = '<p class="selo">Passo 1 de 2</p><h1>Oi, ' . cx(primeiro_nome($parceiro['nome'])) . '! Vamos ligar a sua agenda à Barra Boat</h1>'
        . ($msg ? '<p class="erro">' . cx($msg) . '</p>' : '')
        . '<p>Com a agenda conectada, os dias ocupados ' . (count($dele_n) > 1 ? 'das suas lanchas' : 'da sua lancha') . ' aparecem sozinhos no site, na hora, e as reservas que a nossa equipe marcar entram direto na sua agenda Google. Você faz isso uma vez só.</p>'
        . '<h2>O que a Barra Boat vê e faz</h2><ul class="lista">'
        . '<li>Lê os eventos <b>só da agenda que você escolher</b>, para saber quais dias estão ocupados e de qual lancha. Guardamos apenas o dia.</li>'
        . '<li>Cria, muda e apaga <b>só os eventos das reservas</b> que a nossa equipe marcar nas suas lanchas.</li>'
        . '<li>Não acessa o seu e-mail, contatos, fotos, Drive nem nada mais da sua conta.</li>'
        . '<li>Você desliga quando quiser: é só pedir à equipe, ou tirar a permissão em myaccount.google.com/permissions.</li></ul>'
        . '<h2>Na tela do Google</h2><ol class="lista">'
        . '<li>Entre com a conta Google da agenda onde você anota as lanchas.</li>'
        . '<li>Se aparecer <b>"O Google não verificou este app"</b>, toque em <b>Avançado</b> e depois em <b>Acessar Barra Boat Floripa (não seguro)</b>. É o aviso padrão enquanto o Google analisa o nosso pedido.</li>'
        . '<li>Na lista de permissões, marque <b>Selecionar tudo</b> (as caixas vêm desmarcadas) e toque em <b>Continuar</b>.</li><li>Escolha a agenda onde você anota as reservas das lanchas.</li></ol>'
        . '<a class="botao botao--google" href="' . cx(bb_google_url_autorizacao($c)) . '">Conectar com Google</a>';
}
?><!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= cx($titulo) ?> | Barra Boat Floripa</title>
<link rel="icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&display=swap" rel="stylesheet">
<style>
  :root { --marinho: #083359; --azul: #18608C; --texto: #1d2a36; --suave: #5b6b7a; --linha: #d9e3ec; --fundo: #f3f7fa; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--fundo); color: var(--texto); font: 17px/1.55 Archivo, system-ui, sans-serif; }
  header { background: linear-gradient(120deg, var(--marinho), var(--azul)); padding: 20px 16px; }
  header img { display: block; height: 40px; width: auto; margin: 0 auto; }
  main { max-width: 620px; margin: -12px auto 40px; padding: 28px 22px 30px; background: #fff; border-radius: 18px; box-shadow: 0 6px 24px rgba(8, 51, 89, .08); }
  @media (max-width: 660px) { main { margin: 0; border-radius: 0; box-shadow: none; } }
  h1 { font-stretch: 112%; font-weight: 750; font-size: 1.6rem; line-height: 1.2; color: var(--marinho); margin: 4px 0 14px; }
  h2 { font-stretch: 108%; font-size: 1.1rem; color: var(--marinho); margin: 26px 0 8px; }
  .selo { display: inline-block; margin: 0; font-size: .85rem; font-weight: 650; color: var(--azul); background: #e6f0f7; padding: 3px 10px; border-radius: 99px; }
  .lista { padding-left: 1.2em; margin: 0; } .lista li { margin: 6px 0; }
  .botao { display: block; width: 100%; margin-top: 26px; padding: 15px 18px; border: 0; border-radius: 12px; background: linear-gradient(120deg, var(--marinho), var(--azul));
    color: #fff; font: 650 1.05rem Archivo, sans-serif; text-align: center; text-decoration: none; cursor: pointer; }
  .botao:focus-visible, .opcao input:focus-visible { outline: 3px solid #f2b53a; outline-offset: 2px; }
  .opcao { display: flex; gap: 12px; align-items: flex-start; padding: 14px; margin: 10px 0; border: 1.5px solid var(--linha); border-radius: 12px; cursor: pointer; }
  .opcao:has(input:checked) { border-color: var(--azul); background: #f2f8fc; }
  .opcao input { margin-top: 5px; width: 20px; height: 20px; accent-color: var(--azul); }
  .opcao small { display: block; color: var(--suave); font-size: .9rem; }
  .ajuda { color: var(--suave); font-size: .95rem; } a { color: var(--azul); }
  .erro { background: #fdecea; color: #8a1c12; padding: 12px 14px; border-radius: 10px; }
  .nomes { display: flex; flex-wrap: wrap; gap: 8px; padding: 0; list-style: none; } .nomes li { background: #e6f0f7; color: var(--marinho); font-weight: 650; padding: 5px 12px; border-radius: 99px; }
</style>
</head>
<body>
<header><img src="/assets/img/marca/logo-branco.png" alt="Barra Boat Floripa" width="160" height="40"></header>
<main><?= $corpo ?></main>
</body>
</html>
