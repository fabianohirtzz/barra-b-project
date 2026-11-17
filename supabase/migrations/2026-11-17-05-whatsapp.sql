-- ============================================================
-- Barra Boat Floripa: robô do WhatsApp (API oficial da Meta, coexistência).
-- Mesma estrutura da PO (motor, fluxo em cards com versões publicadas,
-- transmissão), com bb_ e ligada a bb_leads. Os comentários longos que
-- explicam cada cadeado estão nas migrations da PO; aqui fica o resumo.
-- Depende de 01 a 03. Idempotente.
--
-- O PHP escreve com a service_role. O painel lê; escreve só onde a dona
-- edita (textos, fluxos, cards, anúncios).
-- ============================================================

-- estado da conversa: uma linha por contato
create table if not exists public.bb_wa_conversas (
  id               uuid primary key default gen_random_uuid(),
  wa_id            text not null unique,
  estado           text not null default 'novo',
  lead_id          uuid references public.bb_leads(id) on delete set null,
  idioma           text not null default 'pt',
  fluxo_versao_id  uuid,
  card_atual       uuid,
  tentativas       int not null default 0,
  aguardando_desde timestamptz,
  lembrete_at      timestamptz,
  silenciado_at    timestamptz,       -- a equipe respondeu: o robô se cala
  updated_at       timestamptz not null default now()
);

-- log de mensagens. wamid único = idempotência do webhook (a Meta reenvia).
create table if not exists public.bb_wa_mensagens (
  id        uuid primary key default gen_random_uuid(),
  wa_id     text not null,
  wamid     text not null unique,
  direcao   text not null check (direcao in ('entrada','saida')),
  autor     text not null,           -- cliente | robo | equipe
  tipo      text not null default 'text',
  texto     text,
  payload   jsonb not null default '{}'::jsonb,
  ts        timestamptz not null default now()
);
create index if not exists bb_wa_mensagens_wa_ts on public.bb_wa_mensagens (wa_id, ts desc);

-- anúncio -> roteiro ou lancha (porta de entrada do clique em anúncio)
create table if not exists public.bb_wa_anuncios (
  ad_id       text primary key,
  roteiro_id  uuid references public.bb_roteiros(id) on delete set null,
  lancha_id   uuid references public.bb_lanchas(id) on delete set null,
  rotulo      text,
  created_at  timestamptz not null default now()
);

-- textos do robô, por idioma, editáveis no painel
create table if not exists public.bb_wa_textos (
  chave       text not null,
  idioma      text not null default 'pt' check (idioma in ('pt','en','es')),
  texto       text not null,
  updated_at  timestamptz not null default now(),
  primary key (chave, idioma)
);

