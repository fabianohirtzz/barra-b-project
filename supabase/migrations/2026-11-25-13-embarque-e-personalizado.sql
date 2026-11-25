-- ============================================================
-- Barra Boat Floripa: embarque, marinheiro de sempre e passeio personalizado.
-- - Lancha: local de embarque (texto e link do Google Maps), horário de embarque e o
--   marinheiro que costuma levar. Valem como sugestão ao marcar o passeio.
-- - Passeio: local de embarque próprio (o passeio guarda o que foi combinado; muda na
--   hora sem mexer na lancha), passeio personalizado (pedido do cliente) e deslocamento
--   (buscar o grupo em outro lugar, com o valor cobrado do cliente).
-- Rodar no SQL Editor. Idempotente.
-- ============================================================

alter table public.bb_lanchas
  add column if not exists embarque_local text,
  add column if not exists embarque_maps text,
  add column if not exists embarque_hora time,
  add column if not exists marinheiro_id uuid references public.bb_marinheiros(id) on delete set null;

alter table public.bb_passeios
  add column if not exists embarque_local text,
  add column if not exists embarque_maps text,
  add column if not exists personalizado boolean not null default false,
  add column if not exists pedido text,
  add column if not exists deslocamento boolean not null default false,
  add column if not exists deslocamento_valor numeric(10,2);

do $$ begin
  alter table public.bb_passeios add constraint bb_passeios_deslocamento_valor_ck check (deslocamento_valor is null or deslocamento_valor >= 0);
exception when duplicate_object then null; end $$;

-- Tela do marinheiro: passa a mostrar onde embarca e o pedido do passeio personalizado.
-- Do cliente, só o nome (nunca o telefone).
drop function if exists public.bb_meus_passeios(date, date);
create function public.bb_meus_passeios(de date default current_date - 1, ate date default current_date + 60)
returns table (passeio_id uuid, dia date, hora_saida time, lancha text, roteiro text, pessoas int, cliente text, passageiros bigint,
               embarque_local text, embarque_maps text, personalizado boolean, pedido text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.dia, p.hora_saida, l.nome, case when p.personalizado then 'Personalizado' else r.nome end, p.pessoas, ld.nome,
         (select count(*) from public.bb_passageiros x where x.passeio_id = p.id),
         coalesce(p.embarque_local, l.embarque_local), coalesce(p.embarque_maps, l.embarque_maps), p.personalizado, p.pedido
    from public.bb_passeios p
    join public.bb_lanchas l on l.id = p.lancha_id
    left join public.bb_roteiros r on r.id = p.roteiro_id
    left join public.bb_leads ld on ld.id = p.lead_id
   where p.marinheiro_id = public.bb_meu_marinheiro()
     and p.status <> 'cancelado' and p.dia between de and ate
   order by p.dia, p.hora_saida
$$;
revoke execute on function public.bb_meus_passeios(date, date) from public, anon;
grant execute on function public.bb_meus_passeios(date, date) to authenticated;

select 'ok' as embarque_e_personalizado;
