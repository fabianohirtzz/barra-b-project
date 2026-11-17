-- ============================================================
-- Barra Boat Floripa: dinheiro. Despesas (o caderno), despesas fixas,
-- comissões, metas e investimento em anúncios.
-- Depende de 01 a 03. Idempotente.
--
-- Só a DONA lê e escreve aqui. A atendente vê o funil e os valores do pedido,
-- mas não o caderno nem os relatórios de lucro.
-- ============================================================

create table if not exists public.bb_despesas_fixas (
  id          uuid primary key default gen_random_uuid(),
  categoria   text not null,
  valor       numeric(12,2) not null check (valor > 0),
  dia_do_mes  int not null default 5 check (dia_do_mes between 1 and 28),
  lancha_id   uuid references public.bb_lanchas(id) on delete set null,
  obs         text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.bb_despesas (
  id           uuid primary key default gen_random_uuid(),
  dia          date not null default current_date,
  categoria    text not null,   -- Combustível, Marinheiro, Gelo carvão e frutas, Manutenção, Marina e vaga,
                                -- Seguro, Documentação, Anúncios, Repasse a parceiro, Comissão, Outros
  valor        numeric(12,2) not null check (valor > 0),
  lancha_id    uuid references public.bb_lanchas(id) on delete set null,
  passeio_id   uuid references public.bb_passeios(id) on delete set null,
  obs          text,
  recibo_path  text,            -- caminho no bucket privado bb-recibos
  fixa_id      uuid references public.bb_despesas_fixas(id) on delete set null,
  mes_ref      date,            -- 1º dia do mês, só nas geradas pela despesa fixa
  created_at   timestamptz not null default now()
);
create index if not exists bb_despesas_dia_idx on public.bb_despesas (dia desc);
-- A despesa fixa entra UMA vez por mês, mesmo que o cron rode duas vezes.
create unique index if not exists bb_despesas_fixa_mes_uniq
  on public.bb_despesas (fixa_id, mes_ref) where fixa_id is not null;

create table if not exists public.bb_comissoes (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.bb_leads(id) on delete cascade,
  parceiro_id  uuid not null references public.bb_parceiros(id) on delete restrict,
  pct          numeric(5,2),                 -- se for percentual do valor fechado
  valor        numeric(12,2) not null check (valor >= 0),
  status       text not null default 'a_pagar' check (status in ('a_pagar','pago')),
  pago_em      date,
  created_at   timestamptz not null default now(),
  unique (lead_id, parceiro_id)
);

create table if not exists public.bb_metas (
  mes    date primary key,        -- 1º dia do mês
  valor  numeric(12,2) not null check (valor >= 0)
);

create table if not exists public.bb_ad_spend (   -- ROI, ROAS, CPL, CAC
  mes    date not null,
  canal  text not null default 'google_ads',
  valor  numeric(12,2) not null default 0,
  primary key (mes, canal)
);

-- Parceiro revendedor logado: as próprias vendas e comissões (item 23).
create or replace function public.bb_minhas_comissoes()
returns table (dia date, lancha text, valor_comissao numeric, status text, pago_em date)
language sql stable security definer set search_path = '' as $$
  select coalesce(p.dia, ld.data_desejada), l.nome, c.valor, c.status, c.pago_em
    from public.bb_comissoes c
    join public.bb_leads ld on ld.id = c.lead_id
    left join public.bb_passeios p on p.lead_id = ld.id and p.status <> 'cancelado'
    left join public.bb_lanchas l on l.id = coalesce(p.lancha_id, ld.lancha_id)
   where c.parceiro_id = public.bb_meu_parceiro()
   order by 1 desc
$$;
revoke execute on function public.bb_minhas_comissoes() from public, anon;
grant execute on function public.bb_minhas_comissoes() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['bb_despesas','bb_despesas_fixas','bb_comissoes']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_reg', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.bb_registra()', t || '_reg', t);
  end loop;
  foreach t in array array['bb_despesas','bb_despesas_fixas','bb_comissoes','bb_metas','bb_ad_spend']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_dona', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.bb_eh_dona()) with check (public.bb_eh_dona())', t || '_dona', t);
  end loop;
end $$;

-- ---------- recibos: bucket PRIVADO ----------
-- Foto pequena (o painel comprime antes de subir), lida só pela dona por URL
-- assinada. Fotos de lancha e vídeos NÃO vão para o Storage: ficam na ErêHost.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bb-recibos', 'bb-recibos', false, 2097152, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

drop policy if exists bb_recibos_dona on storage.objects;
create policy bb_recibos_dona on storage.objects for all to authenticated
  using (bucket_id = 'bb-recibos' and public.bb_eh_dona())
  with check (bucket_id = 'bb-recibos' and public.bb_eh_dona());
