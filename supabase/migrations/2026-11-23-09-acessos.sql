-- ============================================================
-- Barra Boat Floripa: acessos de parceiro e marinheiro (reunião de 19/11).
-- Parceiro e marinheiro continuam SEM policy nas tabelas: leem e gravam só
-- pelas funções abaixo, que devolvem colunas escolhidas (nada de valores,
-- telefone de cliente ou endereço secreto de agenda de outro dono).
-- Rodar no SQL Editor. Idempotente.
-- ============================================================

-- 1) Lista da equipe com e-mail e último acesso. Só a dona vê.
-- criado_aqui: login criado pelo painel da Barra Boat (só nesses a dona pode gerar
-- senha nova; o projeto é compartilhado e o mesmo e-mail pode ter login de outro sistema).
create or replace function public.bb_equipe_lista()
returns table (user_id uuid, nome text, papel text, parceiro_id uuid, marinheiro_id uuid, ativo boolean,
               email text, ultimo_acesso timestamptz, criado_aqui boolean)
language sql stable security definer set search_path = '' as $$
  select e.user_id, e.nome, e.papel, e.parceiro_id, e.marinheiro_id, e.ativo, u.email::text, u.last_sign_in_at,
         coalesce((u.raw_app_meta_data ->> 'bb_criado')::boolean, false)
    from public.bb_equipe e join auth.users u on u.id = e.user_id
   where public.bb_eh_dona()
   order by case e.papel when 'dona' then 0 when 'atendente' then 1 when 'parceiro' then 2 else 3 end, e.nome
$$;
revoke execute on function public.bb_equipe_lista() from public, anon;
grant execute on function public.bb_equipe_lista() to authenticated;

-- 2) Login pelo e-mail. Só o servidor (api/equipe.php, service_role) chama.
create or replace function public.bb_usuario_por_email(p_email text)
returns table (id uuid, criado_aqui boolean)
language sql stable security definer set search_path = '' as $$
  select u.id, coalesce((u.raw_app_meta_data ->> 'bb_criado')::boolean, false)
    from auth.users u where lower(u.email) = lower(trim(p_email)) limit 1
$$;
revoke execute on function public.bb_usuario_por_email(text) from public, anon, authenticated;

-- 3) Agenda do parceiro logado: as lanchas dele (dono) e as que ele pode vender.
-- Lancha própria: passeio com hora, roteiro e quantas pessoas (sem cliente nem valor).
-- Lancha só de revenda: só o dia ocupado. Uma linha com dia nulo por lancha, para a
-- tela listar até a lancha que não tem nenhum dia ocupado.
create or replace function public.bb_agenda_parceiro(de date default current_date - 7, ate date default current_date + 120)
returns table (lancha_id uuid, lancha text, passageiros int, propria boolean, dia date, motivo text,
               hora_saida time, roteiro text, pessoas int)
language sql stable security definer set search_path = '' as $$
  with eu as (select public.bb_meu_parceiro() as id),
  minhas as (
    select l.id, l.nome, l.passageiros, (l.parceiro_id = eu.id) as propria
      from public.bb_lanchas l, eu
     where eu.id is not null and l.ativo
       and (l.parceiro_id = eu.id
            or exists (select 1 from public.bb_parceiro_lanchas pl where pl.lancha_id = l.id and pl.parceiro_id = eu.id))
  )
  select m.id, m.nome, m.passageiros, m.propria, null::date, null::text, null::time, null::text, null::int from minhas m
  union all
  select m.id, m.nome, m.passageiros, m.propria, p.dia, 'passeio',
         case when m.propria then p.hora_saida end, case when m.propria then r.nome end, case when m.propria then p.pessoas end
    from minhas m
    join public.bb_passeios p on p.lancha_id = m.id and p.status <> 'cancelado' and p.dia between de and ate
    left join public.bb_roteiros r on r.id = p.roteiro_id
  union all
  select m.id, m.nome, m.passageiros, m.propria, a.dia, case when a.origem = 'manual' then 'dono' else 'agenda' end, null, null, null
    from minhas m join public.bb_agenda_dono a on a.lancha_id = m.id and a.dia between de and ate
  union all
  select m.id, m.nome, m.passageiros, m.propria, g.d::date, 'fechado', null, null, null
    from minhas m
    join public.bb_bloqueios b on (b.lancha_id is null or b.lancha_id = m.id) and b.fim >= de and b.inicio <= ate
    cross join lateral generate_series(greatest(b.inicio, de)::timestamp, least(b.fim, ate)::timestamp, interval '1 day') as g(d)
$$;
revoke execute on function public.bb_agenda_parceiro(date, date) from public, anon;
grant execute on function public.bb_agenda_parceiro(date, date) to authenticated;

-- 4) O dono marca ou libera um dia da PRÓPRIA lancha (sem precisar do Google Agenda).
-- Grava como 'manual', igual ao que a equipe marca: o leitor de agendas nunca apaga.
create or replace function public.bb_parceiro_marca_dia(p_lancha uuid, p_dia date, p_ocupado boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare eu uuid := public.bb_meu_parceiro();
begin
  if eu is null or not exists (select 1 from public.bb_lanchas l where l.id = p_lancha and l.parceiro_id = eu) then
    raise exception 'Esta lancha não está no seu nome. Fale com a equipe da Barra Boat.' using errcode = 'P0001';
  end if;
  if p_dia < current_date then
    raise exception 'Esse dia já passou.' using errcode = 'P0001';
  end if;
  if p_ocupado then
    if exists (select 1 from public.bb_passeios p where p.lancha_id = p_lancha and p.dia = p_dia and p.status <> 'cancelado') then
      raise exception 'A Barra Boat já tem passeio nesse dia. Fale com a equipe antes de marcar.' using errcode = 'P0001';
    end if;
    insert into public.bb_agenda_dono (lancha_id, dia, origem) values (p_lancha, p_dia, 'manual') on conflict do nothing;
  else
    delete from public.bb_agenda_dono where lancha_id = p_lancha and dia = p_dia and origem = 'manual';
  end if;
end $$;
revoke execute on function public.bb_parceiro_marca_dia(uuid, date, boolean) from public, anon;
grant execute on function public.bb_parceiro_marca_dia(uuid, date, boolean) to authenticated;

-- 5) Marinheiro: a escala passa a incluir ontem (passeio que voltou tarde ainda aparece).
create or replace function public.bb_meus_passeios(de date default current_date - 1, ate date default current_date + 60)
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

select 'ok' as acessos;
