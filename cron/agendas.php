<?php
// Barra Boat Floripa | cron/agendas.php
// Lê as agendas dos parceiros (Google Agenda ou planilha) e grava, lancha por lancha,
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

$parceiros = bb_agenda_parceiros();
if ($parceiros === null) { fwrite(STDERR, "Não consegui ler os parceiros no Supabase.
"); exit(1); }

$falhas = 0;
foreach ($parceiros as list($p, $lanchas)) {
    $r = bb_agenda_ler_parceiro($p, $lanchas);
    if ($r['ok']) {
        printf("%s: %d dias ocupados (+%d, -%d)
", $p['nome'], $r['total'], $r['entraram'], $r['sairam']);
        foreach ($r['lanchas'] as $nome => $n) printf("   %s: %d
", $nome, $n);
    } else { $falhas++; printf("%s: %s
", $p['nome'], $r['erro']); }
}
printf("%d agendas lidas, %d com problema.
", count($parceiros), $falhas);
flock($trava, LOCK_UN);
