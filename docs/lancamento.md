# Troca do site: do WordPress para o site novo

O que já está pronto no código (25/11):
- No domínio oficial o `site.php` tira o noindex e põe o GTM-5FJVHJRJ e a verificação do Search Console
  (`bb_producao` em `lib/site.php`). Em novo. e no GitHub Pages continua noindex e sem GTM.
- `.htaccess`: https e sem www no domínio oficial; 301 dos endereços do WordPress que deixam de existir
  (/shop/, categorias, tags, pés/passageiro/valor, carrinho, /reembolso-ou-devolucoes/, sitemaps do Yoast).
  As 17 lanchas e as páginas mantêm o mesmo endereço.

## Antes do dia
1. Michele confere o site em novo.barraboatfloripa.com.br e o painel.
2. Rodar `supabase/demo/apagar.sql` no SQL Editor (apaga clientes, passeios, despesas e metas de exemplo;
   sem isso os passeios de exemplo aparecem como dias ocupados no calendário do site).
3. Respostas pendentes da cliente que mudam texto (tempos do Campeche, duração da Costa, My Nega, Phantom 30 BB).
4. Rodar `supabase/migrations/2026-11-25-16-fichas-dos-roteiros.sql` (cartões dos roteiros editáveis; sem ela o painel
   não salva os cartões, o site segue com os de hoje). Conferido em 26/11: ainda não aplicada.
5. Depois do `apagar.sql`: as lanchas Phantom 29 My Girls e My Nega 30 (escondidas) ficam sem dono, porque estavam ligadas
   ao parceiro de exemplo. Se voltarem ao site, ligar ao parceiro certo em Parceiros. Os 3 clientes e 3 passeios reais
   (26 e 27/11) não dependem de nada de exemplo e ficam.
6. Michele: itens a bordo repetidos na Phantom 30 BBF ("Cooler" e "Geladeira térmica", "Prancha stand up" e "Stand Up*").

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
7. Search Console: enviar `https://barraboatfloripa.com.br/sitemap.xml`. GTM: modo de visualização na home.
8. Trocar a senha do FTP.
