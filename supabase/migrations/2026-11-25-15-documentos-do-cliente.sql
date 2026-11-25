-- Documentos do cliente (pedido do Fabiano em 25/11): CPF e documento estrangeiro, os dois opcionais
-- (muitos clientes são de fora: passaporte, DNI, cédula). Ficam no pedido (bb_leads), como nome, WhatsApp
-- e e-mail; o painel grava os dados cadastrais em todos os pedidos da mesma pessoa.
-- A tabela já é fechada por RLS (só dona e atendente).

alter table public.bb_leads
  add column if not exists cpf         text,
  add column if not exists doc_tipo    text,
  add column if not exists doc_numero  text,
  add column if not exists doc_pais    text,
  add column if not exists nascimento  date;

alter table public.bb_leads drop constraint if exists bb_leads_cpf_check;
alter table public.bb_leads add constraint bb_leads_cpf_check check (cpf is null or cpf ~ '^[0-9]{11}$');

alter table public.bb_leads drop constraint if exists bb_leads_doc_tipo_check;
alter table public.bb_leads add constraint bb_leads_doc_tipo_check
  check (doc_tipo is null or doc_tipo in ('passaporte', 'dni', 'cedula', 'rg', 'outro'));

select 'ok' as documentos_do_cliente;
