-- ============================================================
-- Barra Boat Floripa: APAGA os dados fictícios de supabase/demo/carregar.sql.
-- Rodar no SQL Editor antes de lançar. Pode rodar mais de uma vez.
--
-- Remove só o que tem id começando com de300000- (e os leads com
-- origem_import = 'demo'). O que a Michele cadastrar de verdade fica.
-- Metas: só as marcadas demo = true (migração 2026-11-20-07). Meta salva pelo painel fica.
-- Também apaga os testes feitos na apresentação de 19/11 (3 manutenções na
-- Phantom 36 C e a despesa "Posto do fulaninho"), listados pelo id.
-- As lanchas voltam a ficar sem parceiro (o banco faz isso ao apagar o parceiro).
--
-- CUIDADO: o que a Michele cadastrar ligado a um registro de exemplo some junto
-- (pagamento anotado num cliente de exemplo, por exemplo). Por isso o painel mostra
-- o selo "exemplo" nesses registros: ela cria os dela, não edita os de exemplo.
-- ============================================================

begin;

delete from public.bb_comissoes    where id::text like 'de300000-%' or parceiro_id::text like 'de300000-%';
delete from public.bb_despesas     where id::text like 'de300000-%'
                                       or id = '80d3da53-2dc5-4ed0-ace6-ad9df52ab703';   -- teste de 19/11
delete from public.bb_passeios     where id::text like 'de300000-%';
delete from public.bb_recebimentos where id::text like 'de300000-%';
delete from public.bb_leads        where id::text like 'de300000-%' or origem_import = 'demo';
delete from public.bb_bloqueios    where id::text like 'de300000-%'
                                       or id in ('08383f67-6dd1-4efe-9a4e-0df9c509e5c6', '6f7ace10-cdd0-403b-bf5d-f6bbd6a269ff',
                                                 '6fcb36a7-7ec2-42d0-849b-a309cdc6e88c');   -- testes de 19/11
delete from public.bb_metas        where demo;
delete from public.bb_parceiro_lanchas where parceiro_id::text like 'de300000-%';
-- lancha que era de parceiro de exemplo: a forma de agenda escolhida no teste também sai
update public.bb_lanchas set agenda_tipo = null, agenda_url = null, agenda_erro = null, agenda_lida_at = null
 where parceiro_id::text like 'de300000-%';
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
union all select 'metas de exemplo', count(*) from public.bb_metas where demo
union all select 'marinheiros', count(*) from public.bb_marinheiros where id::text like 'de300000-%'
union all select 'lanchas com parceiro de exemplo', count(*) from public.bb_lanchas where parceiro_id::text like 'de300000-%';
