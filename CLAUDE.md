# Barra Boat Floripa — Site + Painel + WhatsApp

> Documento-cérebro do projeto. Manter a seção **Estado atual** sempre atualizada.
> Método: `freela-method` / comando `/site`. Regras de copy Freela valem para todo texto.

## Cliente & negócio

- **Empresa:** Barra Boat Floripa — aluguel de lanchas privativas (nunca compartilhadas),
  marinheiro e combustível inclusos. **Desde 2010.**
- **Responsável:** Michele (atende o WhatsApp, fecha as reservas).
- **Base / embarque:** Canal da Barra da Lagoa, Florianópolis/SC.
  Endereço oficial: **Rod. Jorn. Manoel de Menezes, 3007 - Barra da Lagoa, Florianópolis - SC**
  (o 2952 do rodapé antigo está errado).
- **Telefone/WhatsApp oficial:** **(48) 99115-3172** (`5548991153172`) em TODO lugar.
  Os números 51 4104-1472 e 51 98617-5144 do site antigo são erro, não usar.
- **E-mail:** contato@barraboatfloripa.com.br
- **Redes:** instagram.com/barraboatfloripa · tiktok.com/@barra.boat.florip
- **Google:** nota **4,8** (destacar). Place ID `ChIJweQXY-8_J5URa4sYsQVDMTc`.
- **Cadastur:** empresa certificada (selo como na PO Turismo). **Falta o CNPJ** para o link
  de consulta `cadastur.turismo.gov.br/cadastur/#!/public/qrcode/<CNPJ>`.
- **Frota:** 17 lanchas no site (2 da Michele, o resto de parceiros). Ver
  `docs/conteudo-site-atual/lanchas.json`.
- **Roteiros:** Ilha do Campeche (o mais pedido, diária 8 h, 10,4 milhas) e Costa da Lagoa.
- **Site atual:** WordPress + Elementor em barraboatfloripa.com.br (feito pela Freela).
  Conteúdo inteiro extraído em `docs/conteudo-site-atual/`.
- **Proposta:** `propostas.freelainhome.com.br/proposal-mM3kvakNgGAhEq6HHkajxXOo/` (20/10/2026).
  Site novo é cortesia; cobra-se automação de WhatsApp + painel.

## Decisões fixas

- **Sem preço no site.** Sempre "consulte pelo WhatsApp". Reserva fecha no WhatsApp, com a Michele.
- **Rastreamento:** manter o **GTM-5FJVHJRJ** existente (ligado a contas de anúncio reais) e a
  verificação do Search Console. Não trocar IDs.
- **Políticas:** criar política de cancelamento/reembolso e de privacidade padrão (a de hoje é
  o modelo do WooCommerce em inglês).
- **SEO e GEO desde o começo:** HTML semântico, um H1 por página, JSON-LD (LocalBusiness /
  TouristTrip / Product / FAQPage / Review), `llms.txt`, sitemap, hreflang quando houver idiomas,
  textos factuais e citáveis (distâncias, tempos, o que está incluso).
- **Idiomas:** mesmo recurso do Encanto da Ponte (`E:\Clientes\Encanto da Ponte\Site\en-pt-project\src\i18n`
  + `tools/i18n`): dicionários pré-traduzidos por IA, catálogo de 43 idiomas, núcleo
  es/en/fr/de/it/nl/ja/zh-Hans. Lá é Next.js com middleware; aqui precisa ser portado para site
  estático + PHP (prefixo `/es/`, `/en/`… gerado no build ou servido pelo PHP).
- **Assinatura Freela In Home** animada no rodapé (padrão Anita/ErêHost: traço vira sorriso).

## Arquitetura (mesma da Pereira Oliveira Turismo)

Referência: `E:\Clientes\Pereira Oliveira Turismo\po-tu-project` (ler o CLAUDE.md de lá).

- **Front-end:** HTML/CSS/JS estático, sem build. Google Fonts.
- **Backend:** PHP na **ErêHost** (cPanel), deploy manual por FTPS. Segredos em
  `config.local.php` (fora do Git).
- **Dados:** Supabase **compartilhado do HD360** (projeto `euzmbswywwhmicjlszqw`, decisão do
  Fabiano em 2026-11-12). Tabelas da Barra Boat com prefixo próprio (ex.: `bb_`) para não
  colidir com as do HD360/NOX; RLS em todas. Auth + RLS. Lanchas, roteiros, avaliações, Instagram e disponibilidade
  vêm do banco; o site lê pelo PHP (render no servidor, bom para SEO) com cache.
- **Painel `/painel`:** HTML/JS + Supabase, mesmo padrão da PO (funil, gaveta do lead,
  importação de contatos da agenda, revisão, transmissão/campanha, textos do robô).
- **WhatsApp:** API oficial da Meta em modo de coexistência (`whatsapp.php`, `wa-cron.php`,
  fluxo), igual à PO.
- **Prévia:** GitHub Pages deste repo, sempre `noindex` (o PHP não roda lá).
  Repo: https://github.com/fabianohirtzz/barra-b-project (público) ·
  Prévia: https://fabianohirtzz.github.io/barra-b-project/
- **Produção:** ErêHost, domínio barraboatfloripa.com.br (mantido).

## Escopo completo

Ver `docs/funcionalidades.md` (lista fechada com o Fabiano em 2026-11-12) e
`docs/painel-relatorios.md` (o que a dona precisa enxergar).

