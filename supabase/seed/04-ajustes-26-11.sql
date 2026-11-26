-- Ajustes de 26/11 (rodar no SQL Editor do Supabase do HD360).
-- 1. Diária de 7 horas, das 10h às 17h (antes: 8 horas na ficha do Campeche e "07 horas ... até as 18h" na pergunta).
-- 2. Itens a bordo repetidos na Phantom 30 BBF: sai "Geladeira térmica" (fica "Cooler") e "Stand Up*" (fica "Prancha stand up").

begin;

update bb_roteiros
   set fichas = (select jsonb_agg(case when f->>'rotulo' = 'Diária' then jsonb_set(f, '{valor}', '"7 horas"') else f end
                                  order by n)
                   from jsonb_array_elements(fichas) with ordinality as x(f, n))
 where slug = 'ilha-do-campeche';

update bb_faq
   set resposta = 'A diária tem 7 horas de duração, com embarque geralmente às 10h e fim às 17h, conforme disponibilidade e roteiro.' || chr(10) ||
                  'O horário combinado deve ser respeitado, pois atrasos na chegada do grupo não estendem o tempo total do passeio. Outros horários podem ser consultados pelo WhatsApp.'
 where pergunta = 'Quanto tempo dura o passeio?';

update bb_lanchas
   set itens = (select jsonb_agg(i order by n)
                  from jsonb_array_elements(itens) with ordinality as x(i, n)
                 where i #>> '{}' not in ('Geladeira térmica', 'Stand Up*'))
 where slug = 'phantom30bb';

-- conferência: deve mostrar 7 horas, a resposta nova e 23 itens
select slug, fichas::text from bb_roteiros where slug = 'ilha-do-campeche';
select resposta from bb_faq where pergunta = 'Quanto tempo dura o passeio?';
select slug, jsonb_array_length(itens) as itens from bb_lanchas where slug = 'phantom30bb';

commit;