-- fluxo em cards (editor visual da PO)
create table if not exists public.bb_wa_fluxos (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  gatilho        text not null check (gatilho in ('mensagem_nova','anuncio','palavra','chamado')),
  gatilho_valor  text,
  ativo          boolean not null default false,   -- publicar não liga o robô
  card_inicial   uuid,
  versao_atual   uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index if not exists bb_wa_fluxos_porta_ativa_uniq
  on public.bb_wa_fluxos (gatilho, coalesce(gatilho_valor, '')) where ativo;

create table if not exists public.bb_wa_cards (
  id              uuid primary key default gen_random_uuid(),
  fluxo_id        uuid not null references public.bb_wa_fluxos(id) on delete cascade,
  tipo            text not null,
  titulo          text not null,
  texto           text,
  opcoes          jsonb not null default '[]'::jsonb,   -- [{id, rotulo, destino, descricao?}] id obrigatório
  config          jsonb not null default '{}'::jsonb,
  proximo         uuid,
  fallback        uuid,
  sem_resposta    uuid,
  lembrete_ativo  boolean not null default true,
  lembrete_texto  text,
  ordem           int not null default 0,
  x               int not null default 0,
  y               int not null default 0
);

create table if not exists public.bb_wa_fluxo_versoes (
  id            uuid primary key default gen_random_uuid(),
  fluxo_id      uuid not null references public.bb_wa_fluxos(id) on delete cascade,
  versao        int not null,
  grafo         jsonb not null,      -- retrato imutável: a conversa em andamento aponta para cá
  publicado_at  timestamptz not null default now(),
  unique (fluxo_id, versao)
);

-- transmissão / campanha (item 27). Total e preço são FOTOGRAFIA da criação;
-- enviados/entregues/lidos são contados de bb_wa_envios na hora de mostrar.
create table if not exists public.bb_wa_campanhas (
  id                      uuid primary key default gen_random_uuid(),
  nome                    text not null,
  template                text not null,
  corpo                   text not null,
  segmento                jsonb not null default '{}'::jsonb,
  total                   int not null default 0,
  preco_centavos          int not null,
  custo_estimado_centavos int not null default 0,
  status                  text not null default 'rascunho'
                          check (status in ('rascunho','enviando','concluida','cancelada')),
  created_at              timestamptz not null default now(),
  concluida_at            timestamptz
);
create unique index if not exists bb_wa_campanhas_uma_ativa
  on public.bb_wa_campanhas ((true)) where status in ('rascunho','enviando');

create table if not exists public.bb_wa_envios (
  id            uuid primary key default gen_random_uuid(),
  campanha_id   uuid not null references public.bb_wa_campanhas(id) on delete cascade,
  lead_id       uuid not null references public.bb_leads(id) on delete cascade,
  wa_id         text not null,
  nome          text not null default '',
  wamid         text,
  status        text not null default 'reservado'
                check (status in ('reservado','enviando','enviado','entregue','lido','falha')),
  erro          text,
  reservado_at  timestamptz not null default now(),
  enviando_at   timestamptz,
  enviado_at    timestamptz,
  entregue_at   timestamptz,
  lido_at       timestamptz
);
create unique index if not exists bb_wa_envios_camp_lead_uniq on public.bb_wa_envios (campanha_id, lead_id);
create unique index if not exists bb_wa_envios_camp_waid_uniq on public.bb_wa_envios (campanha_id, wa_id);
create unique index if not exists bb_wa_envios_wamid_uniq on public.bb_wa_envios (wamid) where wamid is not null;
create index if not exists bb_wa_envios_status_idx on public.bb_wa_envios (campanha_id, status);

-- mensagens automáticas por passeio: lembrete na véspera (36), pedido de
-- avaliação no dia seguinte (37), aviso de clima (38), link da lista (49).
-- O unique garante uma de cada tipo por passeio, mesmo com o cron rodando duas vezes.
create table if not exists public.bb_wa_agendados (
  id          uuid primary key default gen_random_uuid(),
  passeio_id  uuid not null references public.bb_passeios(id) on delete cascade,
  tipo        text not null check (tipo in ('vespera','avaliacao','clima','lista')),
  enviar_em   timestamptz not null,
  status      text not null default 'pendente' check (status in ('pendente','enviando','enviado','falha','cancelado')),
  wamid       text,
  erro        text,
  enviado_at  timestamptz,
  unique (passeio_id, tipo)
);
create index if not exists bb_wa_agendados_fila_idx on public.bb_wa_agendados (enviar_em) where status = 'pendente';

-- ---------- RLS ----------
do $$
declare t text;
begin
  foreach t in array array['bb_wa_conversas','bb_wa_mensagens','bb_wa_anuncios','bb_wa_textos','bb_wa_fluxos',
                           'bb_wa_cards','bb_wa_fluxo_versoes','bb_wa_campanhas','bb_wa_envios','bb_wa_agendados']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
  -- o painel edita: textos, anúncios, fluxos e cards
  foreach t in array array['bb_wa_anuncios','bb_wa_textos','bb_wa_fluxos','bb_wa_cards','bb_wa_fluxo_versoes']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_equipe', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.bb_eh_equipe()) with check (public.bb_eh_equipe())', t || '_equipe', t);
  end loop;
  -- o painel só LÊ: quem escreve é o PHP. Painel que marcasse "enviado" na mão
  -- mentiria no relatório de entrega e no custo (lição da PO).
  foreach t in array array['bb_wa_conversas','bb_wa_mensagens','bb_wa_campanhas','bb_wa_envios','bb_wa_agendados']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_le', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.bb_eh_equipe())', t || '_le', t);
  end loop;
end $$;
