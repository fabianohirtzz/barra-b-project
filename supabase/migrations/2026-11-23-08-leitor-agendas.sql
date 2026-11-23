-- ============================================================
-- Barra Boat Floripa: leitor das agendas dos donos (item 48).
-- O cron PHP (cron/agendas.php, a cada 15 min) e o botão "Ler agora" do painel
-- (api/agenda.php) leem o Google Agenda ou a planilha de cada lancha e gravam
-- só os DIAS ocupados em bb_agenda_dono. Rodar no SQL Editor. Idempotente.
-- ============================================================

-- 1) O registro de alterações (bb_registro) não anota a leitura automática.
-- Sem isto, cada leitura gravaria "agenda lida às 10h15" no histórico da lancha
-- (96 linhas por dia por lancha). Mudança só em updated_at, agenda_lida_at ou
-- agenda_erro não entra no registro; o resto continua igual.
create or replace function public.bb_registra()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE'
     and (to_jsonb(old) - array['updated_at','agenda_lida_at','agenda_erro'])
       = (to_jsonb(new) - array['updated_at','agenda_lida_at','agenda_erro']) then
    return new;
  end if;
  insert into public.bb_registro (user_id, tabela, linha_id, acao, antes, depois)
  values (auth.uid(), tg_table_name,
          coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'id',
                   (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'user_id'),
          tg_op,
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
revoke execute on function public.bb_registra() from public, anon, authenticated;

-- 2) Troca os dias lidos de uma lancha. Só mexe do dia p_de em diante (o passado
-- fica como estava) e só nos dias de origem google/planilha: o que a equipe
-- marcou à mão ('manual') nunca é apagado pelo leitor. Entra e sai só a
-- diferença, para não reescrever a tabela a cada 15 minutos.
create or replace function public.bb_agenda_troca(p_lancha uuid, p_origem text, p_dias date[], p_de date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare saiu int; entrou int;
begin
  if p_origem not in ('google','planilha') then raise exception 'origem inválida: %', p_origem; end if;
  delete from public.bb_agenda_dono a
   where a.lancha_id = p_lancha and a.origem <> 'manual' and a.dia >= p_de
     and (a.origem <> p_origem or not (a.dia = any(coalesce(p_dias, '{}'))));
  get diagnostics saiu = row_count;
  insert into public.bb_agenda_dono (lancha_id, dia, origem)
  select p_lancha, d, p_origem from unnest(coalesce(p_dias, '{}')) as d where d >= p_de
  on conflict do nothing;
  get diagnostics entrou = row_count;
  update public.bb_lanchas set agenda_lida_at = now(), agenda_erro = null where id = p_lancha;
  return jsonb_build_object('entraram', entrou, 'sairam', saiu,
    'total', (select count(*) from public.bb_agenda_dono a where a.lancha_id = p_lancha and a.origem = p_origem and a.dia >= p_de));
end $$;

-- 3) Anota a falha (em português, o painel mostra). Os dias da última leitura boa ficam.
create or replace function public.bb_agenda_falha(p_lancha uuid, p_erro text)
returns void language sql security definer set search_path = '' as $$
  update public.bb_lanchas set agenda_erro = left(p_erro, 300) where id = p_lancha
$$;

-- Só o servidor (service_role) chama estas duas.
revoke execute on function public.bb_agenda_troca(uuid, text, date[], date), public.bb_agenda_falha(uuid, text) from public, anon, authenticated;

-- 4) Trocou o link ou passou para "ele avisa pelo WhatsApp": os dias lidos do link
-- antigo saem na hora (os marcados à mão ficam).
create or replace function public.bb_lancha_agenda_mudou()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.bb_agenda_dono where lancha_id = new.id and origem <> 'manual';
  return new;
end $$;
revoke execute on function public.bb_lancha_agenda_mudou() from public, anon, authenticated;
drop trigger if exists bb_lanchas_agenda_mudou on public.bb_lanchas;
create trigger bb_lanchas_agenda_mudou after update of agenda_tipo, agenda_url on public.bb_lanchas
  for each row when (old.agenda_url is distinct from new.agenda_url or old.agenda_tipo is distinct from new.agenda_tipo)
  execute function public.bb_lancha_agenda_mudou();

select 'ok' as leitor_de_agendas;
