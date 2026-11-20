-- ============================================================
-- Barra Boat Floripa: DADOS FICTÍCIOS para apresentar o painel à Michele.
-- NÃO é carga de produção. Antes de lançar, rodar supabase/demo/apagar.sql.
--
-- Rodar no Supabase -> SQL Editor (projeto euzmbswywwhmicjlszqw), de uma vez.
-- Tudo que este arquivo cria tem id começando com de300000- (e os leads têm
-- origem_import = 'demo'), então o apagar.sql remove só isso.
--
-- O que entra:
--   3 parceiros (2 donos de lancha e 1 revendedora) e 3 marinheiros;
--   15 lanchas passam a ser dos 2 parceiros donos (Phantom30 BB e Phantom 36
--   ficam como próprias); a revendedora fica com acesso às 2 próprias;
--   passeios de jan/2025 até o fim de dez/2026, com sazonalidade de verão,
--   2026 cerca de 18% acima de 2025, pelo menos 2 passeios hoje e amanhã;
--   um cliente fechado para cada passeio, com pagamentos (sinal e restante);
--   clientes que não fecharam (com motivo) e o funil aberto de agora;
--   despesas mês a mês (vaga, seguro, anúncios, combustível, marinheiro,
--   gelo, manutenção), comissões da revendedora e metas de 2026;
--   uma manutenção marcada na agenda.
-- Valores são inventados, só para os gráficos terem forma.
-- ============================================================

begin;

create or replace function pg_temp.did(n bigint) returns uuid language sql immutable as
$$ select ('de300000-0000-4000-8000-' || lpad(to_hex(n), 12, '0'))::uuid $$;

do $$
declare
  hoje    date := (now() at time zone 'America/Sao_Paulo')::date;
  proprias text[] := array['phantom30bb', '1564'];
  p1 uuid := pg_temp.did(1);   -- dono
  p2 uuid := pg_temp.did(2);   -- dono e revende
  p3 uuid := pg_temp.did(3);   -- revendedora
  mar uuid[] := array[pg_temp.did(4), pg_temp.did(5), pg_temp.did(6)];
  rot_c uuid; rot_l uuid;
  -- passeios esperados por dia, mês a mês (verão cheio, inverno quase parado)
  taxa numeric[] := array[1.30, 1.10, 0.60, 0.25, 0.12, 0.08, 0.12, 0.15, 0.22, 0.35, 0.55, 1.00];
  pt_n text[] := array['Ana','Bruno','Camila','Daniel','Eduarda','Felipe','Gabriela','Henrique','Isabela','João',
                       'Larissa','Lucas','Mariana','Matheus','Natália','Pedro','Rafaela','Rodrigo','Tatiane','Vinícius',
                       'Juliana','Gustavo','Patrícia','Thiago','Carolina','André','Letícia','Marcelo','Fernanda','Ricardo'];
  pt_s text[] := array['Silva','Santos','Oliveira','Souza','Pereira','Costa','Rodrigues','Almeida','Nascimento','Lima',
                       'Araújo','Fernandes','Carvalho','Gomes','Martins','Rocha','Ribeiro','Alves','Monteiro','Mendes',
                       'Barros','Freitas','Schmidt','Becker','Zanella'];
  es_n text[] := array['Martín','Sofía','Facundo','Valentina','Santiago','Camila','Joaquín','Lucía','Tomás','Agustina','Nicolás','Florencia'];
  es_s text[] := array['González','Fernández','López','Martínez','Pérez','Gómez','Romero','Sosa','Benítez','Acosta'];
  ddds text[] := array['48','48','48','48','11','51','41','47','21','19'];
  motivos text[] := array['Achou caro','Fechou com outra empresa','Mudou a data','Grupo maior que a lancha','Parou de responder'];
  notas_txt text[] := array['Aniversário de 40 anos, vão levar bolo.','Pediu churrasco a bordo.',
                            'Grupo com 2 crianças, separar coletes infantis.','Quer ficar mais tempo na Ilha do Campeche.',
                            'Já fez o passeio no ano passado e voltou.','Vão levar as próprias bebidas.',
                            'Pedido de casamento a bordo, combinar discrição com o marinheiro.'];
  manut text[] := array['Troca de óleo e filtros','Limpeza do casco','Reparo no estofado','Bateria nova','Revisão da bomba de porão','Troca do rotor da bomba d''água'];
  k bigint := 100;
  d date; m date; n int; i int; esperado numeric; np int;
  l record; lid uuid; pid uuid; rid uuid;
  es boolean; nome text; fone text; pessoas int; valor numeric; orc numeric; custos numeric; sinal numeric;
  criado timestamptz; orc_at timestamptz; fech_at timestamptz; perd_at timestamptz;
  orig text; parc uuid; r numeric; msg text; notas jsonb; etp text; dd date; own uuid;
