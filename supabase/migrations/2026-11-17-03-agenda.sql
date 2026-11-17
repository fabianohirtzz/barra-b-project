-- ============================================================
-- Barra Boat Floripa: agenda. Passeios, passageiros, bloqueios, períodos
-- fechados, agenda do dono e a disponibilidade que o site mostra.
-- Depende de 01 e 02. Idempotente.
-- ============================================================

-- ---------- passeios (o dia reservado na lancha) ----------
create table if not exists public.bb_passeios (
  id                uuid primary key default gen_random_uuid(),
  lancha_id         uuid not null references public.bb_lanchas(id) on delete restrict,
  dia               date not null,
  hora_saida        time,
  roteiro_id        uuid references public.bb_roteiros(id) on delete set null,
  lead_id           uuid references public.bb_leads(id) on delete set null,
  marinheiro_id     uuid references public.bb_marinheiros(id) on delete set null,
  pessoas           int check (pessoas is null or pessoas > 0),
  status            text not null default 'marcado' check (status in ('marcado','realizado','cancelado')),
  obs               text,
  -- lista de passageiros (item 49): o cliente preenche por um link com este token
  lista_token       uuid not null default gen_random_uuid() unique,
  lista_enviada_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
-- UM passeio por lancha por dia, garantido pelo BANCO. Duas abas do painel, ou o
-- painel e o robô ao mesmo tempo, cabem na janela entre "conferir" e "gravar";
-- o unique é o cadeado (mesmo remédio da PO). Cancelado libera o dia.
create unique index if not exists bb_passeios_lancha_dia_uniq
  on public.bb_passeios (lancha_id, dia) where status <> 'cancelado';
create index if not exists bb_passeios_dia_idx on public.bb_passeios (dia);
create index if not exists bb_passeios_marinheiro_idx on public.bb_passeios (marinheiro_id, dia);

create table if not exists public.bb_passageiros (
  id          uuid primary key default gen_random_uuid(),
  passeio_id  uuid not null references public.bb_passeios(id) on delete cascade,
  nome        text not null,
  documento   text,
  nascimento  date,
  telefone    text,
  ordem       int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists bb_passageiros_passeio_idx on public.bb_passageiros (passeio_id, ordem);

-- ---------- bloqueios: manutenção e agenda fechada por período ----------
-- Um dia só ou um período (inicio = fim para um dia). lancha_id nulo = todas.
create table if not exists public.bb_bloqueios (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('manutencao','fechado')),
  lancha_id   uuid references public.bb_lanchas(id) on delete cascade,
  inicio      date not null,
  fim         date not null,
  motivo      text,              -- só a equipe vê: "Férias", "Empresa fechada"...
  created_at  timestamptz not null default now(),
  constraint bb_bloqueios_periodo_chk check (fim >= inicio)
);
create index if not exists bb_bloqueios_periodo_idx on public.bb_bloqueios (inicio, fim);

-- Nenhum passeio NOVO entra em dia bloqueado (decisão de 17/11). Os que já
-- estavam marcados antes do bloqueio continuam: a regra vale só no INSERT e
-- quando o passeio muda de dia ou de lancha. A mensagem aparece no painel.
create or replace function public.bb_passeio_confere_bloqueio()
returns trigger language plpgsql set search_path = '' as $$
declare b record;
begin
  if new.status = 'cancelado' then return new; end if;
  if tg_op = 'UPDATE' and new.dia = old.dia and new.lancha_id = old.lancha_id and old.status <> 'cancelado' then
    return new;
  end if;
  select * into b from public.bb_bloqueios
   where new.dia between inicio and fim and (lancha_id is null or lancha_id = new.lancha_id)
   limit 1;
  if found then
    raise exception using
      errcode = 'P0001',
      message = case when b.tipo = 'fechado'
        then format('A agenda está fechada de %s a %s. Reabra o período para marcar este passeio.',
                    to_char(b.inicio, 'DD/MM'), to_char(b.fim, 'DD/MM'))
        else format('A lancha está bloqueada para manutenção em %s.', to_char(new.dia, 'DD/MM')) end;
  end if;
  return new;
end $$;
drop trigger if exists bb_passeios_bloqueio on public.bb_passeios;
create trigger bb_passeios_bloqueio before insert or update on public.bb_passeios
  for each row execute function public.bb_passeio_confere_bloqueio();

-- ---------- agenda do dono (item 48) ----------
-- Só o DIA ocupado. O título dos eventos da agenda do parceiro não é guardado:
-- é a agenda pessoal de outra pessoa e o painel não precisa dele.
-- Para google/planilha o leitor (cron PHP a cada 15 min) troca o conjunto
-- inteiro da lancha numa transação; 'manual' é lançado pela equipe.
create table if not exists public.bb_agenda_dono (
  lancha_id  uuid not null references public.bb_lanchas(id) on delete cascade,
  dia        date not null,
  origem     text not null check (origem in ('google','planilha','manual')),
  lido_at    timestamptz not null default now(),
  primary key (lancha_id, dia, origem)
);

-- ---------- disponibilidade ----------
-- O que o site (pelo PHP) e o parceiro revendedor enxergam: só lancha e dia
-- ocupado, nunca nome, valor ou motivo.
create or replace view public.bb_dias_ocupados with (security_invoker = true) as
  select p.lancha_id, p.dia from public.bb_passeios p where p.status <> 'cancelado'
  union
  select a.lancha_id, a.dia from public.bb_agenda_dono a
  union
  select l.id, g.d::date
    from public.bb_bloqueios b
    join public.bb_lanchas l on b.lancha_id is null or b.lancha_id = l.id
    cross join lateral generate_series(b.inicio::timestamp, b.fim::timestamp, interval '1 day') as g(d);

-- Para o PHP do site: {slug: [AAAA-MM-DD]} no mesmo formato do
-- assets/data/disponibilidade.json da prévia. Roda com a service_role.
create or replace function public.bb_disponibilidade_site(de date default current_date, ate date default current_date + 180)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(slug, dias), '{}'::jsonb) from (
    select l.slug, jsonb_agg(distinct o.dia order by o.dia) as dias
      from public.bb_dias_ocupados o join public.bb_lanchas l on l.id = o.lancha_id
     where o.dia between de and ate and l.ativo
     group by l.slug) x
