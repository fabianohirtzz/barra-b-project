-- Os vídeos do Instagram que estavam fixos na home (gerado por tools/extrair_conteudo.py).
-- Só entra se a tabela estiver vazia. Depende da migração 2026-11-25-11-instagram.sql.
insert into public.bb_instagram (video_url, poster_url, legenda, largura, altura, ordem, pronto)
select x->>'video_url', x->>'poster_url', x->>'legenda', (x->>'largura')::int, (x->>'altura')::int, (x->>'ordem')::int, true
  from jsonb_array_elements($carga$[
 {
  "video_url": "/assets/video/instagram/ig-1.mp4",
  "poster_url": "/assets/img/instagram/ig-1.webp",
  "legenda": "Tapete flutuante e stand up paddle na água verde da Ilha do Campeche",
  "largura": 720,
  "altura": 1280,
  "ordem": 0
 },
 {
  "video_url": "/assets/video/instagram/ig-2.mp4",
  "poster_url": "/assets/img/instagram/ig-2.webp",
  "legenda": "Embarque no trapiche e a lancha saindo para o passeio",
  "largura": 720,
  "altura": 1280,
  "ordem": 1
 },
 {
  "video_url": "/assets/video/instagram/ig-3.mp4",
  "poster_url": "/assets/img/instagram/ig-3.webp",
  "legenda": "Grupo de amigos curtindo o dia de sol a bordo",
  "largura": 720,
  "altura": 1280,
  "ordem": 2
 },
 {
  "video_url": "/assets/video/instagram/ig-4.mp4",
  "poster_url": "/assets/img/instagram/ig-4.webp",
  "legenda": "Água cristalina, caiaque e o grupo a bordo na Lagoa da Conceição",
  "largura": 480,
  "altura": 854,
  "ordem": 3
 },
 {
  "video_url": "/assets/video/instagram/ig-5.mp4",
  "poster_url": "/assets/img/instagram/ig-5.webp",
  "legenda": "Navegando pela Lagoa da Conceição com a casa dos pescadores ao fundo",
  "largura": 720,
  "altura": 1280,
  "ordem": 4
 },
 {
  "video_url": "/assets/video/instagram/ig-6.mp4",
  "poster_url": "/assets/img/instagram/ig-6.webp",
  "legenda": "Passeio pela Costa da Lagoa com a churrasqueira de bordo",
  "largura": 720,
  "altura": 1280,
  "ordem": 5
 },
 {
  "video_url": "/assets/video/instagram/ig-7.mp4",
  "poster_url": "/assets/img/instagram/ig-7.webp",
  "legenda": "Lancha no trapiche e stand up na Costa da Lagoa",
  "largura": 720,
  "altura": 1280,
  "ordem": 6
 }
]$carga$::jsonb) x
 where not exists (select 1 from public.bb_instagram);

select count(*) as videos from public.bb_instagram;
