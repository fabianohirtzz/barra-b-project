# Taxonomias (WooCommerce) — barraboatfloripa.com.br

Fonte: API REST `/wp-json/wp/v2/<taxonomia>` (contagens oficiais) + atribuição de cada produto em `/wp-json/wp/v2/product`.

> IMPORTANTE: as taxonomias customizadas **pés**, **passageiro** e **valor** só estão preenchidas para 1 lancha (Phantom 29 Pés Bravo). Para as demais, os valores de Pés/Passageiros/Valor exibidos no site vêm de outro campo (provavelmente campos personalizados do template Elementor, não expostos na API) — ver `lanchas.json` (`pes`, `passageiros`, `valor_exibido`).

> As páginas de arquivo de taxonomia (ex.: /pes/29/, /produto-tag/norte-da-ilha/) **não filtram**: todas exibem 15 das 17 lanchas (faltam Focker24 e Phantom30 pés BB) em ordem que muda a cada carregamento (template "product-archive" do Elementor), inclusive /shop/ e /categoria-produto/sem-categoria/. Ou seja, a listagem pública desses arquivos não reflete a taxonomia.

## Passageiro (`passageiro`)

### 8

- slug: `8` · ID 32 · contagem oficial: 0 · URL: https://barraboatfloripa.com.br/passageiro/8/
- descrição: (vazia)
- lanchas: (nenhuma)

### 9

- slug: `9` · ID 27 · contagem oficial: 1 · URL: https://barraboatfloripa.com.br/passageiro/9/
- descrição: (vazia)
- lanchas: Phantom 29 Pés Bravo

## Pés (`pes`)

### 29

- slug: `29` · ID 22 · contagem oficial: 1 · URL: https://barraboatfloripa.com.br/pes/29/
- descrição: (vazia)
- lanchas: Phantom 29 Pés Bravo

## Valor (`valor`)

### 00

- slug: `00` · ID 25 · contagem oficial: 0 · URL: https://barraboatfloripa.com.br/valor/00/
- descrição: (vazia)
- lanchas: (nenhuma)

### 00 à R$ 2.500

- slug: `00-a-r-2-500` · ID 24 · contagem oficial: 0 · URL: https://barraboatfloripa.com.br/valor/00-a-r-2-500/
- descrição: (vazia)
- lanchas: (nenhuma)

### De R$ 1.500

- slug: `de-r-1-500` · ID 23 · contagem oficial: 0 · URL: https://barraboatfloripa.com.br/valor/de-r-1-500/
- descrição: (vazia)
- lanchas: (nenhuma)

### De R$ 1.500 à R$ 2.500

- slug: `de-r-1-500-a-r-2-500` · ID 28 · contagem oficial: 1 · URL: https://barraboatfloripa.com.br/valor/de-r-1-500-a-r-2-500/
- descrição: (vazia)
- lanchas: Phantom 29 Pés Bravo

## Categorias de produto (`product_cat`)

### Lancha

- slug: `lancha` · ID 21 · contagem oficial: 14 · URL: https://barraboatfloripa.com.br/categoria-produto/lancha/
- descrição: (vazia)
- lanchas: FS230 PÉS, HD26 pés Lulu, Focker24 Norte da Ilha e Leste, Phantom 36 pés, Phantom29G, Phantom 36c, HD 26 PÉS LANAI, Phantom30 pés BB, Phantom 23.5 M, Phantom 30 Pés C, Phantom 29 pés My Girls, Phantom 23.5 Pés G, HD 26 pés Caluga, Phantom 29 Pés Bravo

### Sem categoria

- slug: `sem-categoria` · ID 20 · contagem oficial: 3 · URL: https://barraboatfloripa.com.br/categoria-produto/sem-categoria/
- descrição: (vazia)
- lanchas: Phantom 24 Horus, Cabrasmar 37, My Nega 30 pés

## Tags de produto (`product_tag`)

### leste da ilha

