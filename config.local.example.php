<?php
/* ============================================================
   MODELO, sem segredo. No SERVIDOR, crie "config.local.php"
   na raiz do site (mesma pasta do index) com este conteúdo e
   preencha os valores reais. O config.local.php não vai para
   o Git e o deploy nunca sobrescreve esse arquivo.
============================================================ */

// Supabase: chave service_role (SEGREDO: acesso total, ignora RLS).
// Supabase > Project Settings > API > "service_role" (projeto do HD360).
$SUPABASE_SERVICE_KEY = 'COLE_AQUI_A_SERVICE_ROLE';

// Senha inventada por nós que protege os scripts agendados (cron) pela web.
// Pode deixar vazio por enquanto: eu preencho quando cadastrarmos o cron.
$CRON_KEY = '';
