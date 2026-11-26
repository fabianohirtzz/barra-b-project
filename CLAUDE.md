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
- **Deploy:** `python tools/publicar.py` (senha em `E:\Clientes\Barra Boat Floripa\Site\ferramentas\ftp-senha.txt`, fora do repo, ou `BB_FTP_SENHA`) (FTPS em `ftp.barraboatfloripa.com.br`;
  envia só o que mudou, guardado em `.publicado.json`; reconecta quando a ErêHost derruba a sessão).
  **A raiz do FTP é o WordPress em produção:** o padrão é `/novo` e a raiz só com `--producao`,
  no dia da troca. A senha nunca entra no repositório nem no servidor.

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
**Melhoria com IA (25/11, feita):** `BB_FTP_SENHA='...' python tools/melhorar_fotos.py` (`--listar` só mostra a fila)
baixa os `orig/` pelo FTP, roda o Real-ESRGAN (`tools/esrgan.py`; entrada até 560 px, 4x, saída 1400) e sobe
`<nome>-ia.webp` e `-ia-p.webp`. O `cron/videos.php` (5 min) chama `lib/fotos_ia.php`: troca a URL no banco, tira o
`melhorar`, refaz a capa se for a primeira e apaga a versão pequena e o original. Modelo **v0.67.0** em
`E:\Clientes\Barra Boat Floripa\Site\ferramentas\esrgan\` (fora do Git; ~1 min por foto). Primeira rodada: 5 fotos da
Phantom 30 BB (562 a 1085 px). O painel relê as fotos antes de gravar, para não voltar a URL antiga.
**Menu do painel (25/11, aprovado pelo Fabiano):** a aba "Mais" saiu. Menu lateral por categoria (sem título: Hoje,
Agenda; Vendas: Clientes, Dinheiro; Frota e equipe: Lanchas, Parceiros, Marinheiros; Site: Roteiros, Perguntas e
avaliações, Vídeos do Instagram; WhatsApp: Robô e Mensagens em massa, "em breve"; rodapé fixo: Quem acessa o painel,
Sua conta, Sair). Fixo no computador (264 px); no celular a barra de baixo tem Hoje, Agenda, Clientes, Dinheiro e
Menu, que abre o mesmo menu deslizando. Papéis: `entra()` monta a lista de `data-nav` por papel e `arrumaGrupos()`
esconde categoria vazia; `marcaMenu()` destaca o item (e "Menu" na barra quando a página só está no menu).
**Tela de fotos (25/11, pedido da Michele):** arrastar para ordenar (mouse; no celular segurar 250 ms e arrastar;
Alt+setas no teclado), caixa de seleção para apagar em massa, a **primeira foto é sempre a capa** (refeita quando muda).

**Roteiros, perguntas e avaliações pelo painel (24/11):** Mais > Roteiros (paradas: nome, texto, foto 4:3 em
`fotos/roteiros/<slug>/`, ordem; regras, uma por linha) e Mais > Perguntas e avaliações. O PHP troca só esses trechos
(`lib/conteudo.php`, chamado por `bb_render` com `bb_conteudo()`): FAQ e avaliações da home (e o JSON-LD FAQPage),
paradas, regras (some o quadro sem regras; cria o quadro se a Costa ganhar regras) e itinerário do TouristTrip; a
amostra de 4 lanchas dos roteiros passou a sair das ativas. Sem linha no banco, vale o molde. Conteúdo inicial:
`python tools/extrair_conteudo.py` gera `supabase/seed/02-conteudo.sql` a partir do HTML (o conferidor usa o mesmo
JSON; hoje 22 páginas iguais). Os **cartões** do roteiro (distância, trajeto, diária, saída) são editáveis no painel
(`bb_roteiros.fichas`, migração `2026-11-25-16-fichas-dos-roteiros.sql`; lista única `FICHAS` no gerador; o PHP troca a capa do
roteiro, a comparação de /roteiros/ e o card da home, que mostra só as 3 primeiras). Texto corrido com esses números (descrições
para o Google, JSON-LD do Campeche, topo de /roteiros/) continua fixo: mudar no gerador. **Conteúdo editável no painel ainda não tem
tradução** (pensar nisso quando entrar o i18n).

**Vídeos do Instagram pelo painel (25/11):** Mais > Vídeos do Instagram. `api/videos.php` guarda o arquivo como veio
(MP4/MOV/WebM, até 400 MB) em `midia/instagram/fila/` (403 pela web) e o painel grava a linha com `pronto = false`
(migração `2026-11-25-11-instagram.sql`: legenda, pronto, erro, largura, altura). `cron/videos.php` (a cada 5 min,
**instalado em 25/11**: `*/5 * * * * /usr/local/bin/php -q /home/barraboa/public_html/novo/cron/videos.php`) usa
`lib/videos.php` + **ffmpeg 7.0.2 estático em `cron/bin/ffmpeg`** (fora do Git, enviado por FTP com chmod 755; cópia
local em `E:\Clientes\Barra Boat Floripa\Site\ferramentas\ffmpeg\`). A hospedagem limita processos paralelos: tudo
com `threads 1` (o x265 nem roda; ler HEVC do iPhone roda). Comprime até 1080 px de largura (H.264 CRF 23 + AAC,
faststart); se o original já é MP4 H.264 menor, só reorganiza. Gera a capa WebP 720 px e marca pronto. Testado no
servidor: MP4 leve (reorganizado, 23 s), HEVC 1080x1920 girado do iPhone (vira H.264 em pé, 21 s), alta qualidade
(10 MB para 584 KB). A home lê `bb_instagram` (ativos e prontos); vazio, vale o molde. Carga dos 7 vídeos de hoje:
`supabase/seed/03-instagram.sql` (gerado pelo `tools/extrair_conteudo.py`). **Na troca para a raiz: copiar
`midia/` e `cron/bin/ffmpeg`, e trocar o caminho dos dois crons.**
**Conferidor:** `php tools/conferir_php.php` compara 21 páginas e roda 11 testes de mudança (perguntas, regras,
paradas, vídeos, amostra de lanchas). Até 25/11 esses testes não rodavam por erro meu; agora rodam.

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
**Ainda da reunião:** vídeo/GIF de como conectar o Google Agenda (para os donos, fica para depois); foto antiga da
Michele e do Neto para a página Sobre (ela envia); QR do Cadastur (ela envia). Feitos em 23 a 25/11: tabela de clientes,
acessos de parceiro e marinheiro, letra do site no celular.
**Letra no celular (25/11):** bloco "letra no celular" no fim do `site.css` e do `paginas.css` (até 640 px): texto
corrido segue 17 px; selos sobre foto >= 13,5 px; rótulos, notas, itens a bordo, campos e rodapé >= 14 px. Em 360 px:
paradas do card de roteiro a 12,5 px (até 370 px), ficha da lancha com coluna que encolhe (sumiu a rolagem lateral de
39 px que já existia) e topo do calendário em duas linhas. Medição: script que lista todo texto visível < 15 px.

**Lançamento (25/11):** roteiro da troca em `docs/lancamento.md`. No domínio oficial o `site.php` tira o noindex e
põe o GTM-5FJVHJRJ e a verificação do Search Console (`bb_producao` em `lib/site.php`); em novo. e na prévia,
continua noindex e sem GTM. `.htaccess` força https sem www e faz 301 das URLs do WordPress que somem (lanchas
mantêm o endereço). Ícones das gavetas de escolha corrigidos (`.escolha span` pegava o `.linha__icone`); varredura
de ícones fora do centro: script no scratchpad (abre todas as telas e gavetas e mede).

**Agenda no parceiro e cadastro de lancha (25/11, pedido urgente):** o link da agenda saiu da lancha e foi para
o parceiro (migração `2026-11-25-12-agenda-do-parceiro.sql`: `bb_parceiros.agenda_tipo/url/lida_at/erro/sem_nome`,
`bb_lanchas.agenda_palavra`). Os parceiros anotam várias lanchas na mesma agenda: `lib/agenda.php` baixa uma vez e
reparte cada compromisso pela lancha cujo nome (ou `agenda_palavra`, separada por vírgula) está no **título**; sem
nome no título, procura na descrição; sem nome em nenhum, ocupa **todas** as lanchas dele (padrão) ou nenhuma.
Nome mais longo ganha ("Phantom 29 My Girls" não cai na "Phantom 29"). Parceiro com uma lancha: tudo é dela.
Cron e "Ler agora" (`api/agenda.php`, agora com `parceiro_id`) leem por parceiro. Testes: 27 antigos + 14 novos
(`teste-agenda-parceiro.php` no scratchpad). Painel: Parceiros > parceiro > "Agenda do <nome>" (conectar, ler,
instruções com "escreva o nome da lancha no título", regra do compromisso sem nome); a lancha mostra o nome que vale
na agenda (grava ao sair do campo). Lanchas > "Cadastrar lancha" (nome, pessoas, pés, região, de quem é, itens a
bordo); nasce escondida e só aparece no site com foto. A lancha também passou a editar região, itens e texto do site.
O que o parceiro faz: manda o link uma vez e escreve o nome da lancha no título de cada reserva.

**Embarque e passeio personalizado (25/11):** migração `2026-11-25-13-embarque-e-personalizado.sql`. Lancha tem local de
embarque (texto + link do Maps, opcionais), horário de embarque e marinheiro de sempre: viram sugestão ao marcar o
passeio, que guarda a própria cópia (muda só naquele passeio). Sem embarque na lancha vale o canal da Barra
(`EMBARQUE_PADRAO` no `app.js`). Roteiro "Personalizado" no painel (pedido do cliente, deslocamento sim/não, onde buscar,
valor do deslocamento cobrado do cliente, à parte do passeio: **ainda não entra no Dinheiro**). Mensagens (`textoPasseio`):
cliente (pt/es, com embarque, mapa, nome do marinheiro, valor e quanto falta; sem telefone do marinheiro), marinheiro e
dono (só o nome do cliente). Site: "Ainda não sei" virou "Personalizado" na home e no Contato, com "a lancha busca o grupo
em outro lugar?" e o pedido indo na mensagem do WhatsApp.

**Ajustes de 25/11 (noite, pedidos do Fabiano):**
- Painel, menu: Vendas = Clientes (tabela com filtros: passeio marcado, já reservaram, voltaram, nunca, "veio de"; "Exportar
  clientes"), **Funil de vendas** (`#funil`, as etapas) e **Relatórios** (era Dinheiro; `#dinheiro` ainda abre). Frota e equipe ganhou
  **Locais de embarque** (`#embarques`, tabela `bb_embarques`, migração `2026-11-25-14-locais-de-embarque.sql`; o primeiro da lista é o
  ponto de sempre). WhatsApp ganhou **Mensagens do passeio** (`#mensagens`): modelos com `{campos}` em `bb_wa_textos`
  (chave `passeio_cliente|marinheiro|parceiro|vendedor`, idioma pt/es); linha com campo vazio sai da mensagem; sem linha no banco vale
  `MSG_PADRAO` no `app.js`.
