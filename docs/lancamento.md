# Troca do site: do WordPress para o site novo

O que já está pronto no código (25/11):
- No domínio oficial o `site.php` tira o noindex e põe o GTM-5FJVHJRJ e a verificação do Search Console
  (`bb_producao` em `lib/site.php`). Em novo. e no GitHub Pages continua noindex e sem GTM.
- `.htaccess`: https e sem www no domínio oficial; 301 dos endereços do WordPress que deixam de existir
  (/shop/, categorias, tags, pés/passageiro/valor, carrinho, /reembolso-ou-devolucoes/, sitemaps do Yoast).
  As 17 lanchas e as páginas mantêm o mesmo endereço.

## Antes do dia
1. Michele confere o site em novo.barraboatfloripa.com.br e o painel.
2. ~~Rodar `supabase/demo/apagar.sql`~~ rodado em 26/11 (conferido: nenhum registro de exemplo; ficam 3 clientes, 3 passeios,
   21 parceiros e 17 marinheiros reais).
3. Respostas pendentes da cliente que mudam texto (tempos do Campeche, duração da Costa, My Nega, Phantom 30 BB).
   Diária definida em 26/11: **7 horas, das 10h às 17h** (site, llms.txt e seed já trocados). Falta rodar
   `supabase/seed/04-ajustes-26-11.sql` (ficha do Campeche, pergunta do painel e itens da Phantom 30 BBF).
   A ficha da Costa da Lagoa segue com 6 horas: confirmar com a Michele.
4. ~~Rodar `supabase/migrations/2026-11-25-16-fichas-dos-roteiros.sql`~~ aplicada em 26/11 (conferido: os dois roteiros
   com as 4 fichas de hoje).
5. Depois do `apagar.sql`: as lanchas Phantom 29 My Girls e My Nega 30 (escondidas) ficam sem dono, porque estavam ligadas
   ao parceiro de exemplo. Se voltarem ao site, ligar ao parceiro certo em Parceiros. Os 3 clientes e 3 passeios reais
   (26 e 27/11) não dependem de nada de exemplo e ficam.
6. Itens repetidos da Phantom 30 BBF: saem no `04-ajustes-26-11.sql`. A Phantom 30 (outra) também tem "Cooler" e
   "Geladeira térmica": ver com a Michele.

Revisão geral de 26/11 (QA): 216 páginas (24 x 9 idiomas) com 200, um H1, canonical, hreflang e JSON-LD válidos, sem erro
de console, sem rolagem lateral; formulários, popup, calendário e seletor de idioma testados; painel com as 15 telas abrindo
no computador e no celular; arquivos sensíveis com 403; produção simulada (sem noindex, GTM uma vez, verificação na home).

## No dia
1. cPanel: backup do WordPress (Backup > baixar a pasta `public_html` e o banco do WP).
2. Mover os arquivos do WordPress da raiz para uma pasta fora da web (ex.: `/home/barraboa/wordpress-antigo/`).
   A pasta `novo/` fica onde está.
3. `BB_FTP_SENHA='...' python tools/publicar.py --producao`.
4. Pelo FTP/gerenciador: copiar `config.local.php` (já com a `ANTHROPIC_API_KEY`), `fotos/`, `midia/`, `traducoes/` (traduções que o cron fez) e `cron/bin/ffmpeg` (chmod 755)
   de `novo/` para a raiz.
5. Crons do cPanel: trocar `/public_html/novo/cron/` por `/public_html/cron/` nos três (agendas, vídeos e traduz).
6. Conferir (além do abaixo: `https://barraboatfloripa.com.br/novo/` deve redirecionar para a raiz, e `/sitemap.xml` listar
   216 endereços só com lanchas ativas):
   - `curl -I http://barraboatfloripa.com.br/` e `https://www.barraboatfloripa.com.br/` levam a `https://barraboatfloripa.com.br/` (301);
   - `curl -I https://barraboatfloripa.com.br/shop/` leva a `/lanchas/`;
   - home sem `noindex`, com `GTM-5FJVHJRJ` e `google-site-verification`; `X-Robots-Tag` ausente;
   - uma página de lancha, o calendário, o formulário que abre o WhatsApp;
   - login no painel em barraboatfloripa.com.br/painel/, foto e vídeo aparecendo.
7. GTM: modo de visualização na home.
8. Trocar a senha do FTP.

## Indexação (logo depois da troca)
O site entrega: `/sitemap.xml` (24 páginas x 9 idiomas, com hreflang, só lanchas ativas), `/robots.txt` (aponta o
sitemap; fecha /painel/, /api/ e /novo/), `/llms.txt` e `/llms-full.txt` (resumo e versão completa para as IAs, com os
números e as lanchas do banco), imagem de compartilhamento em JPEG 1200x630 (`/og/<foto>.jpg`, pelo `og.php`) e a
chave do IndexNow na raiz (`6bf75e866e649d7e10f128b1517138df.txt`, pública por desenho).

1. **Google Search Console** (a propriedade do domínio já existe e continua verificada pela meta tag na home):
   - Sitemaps: remover os do Yoast (`sitemap_index.xml`, `page-sitemap.xml`, `product-sitemap.xml`...) e enviar
     `https://barraboatfloripa.com.br/sitemap.xml`. Os antigos agora redirecionam para o novo, mas tirar evita aviso.
   - Inspeção de URL > "Solicitar indexação" (limite de uns 10 por dia): home, `/lanchas/`, `/ilha-do-campeche/`,
     `/costa-da-lagoa/`, `/roteiros/`, `/en/`, `/es/`. O resto vem pelo sitemap.
   - Testar no Teste de pesquisa aprimorada (search.google.com/test/rich-results): home (LocalBusiness, FAQPage),
     uma lancha (Service, BreadcrumbList), um roteiro (TouristTrip).
   - Em 3 a 7 dias: Páginas (indexadas x não indexadas; "Página com redirecionamento" das URLs antigas é normal),
     Melhorias (Breadcrumbs, FAQ), Experiência.
2. **Bing Webmaster Tools** (bing.com/webmasters, entrar com a conta Google): "Importar do Google Search Console"
   traz o site já verificado e os sitemaps. Se não vier, adicionar o site e enviar o sitemap à mão.
   Depois rodar `python tools/indexnow.py` (manda as 216 URLs para Bing, Yandex, Seznam e Naver pelo IndexNow; responde
   200 ou 202). O Bing alimenta também o ChatGPT (busca), o Copilot e o DuckDuckGo. Mudou uma lancha ou texto?
   `python tools/indexnow.py /lanchas/<slug>/` avisa só aquela página nos 9 idiomas.
3. **Perfil da empresa no Google** (Google Meu Negócio): conferir que o site é `https://barraboatfloripa.com.br/`, o
   telefone (48) 99115-3172 e o endereço Rod. Jorn. Manoel de Menezes, 3007, iguais ao site (o JSON-LD da home aponta
   para o perfil pelo Place ID).
4. Compartilhar o link da home e de uma lancha no WhatsApp para ver a prévia (foto, título e descrição). Se aparecer a
   prévia antiga, o Facebook guarda cache: developers.facebook.com/tools/debug > "Extrair novamente".
5. Depois de tudo indexado (umas 2 semanas): apagar o subdomínio `novo.` no cPanel ou deixá-lo como está (tem noindex).
