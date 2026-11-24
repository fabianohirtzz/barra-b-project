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
- **Produção:** ErêHost, domínio barraboatfloripa.com.br (mantido). DNS saiu do Cloudflare em
  18/11: servidores `ns1/ns2.cpbr-sp4.erehost.com.br`, IP `200.11.120.126`, zona no cPanel
  (MX, SPF, DKIM e DMARC conferidos). SSL pelo AutoSSL.
- **Servidor de teste:** https://novo.barraboatfloripa.com.br (pasta `novo/`, `noindex` pelo
  `.htaccess` e pela meta). `config.local.php` com a `service_role` já está em `novo/` (403 pela web).
- **Deploy:** `BB_FTP_SENHA='...' python tools/publicar.py` (FTPS em `ftp.barraboatfloripa.com.br`;
  envia só o que mudou, guardado em `.publicado.json`; reconecta quando a ErêHost derruba a sessão).
  **A raiz do FTP é o WordPress em produção:** o padrão é `/novo` e a raiz só com `--producao`,
  no dia da troca. Senha só na hora, nunca em arquivo.

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
Pets (reunião de 19/11, substitui o "sem pet" de 16/11): **Costa da Lagoa aceita pets de porte pequeno e médio;
Ilha do Campeche não aceita** (a ilha proíbe animais), com aviso na página do roteiro. Fora isso, não falar de pet.
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

**Fase 5 — Painel (2026-11-17).** Protótipo clicável em `painel/` (`prototipo.js` com dados de
exemplo, nada salvo) para a Michele aprovar o jeito: menu Hoje, Agenda, Clientes, Dinheiro, Mais;
gaveta do cliente, anotar despesa, relatório com gráficos, lancha com "Conectar agenda do dono".
Depois de aprovado: migrações `bb_` (aplicar no Supabase do HD360 só com ok do Fabiano), login,
e trocar os dados de exemplo pelos reais. Gráficos: série 2026 `#1A6FA8`, 2025 `#C97A2A`
(validados para daltonismo); barras de uma série só em `#1A6FA8`.
Protótipo aprovado em 17/11 (com "Fechar a agenda por um período"). Migrações
`supabase/migrations/2026-11-17-0[1-5]-*.sql` e a carga **aplicadas em 18/11** (35 tabelas `bb_`, todas
com RLS; 17 lanchas, 2 roteiros; dona cadastrada). Escrita no banco pelo MCP é recusada: gerar arquivo
para o Fabiano rodar no SQL Editor e conferir por leitura. Em 18/11 também foram trancadas as tabelas
`po_` da PO (só `po_equipe` acessa).
**Painel real ligado ao Supabase (18/11):** `painel/index.html` + `app.js` + `config.js` (login, Hoje, Agenda
com passeios/manutenção/período fechado/dia do dono, Clientes com funil, pedido, valores, pagamentos e
anotações, Dinheiro só da dona com despesas + recibo no bucket privado, meta e gráficos, Lanchas, Parceiros,
Marinheiros). O protótipo aprovado ficou em `painel/prototipo.html`. Falta: robô/conversas do WhatsApp,
leitor das agendas dos donos (cron PHP), fotos pelo painel, roteiros, textos do site, acessos da equipe,
lista de passageiros e contrato. Teste sem login real: servir o repo e trocar o supabase-js por um falso em
memória (Playwright `page.route`). Segurança
por papel em `bb_equipe` (dona/atendente/parceiro/marinheiro), nunca `authenticated using (true)`
porque o projeto é compartilhado; anon sem policy (site lê pelo PHP com service_role). Ver `supabase/README.md`.

**Dados fictícios para a apresentação (19/11):** `supabase/demo/carregar.sql` (3 parceiros, 3 marinheiros,
passeios de jan/2025 a dez/2026, clientes, pagamentos, despesas, metas; ids `de300000-…`, leads com
`origem_import = 'demo'`). Testado no banco com rollback. **Antes de lançar, rodar `supabase/demo/apagar.sql`.**

**Alerta de clima (item 38, 19/11):** a tela Hoje mostra um aviso para cada dia de tempo ruim com passeio
(hoje + 3 dias), com o botão de WhatsApp e a mensagem pronta (pt/es). Lê `bb_clima` (migração
`2026-11-19-06-clima.sql`, um registro por dia). Limites em `CLIMA` no `painel/app.js` (vento 30 km/h, rajada 45,
chuva 5 mm). **Nenhuma fonte de previsão integrada ainda:** falta o cron PHP que preenche `bb_clima` (fonte a
escolher). Para a apresentação: `supabase/demo/clima.sql` (rodar no dia, pode repetir).
**Windguru (20/11):** a Michele usa o Windguru, spot próprio **1083158** ("Barra Boat Floripa"). A tela Hoje mostra
o widget oficial gratuito (`montaWindguru()` no `app.js`, km/h, 4 dias, em português). O widget só exibe; o alerta
automático continua dependendo do `bb_clima`. Puxar os números do Windguru para o alerta exige a API paga deles
(não copiar do site).

