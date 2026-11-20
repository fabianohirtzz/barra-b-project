-- ============================================================
-- Barra Boat Floripa: marca as metas de exemplo.
-- As metas não têm id; sem esta marca, a limpeza dos dados fictícios
-- (supabase/demo/apagar.sql) teria de apagar todas as metas, inclusive as da Michele.
-- O painel grava demo = false ao salvar uma meta. Idempotente.
-- ============================================================

alter table public.bb_metas add column if not exists demo boolean not null default false;

-- Em 20/11 todas as metas do banco vieram de supabase/demo/carregar.sql.
-- Só marca se ninguém mexeu ainda (rodar de novo não desmarca as da Michele).
update public.bb_metas set demo = true
 where not exists (select 1 from public.bb_metas where demo)
   and now() < '2026-11-21';

select count(*) filter (where demo) as metas_de_exemplo, count(*) as metas from public.bb_metas;
