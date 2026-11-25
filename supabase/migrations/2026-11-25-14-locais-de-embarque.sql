-- Locais de embarque cadastrados (pedido do Fabiano em 25/11): a equipe cadastra aos poucos os
-- pontos de onde os passeios saem; ao marcar o passeio, escolhe da lista e o link do mapa vem junto.
-- O passeio continua guardando a própria cópia (embarque_local / embarque_maps), então mudar ou
-- apagar um local não mexe nos passeios já marcados.

create table if not exists public.bb_embarques (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (length(trim(nome)) > 0),
  endereco    text,
  maps        text check (maps is null or maps ~ '^https?://'),
  obs         text,
  ativo       boolean not null default true,
  ordem       int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists bb_embarques_touch on public.bb_embarques;
create trigger bb_embarques_touch before update on public.bb_embarques
  for each row execute function public.bb_touch();

alter table public.bb_embarques enable row level security;
drop policy if exists bb_embarques_equipe on public.bb_embarques;
create policy bb_embarques_equipe on public.bb_embarques for all to authenticated
  using (public.bb_eh_equipe()) with check (public.bb_eh_equipe());

-- o ponto de sempre: a sede, no canal da Barra da Lagoa
insert into public.bb_embarques (nome, endereco, maps, ordem)
select 'Sede da Barra Boat (canal da Barra da Lagoa)', 'Rod. Jorn. Manoel de Menezes, 3007 - Barra da Lagoa, Florianópolis - SC',
       'https://maps.app.goo.gl/BpSAjwD4joPXAXKb7', 0
 where not exists (select 1 from public.bb_embarques);

select 'ok' as locais_de_embarque;
