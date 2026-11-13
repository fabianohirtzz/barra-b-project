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

## Regras de copy (Freela)

Português. Sem travessões, sem emojis. Números concretos. Nunca falar preço.

---

## Estado atual

**Fase 3 — Design da home (2026-11-12).** Briefing fechado, conteúdo do site atual extraído,
assets otimizados em `assets/img/`. Construindo `index.html` com cabeçalho, rodapé e fundo
náutico para alinhar o layout. Depois: páginas internas (lanchas, lancha, roteiros, roteiro,
sobre, contato, políticas), i18n, painel, WhatsApp.

**Pendências com a cliente:** CNPJ (Cadastur), tempos de trajeto do Campeche (30–40 / 45–60 min?),
duração da Costa da Lagoa (6 h ou 8 h?), My Nega 10 ou 11 passageiros, Phantom 30 BB 29 ou 30 pés.