## Design

- **Marca (brandbook):** azul-marinho `#083359`, azul `#18608C`, cinza `#4D4D4D`,
  gradiente marinho→azul. Logo em fonte Velocista (só no logo).
- **Fontes do site:** Archivo (variável, eixo de largura): expandida nos títulos, normal no corpo.
- **Fundo:** carta náutica sutil (curvas de profundidade em linhas finas) + a lancha do ícone
  da marca cruzando de vez em quando com a esteira, como a estrela cadente da Freela.
- **Header:** discreto e fora da curva — menu abre como uma rota: os itens são paradas numa
  linha tracejada e a lancha desliza até o item em foco.
- **Rodapé:** "linha d'água" — wordmark gigante cortado pela superfície, metade submersa,
  com a água se movendo; dados de contato, Cadastur, coordenadas do embarque.
- Azul / gradiente da marca nos botões e em cards estratégicos.
- Avaliações: galeria em destaque com a nota 4,8 do Google.

## Imagens melhoradas com IA (mesmo método da Panifran)

- **Modelo:** Real-ESRGAN x4plus em ONNX (Qualcomm AI Hub, `real_esrgan_x4plus-onnx-float`, v0.66.0),
  rodando local no `onnxruntime` (CPU), entrada fixa 128×128 processada em blocos sobrepostos
  (12 px) com costura em rampa. ~70–90 s por foto no CPU.
- **Regra:** foto com lado maior ≥ 1600 px não passa na IA (só redimensiona). Menor que isso:
  reduz a entrada para no máx. 560 px, aplica 4x e reduz a saída para no máx. 1600 px.
- **Onde fica:** `E:\Clientes\Barra Boat Floripa\Site\imagens-site-antigo\` com `originais/`
  (download fiel do WordPress), `melhoradas-ia/` (JPG q92) e `manifesto.json` (URL de origem →
  arquivos, tamanhos, método e em qual lancha/página a foto é usada). Fora do Git.
- **No site:** WebP gerados a partir de `melhoradas-ia/` (capas de lancha 900 px, fotos 1400 px).
  As galerias das páginas de lancha devem sair do mesmo `melhoradas-ia/`.

- **No painel (combinado com a Michele):** ao importar foto de lancha, o painel trata sozinho
  (IA se precisar, recorte quadrado, compressão WebP); ao importar vídeo do Instagram, comprime
  sem perder resolução. Ela não edita nada à mão. Detalhes em `docs/funcionalidades.md`.

## Regras de copy (Freela)

Português. Sem travessões, sem emojis. Números concretos. Nunca falar preço.
Sem pet: nunca mencionar animais a bordo (decisão da Michele, 2026-11-16).
No site, quem atende é "a nossa equipe" (nunca citar a Michele pelo nome; só nas avaliações reais do Google).

---

## Estado atual

**Fase 4 — Páginas internas (2026-11-16).** Home aprovada pela cliente. Páginas geradas:
`lanchas/` (grade com filtro), `lanchas/<slug>/` x17 (galeria, itens a bordo, calendário de datas
livres), `roteiros/`, `ilha-do-campeche/`, `costa-da-lagoa/`, `sobre/`, `contato/` (formulário que
abre o WhatsApp), `politica-de-cancelamento/`, `politica-de-privacidade/`, `404.html`, `sitemap.xml`,
`robots.txt`, `llms.txt`. Próximo: i18n, painel, PHP/Supabase, WhatsApp.

**Como as páginas internas são feitas (prévia estática):**
- `python tools/gerar_paginas.py` gera todas a partir do `index.html` (cabeçalho, menu, rodapé e
  ícones são copiados de lá, com caminhos relativos ajustados à profundidade). Editou o cabeçalho
  ou o rodapé da home? Rode o gerador de novo. Nunca editar as páginas geradas à mão.
- `python tools/gerar_imagens.py` gera galerias (`assets/img/lanchas/<slug>/NN.webp` e `NN-p.webp`)
  e fotos de páginas (`assets/img/paginas/`) a partir de `melhoradas-ia/`.
- Capas das páginas (`assets/img/capas/`) são fotos de drone da cliente melhoradas com IA na
  resolução cheia.
- `assets/data/disponibilidade.json` tem **datas de exemplo** (só para a prévia). Na produção o PHP
  entrega as datas reservadas do painel no mesmo formato (`ocupadas: {slug: [AAAA-MM-DD]}`).
- Ícones dos itens a bordo: regras `ICONE` em `tools/gerar_paginas.py` (a primeira que casar vence); os
  desenhos ficam no sprite do `index.html`. Item novo sem ícone cai em `i-lancha`: criar um ícone próprio.
- Paradas dos roteiros levam uma foto cada (nome, texto, foto, alt) em `pagina_roteiro`.
- Formulário da home: lista das lanchas com o limite de pessoas; se o grupo passar, avisa e oferece a orientação da equipe.
- CSS das páginas internas em `assets/css/paginas.css`; JS da lancha em `assets/js/lancha.js`,
  do contato em `assets/js/contato.js`, reels da home em `assets/js/reels.js`.

**Pendências com a cliente:** CNPJ (Cadastur), tempos de trajeto do Campeche (30–40 / 45–60 min?),
duração da Costa da Lagoa (6 h ou 8 h?), My Nega 10 ou 11 passageiros, Phantom 30 BB 29 ou 30 pés.