- slug: `leste-da-ilha` · ID 36 · contagem oficial: 16 · URL: https://barraboatfloripa.com.br/produto-tag/leste-da-ilha/
- descrição: (vazia)
- lanchas: Phantom 24 Horus, Cabrasmar 37, FS230 PÉS, HD26 pés Lulu, Focker24 Norte da Ilha e Leste, Phantom 36 pés, Phantom29G, Phantom 36c, HD 26 PÉS LANAI, Phantom30 pés BB, Phantom 23.5 M, Phantom 30 Pés C, Phantom 29 pés My Girls, Phantom 23.5 Pés G, HD 26 pés Caluga, Phantom 29 Pés Bravo

### norte da ilha

- slug: `norte-da-ilha` · ID 35 · contagem oficial: 1 · URL: https://barraboatfloripa.com.br/produto-tag/norte-da-ilha/
- descrição: (vazia)
- lanchas: My Nega 30 pés

## Região exibida no selo (badge) de cada lancha

- Phantom 24 Horus: Leste da Ilha (tag: leste da ilha)
- Cabrasmar 37: Leste da Ilha (tag: leste da ilha)
- My Nega 30 pés: Norte da Ilha (tag: norte da ilha)
- FS230 PÉS: Leste da Ilha (tag: leste da ilha)
- HD26 pés Lulu: Leste da Ilha (tag: leste da ilha)
- Focker24 Norte da Ilha e Leste: Leste da Ilha (tag: leste da ilha)
- Phantom 36 pés: Leste da Ilha (tag: leste da ilha)
- Phantom29G: Leste da Ilha (tag: leste da ilha)
- Phantom 36c: Leste da Ilha (tag: leste da ilha)
- HD 26 PÉS LANAI: Leste da Ilha (tag: leste da ilha)
- Phantom30 pés BB: Leste da Ilha (tag: leste da ilha)
- Phantom 23.5 M: Leste da Ilha (tag: leste da ilha)
- Phantom 30 Pés C: Leste da Ilha (tag: leste da ilha)
- Phantom 29 pés My Girls: Leste da Ilha (tag: leste da ilha)
- Phantom 23.5 Pés G: Leste da Ilha (tag: leste da ilha)
- HD 26 pés Caluga: Leste da Ilha (tag: leste da ilha)
- Phantom 29 Pés Bravo: Leste da Ilha (tag: leste da ilha)

## Resumo por lancha

| Lancha | Categoria | Tag | tax. pés | tax. passageiro | tax. valor |
|---|---|---|---|---|---|
| Phantom 24 Horus | — | leste da ilha | — | — | — |
| Cabrasmar 37 | — | leste da ilha | — | — | — |
| My Nega 30 pés | — | norte da ilha | — | — | — |
| FS230 PÉS | Lancha | leste da ilha | — | — | — |
| HD26 pés Lulu | Lancha | leste da ilha | — | — | — |
| Focker24 Norte da Ilha e Leste | Lancha | leste da ilha | — | — | — |
| Phantom 36 pés | Lancha | leste da ilha | — | — | — |
| Phantom29G | Lancha | leste da ilha | — | — | — |
| Phantom 36c | Lancha | leste da ilha | — | — | — |
| HD 26 PÉS LANAI | Lancha | leste da ilha | — | — | — |
| Phantom30 pés BB | Lancha | leste da ilha | — | — | — |
| Phantom 23.5 M | Lancha | leste da ilha | — | — | — |
| Phantom 30 Pés C | Lancha | leste da ilha | — | — | — |
| Phantom 29 pés My Girls | Lancha | leste da ilha | — | — | — |
| Phantom 23.5 Pés G | Lancha | leste da ilha | — | — | — |
| HD 26 pés Caluga | Lancha | leste da ilha | — | — | — |
| Phantom 29 Pés Bravo | Lancha | leste da ilha | 29 | 9 | De R$ 1.500 à R$ 2.500 |
