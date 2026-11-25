-- ============================================================
-- Barra Boat Floripa: vídeos do Instagram da home enviados pelo painel.
-- O vídeo entra numa fila (pronto = false); o cron/videos.php comprime com o ffmpeg
-- do servidor e marca pronto. O site só mostra os prontos e ativos. Idempotente.
-- Rodar antes de supabase/seed/03-instagram.sql.
-- ============================================================
alter table public.bb_instagram add column if not exists legenda text;            -- o que aparece no vídeo (leitor de tela e Google)
alter table public.bb_instagram add column if not exists pronto  boolean not null default true;
alter table public.bb_instagram add column if not exists erro    text;            -- falha do processamento, em português
alter table public.bb_instagram add column if not exists largura int;
alter table public.bb_instagram add column if not exists altura  int;
