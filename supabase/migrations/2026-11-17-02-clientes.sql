-- ============================================================
-- Barra Boat Floripa: clientes (funil), recebimentos e cliques no WhatsApp.
-- Depende de 01. Idempotente.
--
-- Uma linha de bb_leads = um PEDIDO de passeio (quem pediu, quando, quantas
-- pessoas, quanto). A aba Clientes junta os pedidos da mesma pessoa pelo wa_id.
-- Telefone SEMPRE em E.164 (+55DDNNNNNNNNN), normalizado antes de gravar: sem
-- isso a mesma pessoa vira dois contatos e a conversa se perde (lição da PO).
-- ============================================================

create table if not exists public.bb_leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- quem
  nome            text,
  wa_id           text,                       -- E.164
  email           text,
  idioma          text not null default 'pt', -- pt | en | es
  mensagem        text,                       -- primeira mensagem recebida
  -- o pedido
  data_desejada   date,
  data_texto      text,                       -- "a definir", "fim de semana de dezembro"
  pessoas         int check (pessoas is null or pessoas > 0),
  roteiro_id      uuid references public.bb_roteiros(id) on delete set null,
  lancha_id       uuid references public.bb_lanchas(id) on delete set null,
  -- funil (5 etapas do painel)
  etapa           text not null default 'novos'
                  check (etapa in ('novos','conversando','orcamento','fechados','perdidos')),
  motivo_perda    text,
  valor_orcado    numeric(12,2) not null default 0,
  valor_fechado   numeric(12,2) not null default 0,
  custos_passeio  numeric(12,2),              -- nulo = usar o percentual padrão no relatório
  orcamento_at    timestamptz,
  fechado_at      timestamptz,                -- ciclo de venda = fechado_at - created_at
  perdido_at      timestamptz,
  notas           jsonb not null default '[]'::jsonb,   -- [{ts, txt, autor}]
  -- origem (rastreamento)
  origem          text,                       -- google_ads | google | instagram | tiktok | indicacao | parceiro | direto
  origem_manual   text,
  parceiro_id     uuid references public.bb_parceiros(id) on delete set null,  -- parceiro que indicou/vendeu
  utm_source      text, utm_medium text, utm_campaign text, utm_term text, utm_content text,
  gclid           text,
  ctwa_clid       text,                       -- clique em anúncio que abre conversa (Meta)
  ad_id           text,
  referrer        text,
  landing_page    text,
  -- base de contatos (importação, revisão, campanha)
  cliente         boolean not null default false,
  revisado        boolean not null default false,
  opt_out_at      timestamptz,                -- respondeu SAIR: fora de toda campanha
  origem_import   text,
  payload_import  jsonb
);
create index if not exists bb_leads_created_idx on public.bb_leads (created_at desc);
create index if not exists bb_leads_etapa_idx   on public.bb_leads (etapa, updated_at desc);
create index if not exists bb_leads_wa_idx      on public.bb_leads (wa_id);
create index if not exists bb_leads_data_idx    on public.bb_leads (data_desejada) where data_desejada is not null;

-- Carimbos de etapa preenchidos pelo banco, não pela tela: o relatório de ciclo
-- e de conversão depende deles e uma aba antiga do painel não pode esquecer.
create or replace function public.bb_leads_etapa()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.etapa is distinct from old.etapa then
    if new.etapa = 'orcamento' and new.orcamento_at is null then new.orcamento_at = now(); end if;
    if new.etapa = 'fechados'  and new.fechado_at  is null then new.fechado_at  = now(); end if;
    if new.etapa = 'perdidos'  and new.perdido_at  is null then new.perdido_at  = now(); end if;
  end if;
  return new;
end $$;
drop trigger if exists bb_leads_etapa on public.bb_leads;
create trigger bb_leads_etapa before insert or update on public.bb_leads
  for each row execute function public.bb_leads_etapa();

-- Recebimentos: sinal, restante. "Falta receber" = valor_fechado - soma daqui.
-- Sem coluna de saldo de propósito: total copiado desanda no primeiro ajuste
-- (foi o que inflou o faturamento no painel da PO).
create table if not exists public.bb_recebimentos (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.bb_leads(id) on delete cascade,
  tipo         text not null default 'sinal' check (tipo in ('sinal','restante','outro')),
  forma        text check (forma in ('pix','dinheiro','cartao','transferencia')),
  valor        numeric(12,2) not null check (valor > 0),
  recebido_em  date not null default current_date,
  obs          text,
  created_at   timestamptz not null default now()
);
create index if not exists bb_recebimentos_lead_idx on public.bb_recebimentos (lead_id);

-- Cliques no botão do WhatsApp do site, gravados pelo PHP com a origem.
-- Quando a conversa chega, o motor casa pelo código na mensagem e copia a
-- origem para o lead.
create table if not exists public.bb_cliques_wa (
  id            uuid primary key default gen_random_uuid(),
  ts            timestamptz not null default now(),
  codigo        text not null unique,          -- vai escondido na mensagem pronta
  pagina        text,
  idioma        text,
  origem        text,
  utm_source    text, utm_medium text, utm_campaign text, utm_term text, utm_content text,
  gclid         text,
  referrer      text,
  lead_id       uuid references public.bb_leads(id) on delete set null
);
create index if not exists bb_cliques_wa_ts_idx on public.bb_cliques_wa (ts desc);

-- importação de contatos da agenda (mesma guarda de idempotência da PO)
create table if not exists public.bb_import_lotes (
  id           uuid primary key default gen_random_uuid(),
  hash         text not null unique,           -- o unique é o cadeado contra clique duplo
  origem       text not null,
  arquivo      text,
  total        int not null default 0,
  novos        int not null default 0,
  preenchidos  int not null default 0,
  concluido_at timestamptz,                    -- nulo = em andamento ou interrompido
  created_at   timestamptz not null default now()
);

drop trigger if exists bb_leads_touch on public.bb_leads;
create trigger bb_leads_touch before update on public.bb_leads
  for each row execute function public.bb_touch();
drop trigger if exists bb_leads_reg on public.bb_leads;
create trigger bb_leads_reg after insert or update or delete on public.bb_leads
  for each row execute function public.bb_registra();
drop trigger if exists bb_recebimentos_reg on public.bb_recebimentos;
create trigger bb_recebimentos_reg after insert or update or delete on public.bb_recebimentos
  for each row execute function public.bb_registra();

-- RLS: dona e atendente. bb_cliques_wa e bb_import_lotes o painel só lê;
-- quem escreve é o PHP com a service_role.
alter table public.bb_leads        enable row level security;
alter table public.bb_recebimentos enable row level security;
alter table public.bb_cliques_wa   enable row level security;
alter table public.bb_import_lotes enable row level security;

drop policy if exists bb_leads_equipe on public.bb_leads;
create policy bb_leads_equipe on public.bb_leads for all to authenticated
  using (public.bb_eh_equipe()) with check (public.bb_eh_equipe());
drop policy if exists bb_recebimentos_equipe on public.bb_recebimentos;
create policy bb_recebimentos_equipe on public.bb_recebimentos for all to authenticated
  using (public.bb_eh_equipe()) with check (public.bb_eh_equipe());
drop policy if exists bb_cliques_wa_le on public.bb_cliques_wa;
create policy bb_cliques_wa_le on public.bb_cliques_wa for select to authenticated
  using (public.bb_eh_equipe());
drop policy if exists bb_import_lotes_le on public.bb_import_lotes;
create policy bb_import_lotes_le on public.bb_import_lotes for select to authenticated
  using (public.bb_eh_equipe());
