-- ============================================================
-- Barra Boat Floripa: APAGA os dados fictícios de supabase/demo/carregar.sql.
-- Rodar no SQL Editor antes de lançar. Pode rodar mais de uma vez.
--
-- Remove só o que tem id começando com de300000- (e os leads com
-- origem_import = 'demo'). O que a Michele cadastrar de verdade fica.
-- Exceção: as metas não têm id, então este arquivo apaga TODAS as metas de 2026.
-- As lanchas voltam a ficar sem parceiro (o banco faz isso ao apagar o parceiro).
-- ============================================================

begin;

delete from public.bb_comissoes    where id::text like 'de300000-%' or parceiro_id::text like 'de300000-%';
delete from public.bb_despesas     where id::text like 'de300000-%';
delete from public.bb_passeios     where id::text like 'de300000-%';
delete from public.bb_recebimentos where id::text like 'de300000-%';
delete from public.bb_leads        where id::text like 'de300000-%' or origem_import = 'demo';
delete from public.bb_bloqueios    where id::text like 'de300000-%';
delete from public.bb_metas        where mes between '2026-01-01' and '2026-12-01';
delete from public.bb_parceiro_lanchas where parceiro_id::text like 'de300000-%';
delete from public.bb_parceiros    where id::text like 'de300000-%';   -- lanchas.parceiro_id volta a nulo
delete from public.bb_marinheiros  where id::text like 'de300000-%';
delete from public.bb_clima        where fonte = 'demo';   -- previsão fictícia de clima.sql

-- histórico de alterações gerado pela carga e por esta limpeza
delete from public.bb_registro
 where linha_id like 'de300000-%'
    or (tabela in ('bb_lanchas', 'bb_parceiro_lanchas')
        and (antes ->> 'parceiro_id' like 'de300000-%' or depois ->> 'parceiro_id' like 'de300000-%'));

commit;

-- conferência: tudo deve dar 0
select 'clientes' o, count(*) from public.bb_leads where origem_import = 'demo' or id::text like 'de300000-%'
union all select 'passeios', count(*) from public.bb_passeios where id::text like 'de300000-%'
union all select 'despesas', count(*) from public.bb_despesas where id::text like 'de300000-%'
union all select 'parceiros', count(*) from public.bb_parceiros where id::text like 'de300000-%'
union all select 'marinheiros', count(*) from public.bb_marinheiros where id::text like 'de300000-%'
union all select 'lanchas com parceiro de exemplo', count(*) from public.bb_lanchas where parceiro_id::text like 'de300000-%';
