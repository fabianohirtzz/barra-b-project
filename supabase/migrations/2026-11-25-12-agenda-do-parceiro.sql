-- ============================================================
-- Barra Boat Floripa: a agenda do dono passa da lancha para o PARCEIRO.
-- Os parceiros anotam várias lanchas na mesma agenda. O leitor (lib/agenda.php)
-- baixa a agenda do parceiro uma vez e reparte cada compromisso pela lancha cujo
-- nome (ou a palavra combinada, bb_lanchas.agenda_palavra) aparece no título.
-- Compromisso sem nome de lancha: ocupa todas as lanchas dele (agenda_sem_nome =
-- 'todas', o padrão) ou nenhuma ('nenhuma'). Rodar no SQL Editor. Idempotente.
-- ============================================================

alter table public.bb_parceiros
  add column if not exists agenda_tipo text,
  add column if not exists agenda_url text,
  add column if not exists agenda_lida_at timestamptz,
  add column if not exists agenda_erro text,
  add column if not exists agenda_sem_nome text not null default 'todas';

do $$ begin
  alter table public.bb_parceiros add constraint bb_parceiros_agenda_tipo_ck check (agenda_tipo in ('google','planilha','manual'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.bb_parceiros add constraint bb_parceiros_agenda_sem_nome_ck check (agenda_sem_nome in ('todas','nenhuma'));
exception when duplicate_object then null; end $$;

-- palavra(s) que identificam a lancha nos compromissos do dono, separadas por vírgula ("Horus, H24").
-- Vazio: vale o nome da lancha.
alter table public.bb_lanchas add column if not exists agenda_palavra text;

-- 1) Leva para o parceiro o que estiver conectado numa lancha dele (hoje nenhuma).
update public.bb_parceiros p set agenda_tipo = l.agenda_tipo, agenda_url = l.agenda_url
  from (select distinct on (parceiro_id) parceiro_id, agenda_tipo, agenda_url
          from public.bb_lanchas where parceiro_id is not null and agenda_tipo is not null
         order by parceiro_id, updated_at desc) l
 where l.parceiro_id = p.id and p.agenda_tipo is null;

-- 2) A lancha deixa de ter agenda própria (as colunas ficam, sem uso).
drop trigger if exists bb_lanchas_agenda_mudou on public.bb_lanchas;
update public.bb_lanchas set agenda_tipo = null, agenda_url = null, agenda_erro = null where agenda_tipo is not null;

-- 3) Trocou o link, o tipo ou a regra do compromisso sem nome: os dias lidos das
-- lanchas dele saem na hora e a próxima leitura refaz (os marcados à mão ficam).
create or replace function public.bb_parceiro_agenda_mudou()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.bb_agenda_dono a using public.bb_lanchas l
   where a.lancha_id = l.id and l.parceiro_id = new.id and a.origem <> 'manual';
  return new;
end $$;
revoke execute on function public.bb_parceiro_agenda_mudou() from public, anon, authenticated;
drop trigger if exists bb_parceiros_agenda_mudou on public.bb_parceiros;
create trigger bb_parceiros_agenda_mudou after update of agenda_tipo, agenda_url, agenda_sem_nome on public.bb_parceiros
  for each row when (old.agenda_url is distinct from new.agenda_url or old.agenda_tipo is distinct from new.agenda_tipo
                     or old.agenda_sem_nome is distinct from new.agenda_sem_nome)
  execute function public.bb_parceiro_agenda_mudou();

-- 4) A lancha mudou de dono ou de palavra: os dias lidos dela saem; a próxima leitura refaz.
create or replace function public.bb_lancha_dono_mudou()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.bb_agenda_dono where lancha_id = new.id and origem <> 'manual';
  return new;
end $$;
revoke execute on function public.bb_lancha_dono_mudou() from public, anon, authenticated;
drop trigger if exists bb_lanchas_dono_mudou on public.bb_lanchas;
create trigger bb_lanchas_dono_mudou after update of parceiro_id, agenda_palavra on public.bb_lanchas
  for each row when (old.parceiro_id is distinct from new.parceiro_id or old.agenda_palavra is distinct from new.agenda_palavra)
  execute function public.bb_lancha_dono_mudou();

-- 5) Resultado da leitura no parceiro (o painel mostra "lida às 10h15" ou o erro).
create or replace function public.bb_agenda_parceiro_lido(p_parceiro uuid, p_erro text)
returns void language sql security definer set search_path = '' as $$
  update public.bb_parceiros
     set agenda_lida_at = case when p_erro is null then now() else agenda_lida_at end,
         agenda_erro = left(p_erro, 300)
   where id = p_parceiro
$$;
revoke execute on function public.bb_agenda_parceiro_lido(uuid, text) from public, anon, authenticated;

select 'ok' as agenda_do_parceiro;