- Marcar passeio: busca de cliente pelo nome/WhatsApp (sem escolher, cadastra o nome digitado); "Cliente de parceiro" cria o pedido
  com `parceiro_id` do vendedor e `origem = 'parceiro'` (só o nome do cliente); marinheiro já ocupado no dia fica desabilitado com a
  lancha ao lado; local de embarque escolhido da lista traz o mapa. Botões: cliente, marinheiro, "Mandar ao parceiro" (dono) e, se
  outro parceiro vendeu, "Mandar ao parceiro que vendeu".
- Roteiros: "Cadastrar roteiro" abre a página inteira como rascunho (`#roteiro/novo`, só no navegador: nome, resumo,
  paradas com foto guardada no navegador, regras); nada grava até "Cadastrar roteiro" no fim, que cria o roteiro e sobe as fotos.
  Rascunho abandonado continua ao voltar; "Descartar" apaga. Roteiro sem página no site edita nome e resumo. Também desativar (`ativo`) e apagar (só se nenhum passeio/cliente usou; o banco faria set null). Roteiro novo existe só
  no painel: **ainda não ganha página no site** (só Ilha do Campeche e Costa da Lagoa têm página, `ROTEIRO_COM_PAGINA`).
- Botões de apagar em vermelho claro (`botao--perigo-leve`). Fotos: arraste não deixa mais o fantasma na tela (pointerup na janela,
  `buttons === 0`) e a grade trava enquanto grava.
