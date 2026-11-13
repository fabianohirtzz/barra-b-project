# Conteúdo do site atual — barraboatfloripa.com.br

Extração feita em 12/11/2026 a partir do sitemap Yoast (`/sitemap_index.xml`), do HTML público de cada URL (curl com User-Agent de navegador) e da API REST do WordPress/WooCommerce (`/wp-json/wp/v2/pages`, `/wp-json/wp/v2/product`, `/wp-json/wc/store/products`, `/wp-json/wp/v2/media`, taxonomias). Transcrição fiel, sem correções de texto; observações do extrator aparecem entre colchetes ou em blocos `>`.

Todas as 33 URLs do sitemap responderam HTTP 200. Todas as 221 URLs de `imagens.txt` foram verificadas com HEAD e responderam 200. Nenhuma imagem foi baixada.

## Índice

| Arquivo | Conteúdo |
|---|---|
| `paginas/home.md` | Início (`/`) |
| `paginas/lanchas.md` | Listagem de lanchas (`/lanchas/`), 17 cards |
| `paginas/roteiros.md` | Roteiros (`/roteiros/`): Costa da Lagoa + Ilha do Campeche |
| `paginas/ilha-do-campeche.md` | Roteiro Ilha do Campeche |
| `paginas/costa-da-lagoa.md` | Roteiro Costa da Lagoa |
| `paginas/sobre.md` | Sobre: galeria, história, valores, **FAQ completo**, políticas de cancelamento, regras da Ilha do Campeche |
| `paginas/contato.md` | Contato + formulário |
| `paginas/reembolso-ou-devolucoes.md` | Página-modelo do WooCommerce em inglês (não é conteúdo real) |
| `paginas/shop.md` | `/shop/` (arquivo de produtos do WooCommerce, 15 cards) |
| `lanchas/<slug>.md` | 17 lanchas: dados, itens, descrição, galeria completa (URLs originais + alt + dimensões), SEO |
| `lanchas.json` | Array estruturado das 17 lanchas |
| `taxonomias.md` | Passageiro, pés, valor, categorias e tags, com as lanchas de cada termo |
| `global.md` | Identidade, menu, menu mobile, rodapé, popup e formulários, contatos, FAQ, avaliações, bloco comum das lanchas, roteiros consolidados, políticas, rastreamento/stack |
| `imagens.txt` | 221 URLs originais (wp-content/uploads) **usadas** no site, sem duplicatas |
| `imagens-biblioteca-completa.txt` | Extra: as 565 URLs da biblioteca de mídia (API `/wp/v2/media`), incluindo as que não estão em uso |

Cada `paginas/*.md` traz: URL, title, meta description, og:description/og:image, canonical, robots, IDs/datas do WP, hierarquia H1/H2, todo o texto visível do conteúdo na ordem (com links e imagens no lugar em que aparecem) e a lista de imagens com alt. Menu, rodapé, popups e o widget de avaliações ficam só em `global.md`.

## Lanchas (17)

| Lancha | Slug | Pés | Passag. | Valor exibido | Região (selo) | Fotos |
|---|---|---|---|---|---|---|
| Phantom 24 Horus | phantom-24-horus | 24 | 7 | (não exibido) | Leste da Ilha | 11 |
| Cabrasmar 37 | 3373 | 37 | 10 | (não exibido) | Leste da Ilha | 9 |
| My Nega 30 pés | 3363 | 30 | 10 | (não exibido) | Norte da Ilha | 9 |
| FS230 PÉS | fs230-pes | 23 | 07 | Sob Consulta | Leste da Ilha | 13 |
| HD26 pés Lulu | hd26-lulu | 26 | 09 | Sob Consulta | Leste da Ilha | 8 |
| Focker24 Norte da Ilha e Leste | focker24d | 24 | 07 | Sob Consulta | Leste da Ilha | 13 |
| Phantom 36 pés | 1564 | 36 | 13 | Sob Consulta | Leste da Ilha | 10 |
| Phantom29G | phantom29g | 29 | 09 | Sob Consulta | Leste da Ilha | 7 |
| Phantom 36c | phantom-36c | 36 | 11 | Sob Consulta | Leste da Ilha | 16 |
| HD 26 PÉS LANAI | hd-26-pes-lanai | 26 | 9 | Sob Consulta | Leste da Ilha | 5 |
| Phantom30 pés BB | phantom30bb | 29 | 12 | Sob Consulta | Leste da Ilha | 19 |
| Phantom 23.5 M | phantom-23-5-maninha | 23.5 | 7 | Sob Consulta | Leste da Ilha | 9 |
| Phantom 30 Pés C | phantom-30 | 30 | 11 | Sob Consulta | Leste da Ilha | 12 |
| Phantom 29 pés My Girls | phantom-29-my-girl | 29 | 9 | Sob Consulta | Leste da Ilha | 5 |
| Phantom 23.5 Pés G | phantom-23-5 | 23.5 | 7 | Sob Consulta | Leste da Ilha | 9 |
| HD 26 pés Caluga | hd-26-caluga | 26 | 9 | Sob Consulta | Leste da Ilha | 14 |
| Phantom 29 Pés Bravo | phantom-29 | 29 | 9 | Sob Consulta | Leste da Ilha | 11 |

(Ordem = ordem da página /lanchas/. Pés, passageiros e valor foram lidos do que a página do produto exibe.)

## Lacunas e observações

