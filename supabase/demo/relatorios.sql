-- ============================================================
-- Barra Boat Floripa: exemplos para os Relatórios novos (25/11).
-- Contas fixas, as despesas que elas geraram mês a mês (jan/2025 até o mês passado; no mês atual
-- ficam 2 pendentes, para aparecer o aviso) e deslocamentos/personalizados em alguns passeios de exemplo.
-- Tudo com id de300000-... : o supabase/demo/apagar.sql tira antes do lançamento.
-- Pode rodar mais de uma vez.
-- ============================================================

begin;

insert into public.bb_despesas_fixas (id, categoria, valor, dia_do_mes, lancha_id, obs) values
  ('de300000-0000-4000-8000-0000000f0001', 'Marina e vaga', 1800, 5,  (select id from public.bb_lanchas where nome = 'Phantom 30 BBF'), 'Vaga na marina da Barra'),
  ('de300000-0000-4000-8000-0000000f0002', 'Seguro',        650,  10, (select id from public.bb_lanchas where nome = 'Phantom 30 BBF'), 'Seguro da lancha'),
  ('de300000-0000-4000-8000-0000000f0003', 'Anúncios',      1500, 1,  null, 'Google Ads'),
  ('de300000-0000-4000-8000-0000000f0004', 'Outros',        450,  20, null, 'Contador'),
  ('de300000-0000-4000-8000-0000000f0005', 'Outros',        180,  15, null, 'Internet e telefone')
on conflict (id) do nothing;

-- as despesas de cada mês, ligadas à conta fixa (uma por mês)
insert into public.bb_despesas (id, dia, categoria, valor, lancha_id, fixa_id, mes_ref, obs)
select ('de300000-0000-4000-8000-0f' || lpad(to_hex(f.n * 1000 + m.i), 10, '0'))::uuid,
       (m.mes + (f.dia_do_mes - 1))::date, f.categoria, f.valor, f.lancha_id, f.id, m.mes, f.obs
  from (select id, categoria, valor, dia_do_mes, lancha_id, obs, row_number() over (order by id) n
          from public.bb_despesas_fixas where id::text like 'de300000-%') f
  cross join (select gs::date mes, row_number() over (order by gs) i
                from generate_series('2025-01-01'::date, date_trunc('month', current_date)::date, interval '1 month') gs) m
 where m.mes < date_trunc('month', current_date)::date
    or f.dia_do_mes <= 10           -- no mês atual, só as que vencem até o dia 10 já foram anotadas
on conflict do nothing;

-- deslocamento e roteiro personalizado em alguns passeios de exemplo
update public.bb_passeios p set deslocamento = true, deslocamento_valor = x.v, personalizado = true,
       pedido = 'Buscar o grupo no píer de Jurerê, parada na Praia do Forte e volta no pôr do sol',
       embarque_local = 'Marina de Jurerê', roteiro_id = null
  from (select id, (array[250, 300, 400])[1 + (row_number() over (order by id))::int % 3] v
          from public.bb_passeios where id::text like 'de300000-%' order by id limit 12) x
 where p.id = x.id;

commit;

select 'contas fixas' o, count(*) from public.bb_despesas_fixas where id::text like 'de300000-%'
union all select 'despesas das contas fixas', count(*) from public.bb_despesas where fixa_id::text like 'de300000-%'
union all select 'passeios com deslocamento', count(*) from public.bb_passeios where deslocamento and id::text like 'de300000-%';