- Leitor das agendas: nome aproximado também vale (`bb_agenda_acha_perto`: sem espaços, 1 erro de digitação a cada 8 letras, no
  máximo 2, números nunca trocam; nomes com menos de 6 letras só valem exatos). Testes: `teste-perto.php` no scratchpad.
- Site: faixa azul clara com borda em onda nas seções pares (`main > section.secao:nth-of-type(even)`, sem `.chamada`; seção nova
  muda quais ficam com faixa); /lanchas/ sem "saindo da Barra da Lagoa"; filtro "11 ou mais"; /roteiros/ com seção "Roteiro
  personalizado" (`contato/?roteiro=personalizado` abre o formulário com Personalizado); /sobre/ com o número da frota do banco
  (`<b data-frota-n>`); /contato/ "Sede e embarque" reescrito; cabeçalho fica sólido antes de o texto da capa encostar no logo.

**Cadastro do cliente (25/11):** em Clientes, tocar na pessoa abre "Dados do cliente" (nome, WhatsApp, e-mail, idioma das mensagens,
CPF e nascimento opcionais, documento estrangeiro opcional: tipo, número, país). Grava em todos os pedidos da pessoa (`bb_leads`,
migração `2026-11-25-15-documentos-do-cliente.sql`: `cpf` só dígitos com DV conferido no painel, `doc_tipo/doc_numero/doc_pais`,
`nascimento`). O painel lê `bb_leads` com `select('*')` e só mostra os campos de documento depois da migração (`temDocs()`).
A ficha do pedido tem o atalho "Cadastro do cliente"; a tabela tem a coluna Documento e a planilha exporta os documentos.