**Preços**
- Nenhuma lancha tem preço no WooCommerce (preço = 0). O site mostra "Valor: Sob Consulta" em 14 lanchas. As 3 mais recentes (Horus, Cabrasmar 37 e My Nega) não mostram o campo Valor.
- O único preço citado no site é "Custo de R$ 100,00 no valor da diária" para embarcar na Lagoa da Conceição (FAQ). Há também a taxa de 10% para alteração de data. O termo de taxonomia "De R$ 1.500 à R$ 2.500" está ligado só à Phantom 29 Pés Bravo e não aparece em nenhuma página.

**Dados das lanchas divergentes ou incompletos**
- **Taxonomias:** as taxonomias pés/passageiro/valor estão preenchidas só para a Phantom 29 Pés Bravo. Os valores das outras lanchas vêm de campos do template que a API não expõe. 3 lanchas (Horus, Cabrasmar, My Nega) estão em "Sem categoria".
- **My Nega 30 pés:** o campo diz "Passageiros: 10" e o texto diz "11 Passageiros".
- **Phantom30 pés BB:** o nome diz "30 pés" e o campo diz "Pés: 29".
- **FS230 PÉS:** o campo diz "Pés: 23". A lotação muda por roteiro: 07 na Ilha do Campeche e 09 na Costa da Lagoa.
- **Phantom 24 Horus:** "Churrasqueira" aparece duas vezes nos itens. Está transcrito como no site.
- **Descrição longa:** só 5 lanchas têm descrição longa no WooCommerce (Phantom 23.5 M, Phantom 30 Pés C, Phantom 29 pés My Girls e HD 26 pés Caluga, mais uma única linha na Bravo: "9 convidados + 1 marinheiro"). Essa descrição não aparece na página pública: o template só mostra a descrição curta (os itens).
- **Slugs numéricos:** 3 lanchas não têm slug amigável (`/lanchas/1564/`, `/lanchas/3373/`, `/lanchas/3363/`).
- **Galerias:** a imagem destacada também é o 1º item da galeria. A duplicata foi removida da lista. Quase todas as fotos estão sem alt. Os nomes de arquivo são genéricos (WhatsApp-Image..., Screenshot_...).

**Contatos inconsistentes (ver `global.md` §5)**
- **Endereço:** o rodapé diz "Rod. Jorn. Manoel de Menezes, 2952" e a página Contato diz "…, 3007".
- **Links da página Contato:** o telefone exibido é (48) 99115-3172, mas o link é `tel:5141041472`. O mailto aponta para `contato@barraboatfloripa.com`, sem ".br". O ícone de WhatsApp leva para `5551986175144`.
- **Página /roteiros/:** o botão "VER TODAS LANCHAS" leva para o WhatsApp `5551986175144` em vez de /lanchas.
- **CNPJ:** não aparece em nenhuma página. Do Cadastur há só o selo, sem número.

**Roteiros com informações conflitantes (ver `global.md` §9)**
- **Campeche, tempo por trajeto:** 35 min (/ilha-do-campeche/), 45 a 60 min (/roteiros/ e páginas das lanchas) ou 30 a 40 min (FAQ).
- **Campeche, rota:** só a página /ilha-do-campeche/ inclui a parada "Prainha (panorâmico)".
- **Costa da Lagoa, duração:** 08 horas (cabeçalhos e FAQ) ou 06 horas (texto de /roteiros/ e bloco das lanchas).
- **Tempos por parada:** não existem no site.

**Páginas e conteúdo**
- **/reembolso-ou-devolucoes/:** é a página-modelo padrão do WooCommerce, em inglês e com placeholders. Não serve como política. As regras reais de cancelamento estão no FAQ da página Sobre.
- **Páginas que faltam:** não há Política de Privacidade, Termos ou aviso LGPD/cookies.
- **Arquivos de taxonomia** (/passageiro/9/, /pes/29/, /valor/…/, /categoria-produto/…, /produto-tag/…) **e /shop/:** não filtram. Todos mostram 15 das 17 lanchas (faltam Focker24 e Phantom30 BB) em ordem aleatória. Por isso não foram transcritos como páginas: o conteúdo deles é o mesmo dos cards. A associação real de cada lancha está em `taxonomias.md`.
- **Conteúdo duplicado:** os textos dos roteiros se repetem em /roteiros/, /ilha-do-campeche/, /costa-da-lagoa/, no mega menu, no FAQ da página Sobre e no bloco comum das 17 lanchas. Os cards de lancha da Home (12) e de /lanchas/ (17) repetem a descrição curta de cada produto.
- **SEO:**
  - Só a Home tem meta description. Nas lanchas, a meta description é a lista de itens.
  - As páginas internas não têm H1.
  - Nos cards da Home e de /lanchas/, o nome de cada lancha é um H1, o que gera vários H1 por página.
- **Avaliações:** o widget Trustindex mostra "65 avaliações no Google", mas só 7 estão no HTML (transcritas em `global.md` §7). A seção do feed do Instagram (plugin Spotlight) carrega por JavaScript e não foi capturada.
- **Blog:** não há posts (`/wp/v2/posts` vazio).
- **Rastreamento:**
  - Encontrados: GTM-5FJVHJRJ e a verificação do Google Search Console.
  - Não aparecem no HTML: GA4, Google Ads, Meta Pixel e TikTok Pixel. Se existirem, estão dentro do GTM.
- **Mensagem padrão do WhatsApp:** "Olá, vim através do site e gostaria de mais informações..." (número 5548991153172).
