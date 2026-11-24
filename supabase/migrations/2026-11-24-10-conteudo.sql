-- ============================================================
-- Barra Boat Floripa: conteúdo do site editado pelo painel (perguntas, avaliações, roteiros).
-- As tabelas já existem desde 17/11 (bb_faq, bb_avaliacoes, bb_roteiros, com RLS da equipe).
-- Aqui só a coluna de idioma das avaliações: avaliação em espanhol sai com lang="es" no site
-- (leitor de tela e Google leem no idioma certo). Rodar antes de supabase/seed/02-conteudo.sql.
-- ============================================================
alter table public.bb_avaliacoes add column if not exists idioma text not null default 'pt'
  check (idioma in ('pt', 'es', 'en'));