**Relatórios ampliados (25/11):** Resumo ganhou Caixa (recebido no período por `bb_recebimentos.recebido_em`, passeios feitos
com saldo e a lista de quem deve, a receber dos próximos, comissões `a_pagar` de `bb_comissoes`; deslocamentos aparecem à parte,
fora do bruto), já vendido nos próximos 3 meses, funil do período e motivos de perda, vendas por lancha (próprias x parceiros),
por roteiro, por canal, perfil dos grupos (tamanho, antecedência, quem voltou) e dias da semana. Despesas ganhou cartões (gasto
x ano anterior, por passeio, peso no faturamento, contas fixas por mês), gráfico mês a mês, categorias com variação contra o
período anterior, por lancha, **Contas fixas** (`bb_despesas_fixas`: cadastrar, encerrar, apagar; "Anotar <mês>" cria a despesa
com `fixa_id` e `mes_ref`; aviso das pendentes do mês) e filtro por categoria. Exemplos: `supabase/demo/relatorios.sql` (contas
fixas, as despesas delas e deslocamentos em passeios de exemplo); o `apagar.sql` já tira.
**WhatsApp com país (25/11):** todo campo de WhatsApp do painel (cliente, cadastro, pedido, marcar passeio, parceiro,
marinheiro) usa `campoFone()` no `app.js`: botão com sigla e código (+55), lista de 192 países com busca por nome, sigla ou
código (os 12 mais comuns no topo), número sem o código. Colar com + ou 00 reconhece o país. Grava em E.164 (`leFone`);
Brasil exige DDD + número (máscara), fora do Brasil 6 a 15 dígitos no total.
**Cartões dos roteiros:** editáveis no painel (até 4 pares título/valor em `bb_roteiros.fichas`); vazio = molde do site.

