<?php
// Barra Boat Floripa | cron/agendas.php
// A cada minuto (cron do cPanel):
//   * * * * *   php -q $HOME/public_html/novo/cron/agendas.php > /dev/null 2>&1
//
// 1. Leva às agendas Google dos donos os passeios marcados, mudados ou cancelados (bb_google_fila).
// 2. Renova o aviso de mudança (canal) das contas Google que vencem em menos de 1 dia.
// 3. Lê as agendas dos parceiros: conta Google (todo minuto; o aviso do Google já lê na hora, isto
//    cobre aviso perdido) e por link (Google iCal ou planilha) e grava os dias ocupados de cada lancha.
// Só roda pela linha de comando. Pela web a pasta cron/ é fechada no .htaccess; mesmo assim este arquivo se recusa.

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

require_once dirname(__DIR__) . '/lib/google.php';

// uma rodada por vez (se a anterior travar, a próxima não empilha)
if (!is_dir(BB_CACHE)) @mkdir(BB_CACHE, 0755, true);
$trava = fopen(BB_CACHE . '/agendas.lock', 'c');
if (!$trava || !flock($trava, LOCK_EX | LOCK_NB)) { echo "Outra leitura ainda está rodando.\n"; exit(0); }

if (bb_google_pronto()) {
    $n = bb_google_processa_fila(100);
    if ($n) printf("%d passeios levados às agendas dos donos.\n", $n);
    list($st, $contas) = bb_supabase('GET', 'bb_google_contas?select=*&agenda_id=not.is.null');
    if ($st === 200) foreach ((array) $contas as $c) {
        if (empty($c['canal_expira']) || strtotime($c['canal_expira']) < time() + 86400) {
            printf("Aviso do Google %s para %s.\n", bb_google_canal_abre($c['parceiro_id'], $c) ? 'renovado' : 'NÃO renovado', $c['parceiro_id']);
        }
    }
}

$parceiros = bb_agenda_parceiros();
if ($parceiros === null) { fwrite(STDERR, "Não consegui ler os parceiros no Supabase.\n"); exit(1); }

$falhas = 0;
foreach ($parceiros as list($p, $lanchas, $vende)) {
    $r = $p['agenda_tipo'] === 'conta' ? bb_google_ler_agora($p['id']) : bb_agenda_ler_parceiro($p, $lanchas, $vende);
    if (!empty($r['fila'])) { printf("%s: leitura já em andamento.\n", $p['nome']); continue; }
    if ($r['ok']) {
        printf("%s: %d dias ocupados (+%d, -%d)\n", $p['nome'], $r['total'], $r['entraram'], $r['sairam']);
        foreach ($r['lanchas'] as $nome => $n) printf("   %s: %d\n", $nome, $n);
    } else { $falhas++; printf("%s: %s\n", $p['nome'], $r['erro']); }
}
printf("%d agendas lidas, %d com problema.\n", count($parceiros), $falhas);
flock($trava, LOCK_UN);