$$;
revoke execute on function public.bb_disponibilidade_site(date, date) from public, anon, authenticated;

-- Para o parceiro revendedor logado: só as lanchas liberadas para ele.
create or replace function public.bb_disponibilidade_parceiro(de date default current_date, ate date default current_date + 90)
returns table (lancha_id uuid, nome text, passageiros int, dia date)
language sql stable security definer set search_path = '' as $$
  select l.id, l.nome, l.passageiros, o.dia
    from public.bb_parceiro_lanchas pl
    join public.bb_lanchas l on l.id = pl.lancha_id and l.ativo
    left join public.bb_dias_ocupados o on o.lancha_id = l.id and o.dia between de and ate
   where pl.parceiro_id = public.bb_meu_parceiro()
$$;
revoke execute on function public.bb_disponibilidade_parceiro(date, date) from public, anon;
grant execute on function public.bb_disponibilidade_parceiro(date, date) to authenticated;

-- Para o marinheiro logado: a própria escala (item 39), sem valores.
create or replace function public.bb_meus_passeios(de date default current_date, ate date default current_date + 60)
returns table (passeio_id uuid, dia date, hora_saida time, lancha text, roteiro text, pessoas int, cliente text, passageiros bigint)
language sql stable security definer set search_path = '' as $$
  select p.id, p.dia, p.hora_saida, l.nome, r.nome, p.pessoas, ld.nome,
         (select count(*) from public.bb_passageiros x where x.passeio_id = p.id)
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

-- ---------- triggers e RLS ----------
drop trigger if exists bb_passeios_touch on public.bb_passeios;
create trigger bb_passeios_touch before update on public.bb_passeios
  for each row execute function public.bb_touch();
do $$
declare t text;
begin
  foreach t in array array['bb_passeios','bb_passageiros','bb_bloqueios']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_reg', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.bb_registra()', t || '_reg', t);
  end loop;
  foreach t in array array['bb_passeios','bb_passageiros','bb_bloqueios','bb_agenda_dono']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_equipe', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.bb_eh_equipe()) with check (public.bb_eh_equipe())', t || '_equipe', t);
  end loop;
end $$;
-- O link da lista de passageiros é público mas passa pelo PHP (service_role),
-- que confere o lista_token. Nenhuma policy para anon.
