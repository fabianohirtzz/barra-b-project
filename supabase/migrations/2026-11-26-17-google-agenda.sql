-- ============================================================
-- Barra Boat Floripa: agenda Google do parceiro conectada pela conta (OAuth), nos dois sentidos.
--
-- 1. O parceiro autoriza a conta Google uma vez (página /conectar-agenda/). O servidor lê a agenda
--    escolhida na hora em que ela muda (aviso do Google) e a cada minuto (cron), e grava o dia
--    ocupado de cada lancha. Vale para as lanchas DELE e para as que ele VENDE (bb_parceiro_lanchas):
--    se ele anota "Phantom 30 BBF, João" na agenda dele, o dia fecha na lancha da Michele.
-- 2. Passeio que a equipe marca, muda ou cancela numa lancha de parceiro conectado vira evento na
--    agenda Google dele (fila bb_google_fila, processada pelo servidor em segundos).
--
-- Cada dia lido guarda de qual agenda veio (bb_agenda_dono.fonte = id do parceiro), para duas
-- agendas poderem marcar a mesma lancha sem uma apagar a outra.
-- Rodar no SQL Editor. Idempotente.
-- ============================================================

-- ---------- 1. de qual agenda veio cada dia ----------
alter table public.bb_agenda_dono add column if not exists fonte text not null default '';
alter table public.bb_agenda_dono drop constraint if exists bb_agenda_dono_origem_check;
do $$ begin
  alter table public.bb_agenda_dono add constraint bb_agenda_dono_origem_check check (origem in ('google','planilha','manual','conta'));
exception when duplicate_object then null; end $$;
alter table public.bb_agenda_dono drop constraint if exists bb_agenda_dono_pkey;
alter table public.bb_agenda_dono add primary key (lancha_id, dia, origem, fonte);
-- os dias lidos antes não sabem de qual agenda vieram: saem, e a próxima leitura (1 minuto) refaz
delete from public.bb_agenda_dono where origem <> 'manual' and fonte = '';

