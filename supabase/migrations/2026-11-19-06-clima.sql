-- ============================================================
-- Barra Boat Floripa: previsão do tempo para o alerta de clima (item 38).
-- Projeto COMPARTILHADO do HD360. Rodar no SQL Editor. Idempotente.
--
-- Um registro por dia, para o ponto de embarque (Canal da Barra da Lagoa).
-- Quem grava é o servidor (cron PHP com a service_role, a fonte ainda vai ser
-- escolhida); o painel só lê. O mesmo dado serve ao aviso de clima no WhatsApp
-- (bb_msgs_auto tipo 'clima').
-- ============================================================

create table if not exists public.bb_clima (
  dia            date primary key,
  vento_kmh      numeric(5,1),           -- vento médio máximo no horário do passeio (8h às 18h)
  rajada_kmh     numeric(5,1),
  direcao_graus  int check (direcao_graus is null or direcao_graus between 0 and 360),  -- de onde vem
  chuva_mm       numeric(5,1),           -- soma no horário do passeio
  chuva_prob     int check (chuva_prob is null or chuva_prob between 0 and 100),
  resumo         text,                   -- frase curta da fonte, se houver
  fonte          text not null,          -- 'demo' nos dados de exemplo
  lido_at        timestamptz not null default now()
);

alter table public.bb_clima enable row level security;
drop policy if exists bb_clima_equipe on public.bb_clima;
create policy bb_clima_equipe on public.bb_clima for select to authenticated using (public.bb_eh_equipe());