**Popup de reserva (25/11, até o robô de atendimento):** todo botão de WhatsApp do site abre o popup de reserva (`[data-reserva]`,
no fim do `index.html`, copiado pelo gerador): roteiro (com o bloco do Personalizado), lancha, data, pessoas; ao enviar abre o
wa.me com a mensagem. Pega `[data-wa]`, `[data-agenda-cta]` e `a.botao` com wa.me; o href continua (sem JS ou Ctrl+clique vai
direto). Link que deve ir direto ao WhatsApp: `data-wa-direto` (número do rodapé, links nas políticas). Pré-preenche pela página
(lancha e dia do calendário, roteiro) ou por `data-reserva-lancha` / `data-reserva-roteiro`. Hero e popup usam `montaPlanejador()`
no `site.js`; evento `abre_reserva` no GTM. O PHP troca as opções de todo `<select name="lancha" data-lancha>` (`bb_opcoes_form`);
o select do popup mantém o recuo do da capa (opções com 14 espaços, `</select>` com 12). Seletor personalizado `montaSeletor()`
(`.planejar__select select` e `.campo select`): o `<select>` nativo fica escondido como fonte do valor; mudar por código exige
disparar `change`. Saiu o botão "Ver mais no Instagram"; a frase dos vídeos fica em uma linha a partir de 900 px.

**Site em 9 idiomas (25/11):** pt + es, en, fr, de, it, nl, ja, zh (URL `/es/...`, `/zh/...`; hreflang `zh-Hans`). O gerador e o
painel continuam só em português: o `site.php` monta a página em português e `lib/i18n.php` (`bb_traduz_pagina`) troca cada trecho
no fim. Trecho = texto de um bloco com as marcas inline viradas etiquetas (`<a1>`, `</a1>`, `<br2/>`), chave igual em qualquer
profundidade; também alt, title, aria-label, placeholder, metas, JSON-LD (campos de texto; URLs ganham o prefixo) e o texto dos
links wa.me. `translate="no"` numa marca deixa tudo dentro como está (seletor de idioma). Traduções: `i18n/<idioma>.json` (Git,
revisável; chave = texto em português) e `traducoes/<idioma>.json` (servidor, fora do Git). Trecho sem tradução sai em português e
entra em `traducoes/faltam.json`; o **cron `cron/traduz.php` (a cada 15 min, instalado em 25/11)** traduz pela API do Claude
(`lib/claude.php`, `claude-opus-5-5`, curl direto, chave `ANTHROPIC_API_KEY` no `config.local.php` de `/novo`, hoje a mesma do Tô
Hospedando). Mudou texto no gerador ou no JS? `ANTHROPIC_API_KEY=... php tools/i18n.php` traduz só o que falta (`--listar` conta,
`--limpar` tira chaves velhas). JavaScript: textos em `T('...', {campos})` (cada arquivo de assets/js define `T`); o PHP põe
`window.BB_T` na página. Mensagem do WhatsApp sai no idioma do visitante + `[Resumo em português]` para a equipe. Calendário usa
`Intl` fora do português. Seletor no cabeçalho (`[data-idioma]`, links montados por `bb_i18n_seletor`) e sugestão discreta para
quem tem o navegador em outro idioma (lembra a escolha em `localStorage.bb_idioma`). Políticas e avaliações traduzidas ganham aviso
de tradução automática. Sitemap lista as 26 páginas x 9 idiomas com `xhtml:link`. Teste local: `php -S` com um roteador que imita o
`.htaccess` (scratchpad da sessão). **Na troca para a raiz: copiar `traducoes/` e trocar o caminho do cron.**

**Pendências com a cliente:** CNPJ (Cadastur), tempos de trajeto do Campeche (30–40 / 45–60 min?),
duração da Costa da Lagoa (6 h ou 8 h?), My Nega 10 ou 11 passageiros, Phantom 30 BB 29 ou 30 pés.
