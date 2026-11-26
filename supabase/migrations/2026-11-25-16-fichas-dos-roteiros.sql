-- Fichas dos roteiros (pedido do Fabiano em 25/11): os cartõezinhos de dados de cada roteiro
-- ("Distância 10,4 milhas", "Diária 8 horas"...) passam a ser editáveis no painel.
-- Uma lista por roteiro, até 4 itens, na ordem de exibição: [{"rotulo": "...", "valor": "..."}].
-- No site: a capa da página do roteiro e a comparação em /roteiros/ mostram todas; o card do roteiro
-- na home mostra as 3 primeiras. Vazio (null ou []) = fica como está no molde estático.

alter table public.bb_roteiros add column if not exists fichas jsonb;

alter table public.bb_roteiros drop constraint if exists bb_roteiros_fichas_check;
alter table public.bb_roteiros add constraint bb_roteiros_fichas_check
  check (fichas is null or (jsonb_typeof(fichas) = 'array' and jsonb_array_length(fichas) <= 4));

-- carga: as fichas de hoje, iguais ao site (tools/gerar_paginas.py, FICHAS). Só preenche quem está vazio,
-- então rodar de novo não apaga o que a equipe mudou no painel.
update public.bb_roteiros set fichas = '[
  {"rotulo": "Distância", "valor": "10,4 milhas"},
  {"rotulo": "Cada trajeto", "valor": "30 a 40 min"},
  {"rotulo": "Diária", "valor": "8 horas"},
  {"rotulo": "Saída", "valor": "Canal da Barra"}
]'::jsonb
 where slug = 'ilha-do-campeche' and (fichas is null or fichas = '[]'::jsonb);

update public.bb_roteiros set fichas = '[
  {"rotulo": "Mar", "valor": "Águas calmas"},
  {"rotulo": "Saída", "valor": "Barra ou Lagoa"},
  {"rotulo": "Diária", "valor": "6 horas"},
  {"rotulo": "Paradas", "valor": "5"}
]'::jsonb
 where slug = 'costa-da-lagoa' and (fichas is null or fichas = '[]'::jsonb);

select slug, jsonb_array_length(coalesce(fichas, '[]'::jsonb)) as fichas from public.bb_roteiros order by ordem;