-- Troca os dias lidos de UMA lancha vindos de UMA agenda (fonte = parceiro). Os marcados à mão ficam.
create or replace function public.bb_agenda_troca2(p_lancha uuid, p_origem text, p_fonte text, p_dias date[], p_de date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_sai int; v_entra int;
begin
  if p_origem not in ('google','planilha','conta') then raise exception 'origem inválida: %', p_origem; end if;
  if coalesce(p_fonte, '') = '' then raise exception 'fonte vazia'; end if;
  delete from public.bb_agenda_dono a
   where a.lancha_id = p_lancha and a.fonte = p_fonte and a.origem <> 'manual' and a.dia >= p_de
     and (a.origem <> p_origem or not (a.dia = any(coalesce(p_dias, '{}'))));
  get diagnostics v_sai = row_count;
  insert into public.bb_agenda_dono (lancha_id, dia, origem, fonte)
  select p_lancha, d, p_origem, p_fonte from unnest(coalesce(p_dias, '{}')) as d where d >= p_de
  on conflict (lancha_id, dia, origem, fonte) do update set lido_at = now();
  get diagnostics v_entra = row_count;
  return jsonb_build_object('sairam', v_sai, 'entraram', v_entra,
    'total', (select count(*) from public.bb_agenda_dono a where a.lancha_id = p_lancha and a.fonte = p_fonte and a.origem = p_origem and a.dia >= p_de));
end $$;
revoke execute on function public.bb_agenda_troca2(uuid, text, text, date[], date) from public, anon, authenticated;

-- Trocou o link, o tipo ou a regra: saem os dias lidos da agenda DELE (em qualquer lancha).
create or replace function public.bb_parceiro_agenda_mudou()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.bb_agenda_dono a where a.fonte = new.id::text and a.origem <> 'manual';
  return new;
end $$;

-- Deixou de vender uma lancha: saem os dias que a agenda dele marcava nela.
create or replace function public.bb_parceiro_lancha_saiu()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.bb_agenda_dono a where a.lancha_id = old.lancha_id and a.fonte = old.parceiro_id::text and a.origem <> 'manual';
  return old;
end $$;
revoke execute on function public.bb_parceiro_lancha_saiu() from public, anon, authenticated;
drop trigger if exists bb_parceiro_lanchas_saiu on public.bb_parceiro_lanchas;
create trigger bb_parceiro_lanchas_saiu after delete on public.bb_parceiro_lanchas
  for each row execute function public.bb_parceiro_lancha_saiu();

-- ---------- 2. conta Google do parceiro ----------
alter table public.bb_parceiros
  add column if not exists google_email text,
  add column if not exists google_agenda_nome text;
alter table public.bb_parceiros drop constraint if exists bb_parceiros_agenda_tipo_ck;
do $$ begin
  alter table public.bb_parceiros add constraint bb_parceiros_agenda_tipo_ck check (agenda_tipo in ('google','planilha','manual','conta'));
exception when duplicate_object then null; end $$;

-- O segredo (refresh token, cifrado pelo servidor) fica aqui. Sem policy: só a service_role lê.
create table if not exists public.bb_google_contas (
  parceiro_id     uuid primary key references public.bb_parceiros(id) on delete cascade,
  email           text,
  refresh_cripto  text not null,
  agenda_id       text,
  agenda_nome     text,
  canal_id        text unique,
  canal_recurso   text,
  canal_expira    timestamptz,
  conectado_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.bb_google_contas enable row level security;
revoke all on public.bb_google_contas from anon, authenticated;

-- ---------- 3. passeios na agenda Google do dono ----------
alter table public.bb_passeios
  add column if not exists google_evento_id text,
  add column if not exists google_parceiro uuid,
  add column if not exists google_sync_at timestamptz,
  add column if not exists google_erro text;

create table if not exists public.bb_google_fila (
  id          bigint generated always as identity primary key,
  passeio_id  uuid not null,
  parceiro_id uuid,          -- onde o evento estava antes da mudança
  evento_id   text,
  criado_at   timestamptz not null default now()
);
alter table public.bb_google_fila enable row level security;
revoke all on public.bb_google_fila from anon, authenticated;

create or replace function public.bb_passeio_para_google()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.google_evento_id is not null then
      insert into public.bb_google_fila (passeio_id, parceiro_id, evento_id) values (old.id, old.google_parceiro, old.google_evento_id);
    end if;
    return old;
  end if;
  insert into public.bb_google_fila (passeio_id, parceiro_id, evento_id) values (new.id, new.google_parceiro, new.google_evento_id);
  return new;
end $$;
revoke execute on function public.bb_passeio_para_google() from public, anon, authenticated;

drop trigger if exists bb_passeios_google_ins on public.bb_passeios;
create trigger bb_passeios_google_ins after insert on public.bb_passeios
  for each row execute function public.bb_passeio_para_google();
drop trigger if exists bb_passeios_google_upd on public.bb_passeios;
-- só o que aparece no evento; a gravação do próprio servidor (colunas google_*) não volta para a fila
create trigger bb_passeios_google_upd after update on public.bb_passeios
  for each row when (
    (old.lancha_id, old.dia, old.hora_saida, old.roteiro_id, old.lead_id, old.marinheiro_id, old.pessoas, old.status,
     old.embarque_local, old.embarque_maps, old.pedido)
    is distinct from
    (new.lancha_id, new.dia, new.hora_saida, new.roteiro_id, new.lead_id, new.marinheiro_id, new.pessoas, new.status,
     new.embarque_local, new.embarque_maps, new.pedido))
  execute function public.bb_passeio_para_google();
drop trigger if exists bb_passeios_google_del on public.bb_passeios;
create trigger bb_passeios_google_del after delete on public.bb_passeios
  for each row execute function public.bb_passeio_para_google();

-- Lancha passou a ser de um parceiro conectado (ou ele acabou de conectar): os passeios futuros
-- dela entram na fila. Chamada pelo servidor depois de conectar.
create or replace function public.bb_google_enfileira_parceiro(p_parceiro uuid)
returns int language sql security definer set search_path = '' as $$
  with ins as (
    insert into public.bb_google_fila (passeio_id, parceiro_id, evento_id)
    select p.id, p.google_parceiro, p.google_evento_id
      from public.bb_passeios p join public.bb_lanchas l on l.id = p.lancha_id
     where (l.parceiro_id = p_parceiro or p.google_parceiro = p_parceiro) and p.dia >= current_date - 1
    returning 1)
  select count(*)::int from ins
$$;
revoke execute on function public.bb_google_enfileira_parceiro(uuid) from public, anon, authenticated;

select 'ok' as google_agenda;
