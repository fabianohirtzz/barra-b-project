<?php
// Barra Boat Floripa | cron/agendas.php
// Lê as agendas dos donos (Google Agenda ou planilha) de todas as lanchas e grava
// os dias ocupados. Só roda pela linha de comando (cron do cPanel, a cada 15 min):
//
//   */15 * * * *   php -q $HOME/public_html/novo/cron/agendas.php > /dev/null 2>&1
//
// Pela web a pasta cron/ é fechada no .htaccess; mesmo assim este arquivo se recusa.

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

require_once dirname(__DIR__) . '/lib/agenda.php';

// uma leitura por vez (se a anterior travar, a próxima não empilha)
if (!is_dir(BB_CACHE)) @mkdir(BB_CACHE, 0755, true);
$trava = fopen(BB_CACHE . '/agendas.lock', 'c');
if (!$trava || !flock($trava, LOCK_EX | LOCK_NB)) { echo "Outra leitura ainda está rodando.\n"; exit(0); }

$lanchas = bb_agenda_lanchas();
if ($lanchas === null) { fwrite(STDERR, "Não consegui ler as lanchas no Supabase.\n"); exit(1); }

$falhas = 0;
foreach ($lanchas as $l) {
    $r = bb_agenda_ler_lancha($l);
    if ($r['ok']) printf("%s: %d dias ocupados (+%d, -%d)\n", $l['nome'], $r['total'], $r['entraram'], $r['sairam']);
    else { $falhas++; printf("%s: %s\n", $l['nome'], $r['erro']); }
}
printf("%d lanchas lidas, %d com problema.\n", count($lanchas), $falhas);
flock($trava, LOCK_UN);
