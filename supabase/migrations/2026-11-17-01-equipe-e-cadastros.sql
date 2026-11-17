-- ============================================================
-- Barra Boat Floripa: equipe, permissões, registro e cadastros.
-- Projeto COMPARTILHADO do HD360 (euzmbswywwhmicjlszqw). Tudo com prefixo bb_.
-- Rodar no Supabase -> SQL Editor, na ordem dos arquivos. Idempotente.
--
-- SEGURANÇA, diferente da PO de propósito:
-- O projeto é dividido com outros clientes (HD360, NOX, PO, Anita). Policy
-- "to authenticated using (true)" deixaria QUALQUER login desse projeto ler os
-- clientes e o dinheiro da Barra Boat. Aqui toda policy pergunta antes se o
-- usuário está na bb_equipe e com qual papel.
--
-- O site público NÃO lê o banco com a anon key: o PHP da ErêHost lê com a
-- service_role (só no servidor, em config.local.php) e entrega HTML pronto.
-- Por isso nenhuma tabela bb_ tem policy para anon.
-- ============================================================

-- ---------- equipe e papéis ----------
create table if not exists public.bb_equipe (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  nome          text not null,
  papel         text not null check (papel in ('dona','atendente','parceiro','marinheiro')),
  parceiro_id   uuid,              -- preenchido quando papel = parceiro
  marinheiro_id uuid,              -- preenchido quando papel = marinheiro
  ativo         boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Funções de checagem usadas pelas policies. security definer porque a própria
-- bb_equipe tem RLS; search_path vazio para ninguém sequestrar a função.
create or replace function public.bb_papel()
returns text language sql stable security definer set search_path = '' as $$
  select e.papel from public.bb_equipe e where e.user_id = auth.uid() and e.ativo
$$;
create or replace function public.bb_eh_equipe()        -- dona ou atendente
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.bb_papel() in ('dona','atendente'), false)
$$;
create or replace function public.bb_eh_dona()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.bb_papel() = 'dona', false)
$$;
create or replace function public.bb_meu_parceiro()
returns uuid language sql stable security definer set search_path = '' as $$
  select e.parceiro_id from public.bb_equipe e where e.user_id = auth.uid() and e.ativo and e.papel = 'parceiro'
$$;
create or replace function public.bb_meu_marinheiro()
returns uuid language sql stable security definer set search_path = '' as $$
  select e.marinheiro_id from public.bb_equipe e where e.user_id = auth.uid() and e.ativo and e.papel = 'marinheiro'
$$;
revoke execute on function public.bb_papel(), public.bb_eh_equipe(), public.bb_eh_dona(),
  public.bb_meu_parceiro(), public.bb_meu_marinheiro() from public, anon;
grant execute on function public.bb_papel(), public.bb_eh_equipe(), public.bb_eh_dona(),
  public.bb_meu_parceiro(), public.bb_meu_marinheiro() to authenticated;

-- updated_at automático
create or replace function public.bb_touch()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- registro de quem alterou o quê (item 43) ----------
create table if not exists public.bb_registro (
  id        bigint generated always as identity primary key,
  ts        timestamptz not null default now(),
  user_id   uuid,                 -- nulo = servidor (robô, cron)
  tabela    text not null,
  linha_id  text,
  acao      text not null,        -- INSERT | UPDATE | DELETE
  antes     jsonb,
  depois    jsonb
);
create index if not exists bb_registro_tabela_idx on public.bb_registro (tabela, linha_id, ts desc);

create or replace function public.bb_registra()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
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