begin
  if exists (select 1 from public.bb_leads where origem_import = 'demo')
     or exists (select 1 from public.bb_parceiros where id = p1) then
    raise exception 'Os dados de exemplo já estão no banco. Rode supabase/demo/apagar.sql antes de carregar de novo.';
  end if;

  perform setseed(0.2026);
  select id into rot_c from public.bb_roteiros where slug = 'ilha-do-campeche';
  select id into rot_l from public.bb_roteiros where slug = 'costa-da-lagoa';

  -- ---------- parceiros, marinheiros, lanchas ----------
  insert into public.bb_parceiros (id, nome, telefone, tipo, comissao_pct) values
    (p1, 'Rogério Vieira',  '+5548900000101', 'dono',       null),
    (p2, 'Marcos Teixeira', '+5548900000102', 'ambos',      10),
    (p3, 'Juliana Prates',  '+5548900000103', 'revendedor', 10);
  insert into public.bb_marinheiros (id, nome, telefone) values
    (mar[1], 'Anderson Lima',        '+5548900000201'),
    (mar[2], 'Caio Ramos',           '+5548900000202'),
    (mar[3], 'Paulo Henrique Silva', '+5548900000203');

  update public.bb_lanchas set parceiro_id = p1
   where slug in ('phantom-36c','phantom-30','3373','phantom29g','hd26-lulu','phantom-24-horus','phantom-23-5-maninha','fs230-pes');
  update public.bb_lanchas set parceiro_id = p2
   where slug in ('3363','phantom-29-my-girl','phantom-29','hd-26-pes-lanai','hd-26-caluga','focker24d','phantom-23-5');
  insert into public.bb_parceiro_lanchas (parceiro_id, lancha_id)
    select p3, id from public.bb_lanchas where slug = any(proprias);

  -- manutenção daqui a 5 dias numa lancha de parceiro (aparece na Agenda)
  insert into public.bb_bloqueios (id, tipo, lancha_id, inicio, fim, motivo)
    select pg_temp.did(7), 'manutencao', id, hoje + 5, hoje + 6, 'Manutenção' from public.bb_lanchas where slug = 'phantom-36c';

  -- ---------- passeios, clientes fechados, pagamentos ----------
  for d in select g::date from generate_series('2025-01-01'::date, '2026-12-31'::date, interval '1 day') g loop
    esperado := taxa[extract(month from d)::int] * case when extract(year from d) = 2026 then 1.18 else 1 end;
    esperado := esperado * case when extract(dow from d) in (0, 6) then 1.35 else 0.85 end;
    if d > hoje then esperado := esperado * greatest(0.15, 0.85 - (d - hoje) * 0.012); end if;
    n := floor(esperado)::int + case when random() < esperado - floor(esperado) then 1 else 0 end;
    if d in (hoje, hoje + 1) then n := greatest(n, 2); end if;

    for i in 1..n loop
      select x.id, x.slug, x.pes, x.passageiros, x.parceiro_id into l
        from public.bb_lanchas x
       where x.ativo
         and not exists (select 1 from public.bb_passeios p where p.lancha_id = x.id and p.dia = d and p.status <> 'cancelado')
         and not exists (select 1 from public.bb_bloqueios b where d between b.inicio and b.fim and (b.lancha_id is null or b.lancha_id = x.id))
       order by random() * case when x.slug = any(proprias) then 0.45 else 1 end
       limit 1;
      exit when not found;

      es := random() < 0.22;
      if es then
        nome := es_n[1 + floor(random() * cardinality(es_n))::int] || ' ' || es_s[1 + floor(random() * cardinality(es_s))::int];
        fone := '+54911' || lpad(k::text, 8, '0');
      else
        nome := pt_n[1 + floor(random() * cardinality(pt_n))::int] || ' ' || pt_s[1 + floor(random() * cardinality(pt_s))::int];
        fone := '+55' || ddds[1 + floor(random() * cardinality(ddds))::int] || '9' || lpad(k::text, 8, '0');
      end if;
      pessoas := least(l.passageiros, 2 + floor(random() * (l.passageiros - 1))::int);
      rid := case when random() < 0.75 then rot_c else rot_l end;
      valor := round((l.pes * 150 - 900)
                     * case when rid = rot_l then 0.8 else 1 end
                     * case when extract(year from d) = 2025 then 0.92 else 1 end
                     * (0.95 + random() * 0.1) / 50) * 50;
      orc := valor + case when random() < 0.4 then round(random() * 6) * 50 else 0 end;
      msg := case when es
        then format('Hola! Quería consultar por el paseo a %s para %s personas.', case when rid = rot_c then 'Campeche' else 'Costa da Lagoa' end, pessoas)
        else format('Oi! Queria saber valores do passeio %s, somos %s pessoas.', case when rid = rot_c then 'para a Ilha do Campeche' else 'pela Costa da Lagoa' end, pessoas) end;

      criado := ((d - (3 + floor(random() * 40))::int)::timestamp + interval '8 hours' + random() * interval '13 hours') at time zone 'America/Sao_Paulo';
      if criado > now() - interval '3 hours' then criado := now() - interval '3 hours' - random() * interval '20 days'; end if;
      orc_at  := criado + random() * interval '20 hours';
      fech_at := orc_at + random() * interval '3 days';
      if fech_at > now() then fech_at := now() - random() * interval '2 hours'; end if;
      if orc_at > fech_at then orc_at := fech_at - interval '40 minutes'; end if;
      if criado > orc_at then criado := orc_at - interval '2 hours'; end if;

      r := random();
      orig := case when r < 0.34 then 'google_ads' when r < 0.58 then 'instagram' when r < 0.72 then 'google'
                   when r < 0.84 then 'indicacao' when r < 0.92 then 'parceiro' when r < 0.96 then 'tiktok' else 'direto' end;
      parc := case when orig = 'parceiro' then (array[p3, p2])[1 + floor(random() * 2)::int] end;
      -- custo do passeio: em lancha de parceiro é o repasse ao dono; nas próprias o custo vira despesa (combustível e marinheiro)
      custos := case when l.parceiro_id is not null and d <= hoje then round(valor * (0.68 + random() * 0.05) / 10) * 10 end;
      notas := case when random() < 0.15
        then jsonb_build_array(jsonb_build_object('ts', fech_at, 'txt', notas_txt[1 + floor(random() * cardinality(notas_txt))::int], 'autor', 'Michele'))
        else '[]'::jsonb end;

      k := k + 1; lid := pg_temp.did(k);
      insert into public.bb_leads (id, created_at, nome, wa_id, idioma, mensagem, data_desejada, pessoas, roteiro_id, lancha_id,
                                   etapa, valor_orcado, valor_fechado, custos_passeio, orcamento_at, fechado_at, notas,
                                   origem, parceiro_id, cliente, revisado, origem_import)
      values (lid, criado, nome, fone, case when es then 'es' else 'pt' end, msg, d, pessoas, rid, l.id,
              'fechados', orc, valor, custos, orc_at, fech_at, notas, orig, parc, true, true, 'demo');

      k := k + 1; pid := pg_temp.did(k);
      insert into public.bb_passeios (id, lancha_id, dia, hora_saida, roteiro_id, lead_id, marinheiro_id, pessoas, status)
      values (pid, l.id, d,
              case when rid = rot_c then time '08:30' else time '10:00' end + floor(random() * 2) * interval '30 minutes',
              rid, lid, case when i <= 3 then mar[i] end, pessoas,
              case when d < hoje then 'realizado' else 'marcado' end);

      sinal := round(valor * 0.3 / 50) * 50;
      k := k + 1;
      insert into public.bb_recebimentos (id, lead_id, tipo, forma, valor, recebido_em)
      values (pg_temp.did(k), lid, 'sinal', case when random() < 0.85 then 'pix' else 'transferencia' end, sinal,
              (fech_at at time zone 'America/Sao_Paulo')::date);
      -- o restante entra no dia do passeio; alguns passeios recentes ficam "faltando receber"
      if d < hoje and not (d > hoje - 12 and random() < 0.3) then
        k := k + 1;
        insert into public.bb_recebimentos (id, lead_id, tipo, forma, valor, recebido_em)
        values (pg_temp.did(k), lid, 'restante',
                (array['pix','pix','pix','dinheiro','cartao'])[1 + floor(random() * 5)::int], valor - sinal, d);
      end if;

      if parc is not null then
        k := k + 1;
        insert into public.bb_comissoes (id, lead_id, parceiro_id, pct, valor, status, pago_em)
        values (pg_temp.did(k), lid, parc, 10, round(valor * 0.10),
                case when d < hoje - 10 then 'pago' else 'a_pagar' end, case when d < hoje - 10 then d + 7 end);
      end if;

      -- lancha própria: combustível e marinheiro anotados como despesa do passeio
      if l.parceiro_id is null and d <= hoje then
        k := k + 1;
        insert into public.bb_despesas (id, dia, categoria, valor, lancha_id, passeio_id, obs)
        values (pg_temp.did(k), d, 'Combustível', round(l.pes * 22 * (0.9 + random() * 0.2)), l.id, pid, 'Abastecimento do passeio');
        k := k + 1;
        insert into public.bb_despesas (id, dia, categoria, valor, lancha_id, passeio_id, obs)
        values (pg_temp.did(k), d, 'Marinheiro', 280, l.id, pid, 'Diária');
      end if;

      -- quem pediu orçamento para a mesma época e não fechou
      if random() < 0.42 then
        es := random() < 0.22;
        if es then
          nome := es_n[1 + floor(random() * cardinality(es_n))::int] || ' ' || es_s[1 + floor(random() * cardinality(es_s))::int];
          fone := '+54911' || lpad((k + 500000)::text, 8, '0');
        else
          nome := pt_n[1 + floor(random() * cardinality(pt_n))::int] || ' ' || pt_s[1 + floor(random() * cardinality(pt_s))::int];
          fone := '+55' || ddds[1 + floor(random() * cardinality(ddds))::int] || '9' || lpad((k + 500000)::text, 8, '0');
        end if;
        criado := least(criado + random() * interval '5 days', now() - interval '1 day');
        orc_at := case when random() < 0.75 then criado + random() * interval '1 day' end;
        perd_at := least(coalesce(orc_at, criado) + interval '1 day' + random() * interval '5 days', now() - interval '1 hour');
        k := k + 1;
        insert into public.bb_leads (id, created_at, nome, wa_id, idioma, mensagem, data_desejada, pessoas, roteiro_id, lancha_id,
                                     etapa, motivo_perda, valor_orcado, orcamento_at, perdido_at, origem, revisado, origem_import)
        values (pg_temp.did(k), criado, nome, fone, case when es then 'es' else 'pt' end, msg, d, pessoas, rid,
                case when random() < 0.5 then l.id end, 'perdidos',
                motivos[1 + floor(random() * cardinality(motivos))::int],
                case when orc_at is not null then orc else 0 end, orc_at, perd_at,
                case when random() < 0.45 then 'google_ads' when random() < 0.5 then 'instagram' else 'google' end, true, 'demo');
      end if;
    end loop;
  end loop;

  -- ---------- funil aberto agora: novos, conversando, orçamento enviado ----------
  for i in 1..18 loop
    etp := case when i <= 5 then 'novos' when i <= 12 then 'conversando' else 'orcamento' end;
    es := random() < 0.22;
    if es then
      nome := es_n[1 + floor(random() * cardinality(es_n))::int] || ' ' || es_s[1 + floor(random() * cardinality(es_s))::int];
      fone := '+54911' || lpad((900000 + i)::text, 8, '0');
    else
      nome := pt_n[1 + floor(random() * cardinality(pt_n))::int] || ' ' || pt_s[1 + floor(random() * cardinality(pt_s))::int];
      fone := '+55' || ddds[1 + floor(random() * cardinality(ddds))::int] || '9' || lpad((900000 + i)::text, 8, '0');
    end if;
    rid := case when random() < 0.75 then rot_c else rot_l end;
    pessoas := 2 + floor(random() * 9)::int;
    dd := case when random() < 0.8 then hoje + 10 + floor(random() * 70)::int end;
    criado := now() - case etp when 'novos' then random() * interval '36 hours'
                                 when 'conversando' then interval '1 day' + random() * interval '5 days'
                                 else interval '2 days' + random() * interval '7 days' end;
    orc_at := case when etp = 'orcamento' then criado + random() * interval '1 day' end;
    valor := round((2600 + random() * 2400) / 50) * 50;
    r := random();
    orig := case when r < 0.4 then 'google_ads' when r < 0.65 then 'instagram' when r < 0.8 then 'google' when r < 0.92 then 'indicacao' else 'tiktok' end;
    k := k + 1;
    insert into public.bb_leads (id, created_at, nome, wa_id, idioma, mensagem, data_desejada, data_texto, pessoas, roteiro_id,
                                 etapa, valor_orcado, orcamento_at, origem, revisado, origem_import, notas)
    values (pg_temp.did(k), criado, nome, fone, case when es then 'es' else 'pt' end,
            case when es then format('Hola! Somos %s personas, ¿tienen lancha disponible?', pessoas)
                 else format('Boa tarde! Somos %s pessoas, vocês têm lancha disponível?', pessoas) end,
            dd, case when dd is null then 'a definir' end, pessoas, rid,
            etp, case when etp = 'orcamento' then valor else 0 end, orc_at, orig, etp <> 'novos', 'demo',
            case when etp = 'conversando' and random() < 0.5
              then jsonb_build_array(jsonb_build_object('ts', criado + interval '3 hours', 'txt', 'Ainda vai confirmar a data com o grupo.', 'autor', 'Michele'))
              else '[]'::jsonb end);
  end loop;

  -- ---------- despesas fixas e do mês ----------
  for m in select g::date from generate_series('2025-01-01'::date, date_trunc('month', hoje)::date, interval '1 month') g loop
    select count(*) into np from public.bb_passeios
     where id::text like 'de300000-%' and dia >= m and dia < (m + interval '1 month') and dia <= hoje;
    for own in select id from public.bb_lanchas where slug = any(proprias) loop
      if m + 4 <= hoje then
        k := k + 1;
        insert into public.bb_despesas (id, dia, categoria, valor, lancha_id, obs)
        values (pg_temp.did(k), m + 4, 'Marina e vaga', case when extract(year from m) = 2025 then 1250 else 1350 end, own, 'Mensalidade da vaga');
      end if;
      if m + 9 <= hoje then
        k := k + 1;
        insert into public.bb_despesas (id, dia, categoria, valor, lancha_id, obs)
        values (pg_temp.did(k), m + 9, 'Seguro', 390, own, 'Parcela do seguro');
      end if;
    end loop;
    k := k + 1;
    insert into public.bb_despesas (id, dia, categoria, valor, obs)
    values (pg_temp.did(k), m, 'Anúncios', round((450 + 1900 * least(taxa[extract(month from m)::int], 1.3) / 1.3) / 10) * 10, 'Google Ads');
    if np > 0 and m + 14 <= hoje then
      k := k + 1;
      insert into public.bb_despesas (id, dia, categoria, valor, obs)
      values (pg_temp.did(k), m + 14, 'Gelo, carvão e frutas', round(np * 65 * (0.9 + random() * 0.2)), 'Compras do mês');
    end if;
    if m + 19 <= hoje then
      k := k + 1;
      insert into public.bb_despesas (id, dia, categoria, valor, lancha_id, obs)
      select pg_temp.did(k), m + 19, 'Manutenção', round((250 + random() * 1500) / 10) * 10, id,
             manut[1 + floor(random() * cardinality(manut))::int]
        from public.bb_lanchas where slug = any(proprias) order by random() limit 1;
    end if;
    if extract(month from m) = 9 then   -- revisão antes da temporada
      k := k + 1;
      insert into public.bb_despesas (id, dia, categoria, valor, lancha_id, obs)
      select pg_temp.did(k), m + 11, 'Manutenção', 4800, id, 'Pintura de fundo e revisão dos motores'
        from public.bb_lanchas where slug = 'phantom30bb';
    end if;
    if extract(month from m) = 3 then
      k := k + 1;
      insert into public.bb_despesas (id, dia, categoria, valor, obs)
      values (pg_temp.did(k), m + 15, 'Documentação', 420, 'Renovação de documentos na Capitania');
    end if;
    if random() < 0.5 and m + 22 <= hoje then
      k := k + 1;
      insert into public.bb_despesas (id, dia, categoria, valor, obs)
      values (pg_temp.did(k), m + 22, 'Outros', round((120 + random() * 400) / 10) * 10, 'Material de limpeza');
    end if;
  end loop;

  -- ---------- metas de 2026 (perto do que foi vendido; a do mês atual um pouco acima) ----------
  insert into public.bb_metas (mes, valor, demo)   -- demo: migração 2026-11-20-07
  select mes,
         case when mes = date_trunc('month', hoje)::date then ceil(fat * 1.12 / 5000) * 5000
              when mes > date_trunc('month', hoje)::date then ceil(fat * 1.6 / 5000) * 5000
              else greatest(5000, round(fat * (0.9 + random() * 0.25) / 5000) * 5000) end,
         true
    from (select date_trunc('month', p.dia)::date mes, sum(ld.valor_fechado) fat
            from public.bb_passeios p join public.bb_leads ld on ld.id = p.lead_id
           where p.id::text like 'de300000-%' and p.dia >= '2026-01-01'
           group by 1) x
  on conflict (mes) do nothing;
end $$;

commit;

-- conferência
select 'parceiros' o, count(*) from public.bb_parceiros where id::text like 'de300000-%'
union all select 'marinheiros', count(*) from public.bb_marinheiros where id::text like 'de300000-%'
union all select 'clientes', count(*) from public.bb_leads where origem_import = 'demo'
union all select 'passeios', count(*) from public.bb_passeios where id::text like 'de300000-%'
union all select 'pagamentos', count(*) from public.bb_recebimentos where id::text like 'de300000-%'
union all select 'despesas', count(*) from public.bb_despesas where id::text like 'de300000-%'
union all select 'comissoes', count(*) from public.bb_comissoes where id::text like 'de300000-%'
union all select 'metas', count(*) from public.bb_metas;
