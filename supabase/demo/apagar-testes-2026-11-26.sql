-- Apaga os 2 clientes de teste do dia 26/11/2026 (teste da agenda Google) e os passeios cancelados deles.
-- Rodar no SQL Editor do Supabase. Só estes ids; nada mais é apagado.
begin;
delete from bb_passeios where id in ('3d58fe73-9167-487b-8ed3-59627e4c66b2', '27174723-e4d0-4d34-b054-78ef7ebaf2c7');
delete from bb_leads where id in ('16c63350-7d42-4c02-b105-53e868aa8887', '67abdd58-fb50-404d-967e-f9087a5cc2e1');
commit;

-- Conferir (as duas consultas devem voltar vazias):
-- select id, nome from bb_leads where id in ('16c63350-7d42-4c02-b105-53e868aa8887', '67abdd58-fb50-404d-967e-f9087a5cc2e1');
-- select id from bb_passeios where id in ('3d58fe73-9167-487b-8ed3-59627e4c66b2', '27174723-e4d0-4d34-b054-78ef7ebaf2c7');