**Site pelo PHP (19/11):** em novo.barraboatfloripa.com.br as páginas passam pelo `site.php` (o `.htaccess`
manda as pastas para lá). O molde de cada página é o HTML estático do gerador; `lib/site.php` troca só o que
vem do banco: cards da home e de `/lanchas/`, opções do formulário, a página `/lanchas/<slug>/` inteira e os
números da frota ("17 lanchas de 23 a 37 pés"). Lancha escondida no painel vira 404. `lib/bb.php` lê o Supabase
com a service_role e guarda em `cache/` por 2 min (Supabase fora do ar: usa a última cópia; sem cópia, serve a
estática). `api/disponibilidade.php` entrega as datas ocupadas (passeios, agenda do dono, bloqueios) ao
calendário. **Mudou o HTML de lancha ou de card no gerador? Mude também `lib/lanchas.php` e rode
`php tools/conferir_php.php`** (compara as 19 páginas com a prévia). `tools/publicar.py` envia todo arquivo
versionado que mudou na cópia de trabalho, inclusive trabalho ainda não commitado de outra sessão.
Falta no PHP: fotos pelo painel, acessos da equipe, limpar o cache quando o painel salva.

**Leitor das agendas dos donos (23/11):** `lib/agenda.php` lê o iCal do Google Agenda (dia inteiro, horário, fuso,
RRULE, EXDATE, RECURRENCE-ID, cancelado) e a planilha publicada em CSV (linha com data = dia ocupado; duas datas =
período; "livre"/"cancelado" fora; link de edição ou pubhtml é convertido para CSV). Grava só o dia em
`bb_agenda_dono` pelas funções `bb_agenda_troca`/`bb_agenda_falha` (migração `2026-11-23-08-leitor-agendas.sql`,
que também tira a leitura do `bb_registro` e apaga os dias lidos quando o link muda; o que a equipe marcou à mão
nunca sai). Roda por `cron/agendas.php` (só CLI, cron do cPanel a cada 15 min; pasta `cron/` fechada no
`.htaccess`) e pelo botão "Ler agora" do painel (`api/agenda.php`, confere o token no Supabase e o papel dona/
atendente). Testes dos leitores: script no scratchpad da sessão (27 casos); refazer se mexer no `lib/agenda.php`.
**Cron instalado em 23/11** no crontab do usuário `barraboa` (o cPanel mostra em Cron Jobs):
`*/15 * * * * /usr/local/bin/php -q /home/barraboa/public_html/novo/cron/agendas.php > /dev/null 2>&1`.
No dia da troca para a raiz, mudar o caminho para `/home/barraboa/public_html/cron/agendas.php`.

**Clientes em tabela (23/11):** em Clientes, "Todos em tabela" junta os pedidos da mesma pessoa pelo WhatsApp
(sem WhatsApp, pelo e-mail): reservas, último/próximo passeio, total gasto, origem; toque abre o histórico; "Baixar
planilha" gera CSV (ponto e vírgula, BOM, sem os de exemplo, protegido contra fórmula). A ficha ganhou e-mail.

**Acessos de parceiro e marinheiro (23/11):** migração `2026-11-23-09-acessos.sql`. Mais > "Quem acessa o painel"
(só a dona): cria login pelo `api/equipe.php` (service_role; senha provisória mostrada uma vez, com mensagem pronta
para o WhatsApp), gera senha nova (só em login criado aqui: `app_metadata.bb_criado`) e tira o acesso (apaga a linha
em `bb_equipe`, o login fica, porque o projeto é compartilhado). Marinheiro vê "Seus passeios" (`bb_meus_passeios`)
e o Windguru. Parceiro vê a agenda das lanchas dele (`bb_agenda_parceiro`: lancha própria com hora/roteiro/pessoas,
de revenda só livre/ocupado), marca e libera dias da própria lancha (`bb_parceiro_marca_dia`, grava `manual`) e,
se vende, as comissões. Todos têm Conta (trocar senha). Parceiro e marinheiro continuam sem policy nas tabelas.