-- ---------- parceiros e marinheiros ----------
create table if not exists public.bb_parceiros (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  telefone       text,                       -- E.164 (+55DDNNNNNNNNN)
  tipo           text not null default 'dono' check (tipo in ('dono','revendedor','ambos')),
  comissao_pct   numeric(5,2),               -- padrão para quem revende
  cor            text,                       -- cor no calendário
  ativo          boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.bb_marinheiros (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  telefone    text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- lanchas ----------
create table if not exists public.bb_lanchas (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,      -- URL /lanchas/<slug>/ (estável)
  legado_id       int,                       -- id do WordPress (ex.: 1564)
  nome            text not null,
  pes             numeric(4,1),
  passageiros     int not null check (passageiros > 0),
  regiao          text,
  descricao       text,
  itens           jsonb not null default '[]'::jsonb,   -- [texto] itens a bordo
  capa_url        text,                                  -- WebP 900 px na ErêHost
  fotos           jsonb not null default '[]'::jsonb,   -- [{url, url_p, alt}] na ErêHost
  parceiro_id     uuid references public.bb_parceiros(id) on delete set null,  -- nulo = própria
  cor             text,
  ativo           boolean not null default true,         -- aparece no site
  ordem           int not null default 0,
  -- agenda do dono (item 48)
  agenda_tipo     text check (agenda_tipo in ('google','planilha','manual')),
  agenda_url      text,          -- endereço secreto iCal ou CSV publicado. SÓ a equipe lê.
  agenda_lida_at  timestamptz,
  agenda_erro     text,          -- última falha de leitura, em português, para o painel mostrar
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists bb_lanchas_ordem_idx on public.bb_lanchas (ordem, nome);

-- vencimentos da lancha: seguro, documentação, revisão (item 40)
create table if not exists public.bb_vencimentos (
  id          uuid primary key default gen_random_uuid(),
  lancha_id   uuid not null references public.bb_lanchas(id) on delete cascade,
  tipo        text not null check (tipo in ('seguro','documentacao','revisao','outro')),
  descricao   text,
  vence_em    date not null,
  avisar_dias int not null default 30,
  created_at  timestamptz not null default now()
);

-- quais lanchas cada parceiro revendedor enxerga (item 23)
create table if not exists public.bb_parceiro_lanchas (
  parceiro_id uuid not null references public.bb_parceiros(id) on delete cascade,
  lancha_id   uuid not null references public.bb_lanchas(id) on delete cascade,
  primary key (parceiro_id, lancha_id)
);

-- ---------- roteiros ----------
create table if not exists public.bb_roteiros (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,     -- ilha-do-campeche, costa-da-lagoa
  nome             text not null,
  resumo           text,
  duracao_horas    numeric(4,1),
  distancia_milhas numeric(5,1),
  trajeto_texto    text,                     -- "30 a 40 min de navegação"
  paradas          jsonb not null default '[]'::jsonb,  -- [{nome, texto, foto, alt}]
  regras           jsonb not null default '[]'::jsonb,  -- [texto]
  fotos            jsonb not null default '[]'::jsonb,  -- [{url, alt}]
  palavras_chave   text not null default '',            -- o robô reconhece o roteiro por elas
  ativo            boolean not null default true,
  ordem            int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- prova social e textos do site ----------
create table if not exists public.bb_avaliacoes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,                 -- "Nome I." (LGPD)
  texto       text not null,
  nota        smallint not null default 5 check (nota between 1 and 5),
  data_label  text,
  ordem       int not null default 0,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Vídeos ficam na ErêHost, não no Storage: o projeto é compartilhado e o
-- tráfego de vídeo derrubaria a cota dos outros clientes (lição da PO).
create table if not exists public.bb_instagram (
  id          uuid primary key default gen_random_uuid(),
  url         text,                          -- link do post (opcional)
  video_url   text not null,
  poster_url  text,
  ordem       int not null default 0,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.bb_faq (
  id          uuid primary key default gen_random_uuid(),
  pergunta    text not null,
  resposta    text not null,
  ordem       int not null default 0,
  ativo       boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table if not exists public.bb_textos_site (   -- item 42
  chave       text primary key,              -- home_chamada, cadastur_cnpj ...
  texto       text not null,
  updated_at  timestamptz not null default now()
);

-- ---------- triggers ----------
do $$
declare t text;
begin
  foreach t in array array['bb_parceiros','bb_marinheiros','bb_lanchas','bb_roteiros','bb_faq','bb_textos_site']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.bb_touch()', t || '_touch', t);
  end loop;
  foreach t in array array['bb_equipe','bb_parceiros','bb_marinheiros','bb_lanchas','bb_roteiros','bb_parceiro_lanchas']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_reg', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.bb_registra()', t || '_reg', t);
  end loop;
end $$;

-- ---------- RLS ----------
do $$
declare t text;
begin
  foreach t in array array['bb_equipe','bb_registro','bb_parceiros','bb_marinheiros','bb_lanchas','bb_vencimentos',
                           'bb_parceiro_lanchas','bb_roteiros','bb_avaliacoes','bb_instagram','bb_faq','bb_textos_site']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
  -- cadastros: dona e atendente leem e escrevem
  foreach t in array array['bb_parceiros','bb_marinheiros','bb_lanchas','bb_vencimentos','bb_parceiro_lanchas',
                           'bb_roteiros','bb_avaliacoes','bb_instagram','bb_faq','bb_textos_site']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_equipe', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.bb_eh_equipe()) with check (public.bb_eh_equipe())', t || '_equipe', t);
  end loop;
end $$;

-- equipe: cada um lê a própria linha; só a dona cadastra e muda papéis
drop policy if exists bb_equipe_le on public.bb_equipe;
create policy bb_equipe_le on public.bb_equipe for select to authenticated
  using (user_id = auth.uid() or public.bb_eh_dona());
drop policy if exists bb_equipe_dona on public.bb_equipe;
create policy bb_equipe_dona on public.bb_equipe for all to authenticated
  using (public.bb_eh_dona()) with check (public.bb_eh_dona());

-- registro: só a dona lê; ninguém escreve pelo painel (só o trigger)
drop policy if exists bb_registro_dona on public.bb_registro;
create policy bb_registro_dona on public.bb_registro for select to authenticated
  using (public.bb_eh_dona());

-- Parceiro e marinheiro NÃO têm policy em bb_lanchas de propósito: uma policy de
-- select entrega a linha inteira, inclusive agenda_url (o endereço secreto da
-- agenda de outro dono), e no Supabase revogar coluna não adianta porque o grant
-- é da tabela (lição da PO). Eles leem só pelas funções das migrations 03 e 04
-- (bb_disponibilidade_parceiro, bb_meus_passeios, bb_minhas_comissoes), que devolvem colunas escolhidas.
