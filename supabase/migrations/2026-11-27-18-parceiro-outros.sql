-- Parceiro: novo papel "outro" (nem dono de lancha nem revendedor). Pedido do Fabiano em 27/11/2026.
-- Rodar no SQL Editor do Supabase.
alter table bb_parceiros drop constraint if exists bb_parceiros_tipo_check;
alter table bb_parceiros add constraint bb_parceiros_tipo_check check (tipo in ('dono', 'revendedor', 'ambos', 'outro'));

-- Conferir:
-- select pg_get_constraintdef(oid) from pg_constraint where conname = 'bb_parceiros_tipo_check';