**Fotos pelo painel (24/11):** Lanchas > lancha > "Ver e mudar as fotos" (`#fotos/<id>`). O navegador reduz para JPEG
até 2400 px (rotação certa, funciona no iPhone); `api/fotos.php` recorta o quadrado e grava WebP 1400 e 480 (capa
900) em `fotos/lanchas/<slug>/` (fora do Git; `.htaccess` não executa código ali). Ordem, capa e apagar pelo painel;
a legenda segue a posição. Toda mudança limpa o cache do site (`acao: cache`, também ao salvar os dados da lancha).
**Na troca para a raiz, copiar a pasta `fotos/` de `/novo` para a raiz.** Foto com lado menor que 1400 px entra
como veio, com `melhorar: true` no JSON e o original em `fotos/lanchas/<slug>/orig/<nome>.jpg`.
**Falta:** script local que baixa os `orig/` pelo FTP, passa o Real-ESRGAN e sobe `<nome>-ia.webp`, e o cron que troca
a URL e tira o `melhorar`. O modelo ONNX precisa ser baixado de novo (as cópias nos scratchpads foram limpas):
guardar em `E:\Clientes\Barra Boat Floripa\Site\ferramentas\esrgan\`, fora do Git e fora de pasta temporária.

**Roteiros, perguntas e avaliações pelo painel (24/11):** Mais > Roteiros (paradas: nome, texto, foto 4:3 em
`fotos/roteiros/<slug>/`, ordem; regras, uma por linha) e Mais > Perguntas e avaliações. O PHP troca só esses trechos
(`lib/conteudo.php`, chamado por `bb_render` com `bb_conteudo()`): FAQ e avaliações da home (e o JSON-LD FAQPage),
paradas, regras (some o quadro sem regras; cria o quadro se a Costa ganhar regras) e itinerário do TouristTrip; a
amostra de 4 lanchas dos roteiros passou a sair das ativas. Sem linha no banco, vale o molde. Conteúdo inicial:
`python tools/extrair_conteudo.py` gera `supabase/seed/02-conteudo.sql` a partir do HTML (o conferidor usa o mesmo
JSON; 21 páginas iguais). Duração, distância e tempo de trajeto **não** são editáveis no painel: aparecem em até 22
páginas e ainda dependem das respostas da cliente; mudar no gerador. **Conteúdo editável no painel ainda não tem
tradução** (pensar nisso quando entrar o i18n).

**Ajustes da reunião de 19/11 (feitos em 20/11):** mês no cabeçalho da Agenda; "Próximos dias" (3 dias) na
tela Hoje; passeio muda de dia e de lancha (o pedido do cliente acompanha); botões "Mandar a reserva ao dono" e
"Mandar ao marinheiro" (wa.me com texto pronto, sem custo; o envio automático pela API, R$ 0,31 cada, fica para
depois do WhatsApp oficial); despesa "Outros" pede o quê e vira categoria nova; apagar lancha (com passeio no
histórico só esconde), parceiro e marinheiro; parceiro com lanchas em quadradinhos ("Lanchas dele" grava
`bb_lanchas.parceiro_id`, "Lanchas que ele vende" grava `bb_parceiro_lanchas`); Dinheiro por Mês, Semestre ou Ano.
Teste do painel sem login: `supabase-js` falso em memória com o playwright-core do cache do npx.
**Dados de exemplo x dados da Michele:** ela já vai cadastrar marinheiros, parceiros e clientes de verdade. O painel
mostra o selo "exemplo" nos registros fictícios (id `de300000-…` ou `origem_import = 'demo'`). Antes de lançar, rodar
`supabase/demo/apagar.sql`: apaga só os fictícios, as metas com `demo = true` (migração
`2026-11-20-07-metas-demo.sql`, **aplicar antes de publicar o painel**) e os testes da apresentação (listados por id).
O que ela lançar fica. O que ela anotar *dentro* de um registro de exemplo some junto.
**Ainda da reunião:** vídeo/GIF de como conectar o Google Agenda (para os donos); tabela de clientes com histórico;
foto antiga da Michele e do Neto para a página Sobre (ela envia); QR do Cadastur (ela envia); acessos de parceiro e
marinheiro; ajustar o site no celular (letra pequena).

**Pendências com a cliente:** CNPJ (Cadastur), tempos de trajeto do Campeche (30–40 / 45–60 min?),
duração da Costa da Lagoa (6 h ou 8 h?), My Nega 10 ou 11 passageiros, Phantom 30 BB 29 ou 30 pés.
