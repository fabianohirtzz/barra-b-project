"""Gera as páginas internas da prévia estática a partir do index.html.

Cabeçalho, menu, rodapé e ícones saem do index.html (fonte única); os caminhos relativos
ganham o prefixo certo para cada profundidade de pasta. Na produção (ErêHost) o PHP vai
renderizar estas mesmas páginas com dados do Supabase; este script serve a prévia.

Rodar:  python tools/gerar_paginas.py
"""
import os, re, json, html, unicodedata, random, datetime, urllib.parse

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOM = 'https://barraboatfloripa.com.br/'
WA = '5548991153172'
INDEX = open(os.path.join(PROJ, 'index.html'), encoding='utf-8').read()
L_JSON = {l['slug']: l for l in json.load(open(os.path.join(PROJ, 'docs/conteudo-site-atual/lanchas.json'), encoding='utf-8'))}
IMGS = json.load(open(os.path.join(PROJ, 'tools/imagens.json'), encoding='utf-8'))
V_CSS, V_JS = '21', '15'
e = html.escape


# ---------------------------------------------------------------- partes do index
def corta(ini, fim):
    a = INDEX.index(ini)
    b = INDEX.index(fim, a)
    return INDEX[a:b]

SPRITE = corta('<svg class="sprite"', '<!-- ===================== CABEÇALHO')  if '<!-- ===================== CABEÇALHO' in INDEX else None
if SPRITE is None:
    a = INDEX.index('<svg class="sprite"'); b = INDEX.index('</svg>\n', INDEX.index('<symbol id="i-google"')) + 6
    SPRITE = INDEX[a:b]
TOPO = INDEX[INDEX.index('<header class="topo"'):INDEX.index('</header>') + 9]
MENU = corta('<!-- ===================== MENU', '<main id="conteudo">')
RODAPE = corta('<!-- ===================== RODAPÉ', '<script src="assets/js/site.js')

# cards de lancha da home: fonte dos nomes curtos, pessoas, pés, região e itens
CARDS = {}
for m in re.finditer(r'<li class="lancha" data-pax="(\d+)">\s*<a class="lancha__link" href="lanchas/([^/]+)/">.*?</li>\s*</ul>\s*</a>\s*</li>', INDEX, re.S):
    bloco = m.group(0)
    CARDS[m.group(2)] = {
        'slug': m.group(2), 'pax': int(m.group(1)), 'html': bloco,
        'nome': re.search(r'<span class="lancha__nome">(.*?)</span>', bloco).group(1),
        'pes': re.search(r'(\d+(?:[.,]\d+)?) pés', bloco).group(1),
        'regiao': re.search(r'<span class="lancha__regiao">(.*?)</span>', bloco).group(1),
    }
ORDEM = list(CARDS)  # mesma ordem da home (mais pessoas primeiro)
assert len(CARDS) == 17, len(CARDS)


def prefixa(trecho, pre):
    """Corrige caminhos relativos para a profundidade da página."""
    def troca(m):
        attr, q, url = m.group(1), m.group(2), m.group(3)
        if re.match(r'(https?:|mailto:|tel:|data:|//|#i-|#conteudo)', url):
            return m.group(0)
        if url.startswith('#'):
            return f'{attr}={q}{pre or "./"}{url}{q}'
        if url in ('./', '.'):
            url = ''
        return f'{attr}={q}{pre}{url}{q}' if (pre + url) else f'{attr}={q}./{q}'
    trecho = re.sub(r'\b(href|src|poster|data-fonte|data-pasta)=(["\'])([^"\']*)\2', troca, trecho)
    trecho = re.sub(r'srcset="([^"]*)"', lambda m: 'srcset="' + ', '.join(pre + p.strip() for p in m.group(1).split(',')) + '"', trecho)
    return trecho


def menu_atual(trecho, caminho):
    trecho = trecho.replace(' aria-current="page"', '')
    alvo = {'': './', 'lanchas/': 'lanchas/', 'roteiros/': 'roteiros/', 'ilha-do-campeche/': 'roteiros/', 'costa-da-lagoa/': 'roteiros/', 'sobre/': 'sobre/', 'contato/': 'contato/'}
    raiz = caminho.split('/')[0] + '/' if caminho else ''
    if raiz in alvo:
        trecho = trecho.replace(f'<a href="{alvo[raiz]}">', f'<a href="{alvo[raiz]}" aria-current="page">', 1)
    return trecho


def og_url(foto):
    """Imagem de compartilhamento: o og.php do servidor entrega a foto em JPEG 1200x630 (/og/<foto>.jpg)."""
    return DOM + 'og/' + re.sub(r'\.(webp|jpg)(\?.*)?$', '', foto) + '.jpg'


def pagina(caminho, titulo, descricao, corpo, ld=None, og_img='assets/img/fotos/hero.webp', css_extra='', js_extra='', preload=''):
    prof = caminho.count('/')
    pre = '../' * prof
    ld_txt = ''
    if ld:
        ld_txt = '\n  <script type="application/ld+json">\n  ' + json.dumps({'@context': 'https://schema.org', '@graph': ld}, ensure_ascii=False, indent=1).replace('\n', '\n  ') + '\n  </script>'
    head = f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(titulo)}</title>
  <meta name="description" content="{e(descricao)}">
  <!-- PRÉVIA: remover o noindex na virada para a ErêHost -->
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="{DOM}{caminho}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Barra Boat Floripa">
  <meta property="og:title" content="{e(titulo)}">
  <meta property="og:description" content="{e(descricao)}">
  <meta property="og:url" content="{DOM}{caminho}">
  <meta property="og:image" content="{og_url(og_img)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#083359">
  <link rel="icon" href="{pre}favicon.ico" sizes="any">
  <link rel="icon" type="image/png" href="{pre}assets/img/marca/favicon.png">
  <link rel="apple-touch-icon" href="{pre}assets/img/marca/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,300..800;1,62..125,500..900&display=swap" rel="stylesheet">{preload}
  <link rel="stylesheet" href="{pre}assets/css/site.css?v={V_CSS}">
  <link rel="stylesheet" href="{pre}assets/css/paginas.css?v={V_CSS}">{css_extra}{ld_txt}
</head>
<body>
  <a class="pular" href="#conteudo">Pular para o conteúdo</a>
  <canvas class="mar" aria-hidden="true"></canvas>

  '''
    partes = SPRITE + '\n\n  ' + TOPO + '\n\n  ' + menu_atual(MENU, caminho)
    final = '\n  </main>\n\n  ' + RODAPE
    scripts = f'  <script src="{pre}assets/js/site.js?v={V_JS}" defer></script>{js_extra}\n</body>\n</html>\n'
    doc = head + prefixa(partes, pre) + '<main id="conteudo">\n' + prefixa(corpo, pre) + prefixa(final, pre) + scripts.replace('{pre}', pre)
    destino = os.path.join(PROJ, caminho, 'index.html') if caminho else os.path.join(PROJ, 'index.html')
    if caminho.endswith('.html'):
        destino = os.path.join(PROJ, caminho)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    open(destino, 'w', encoding='utf-8').write(doc)
    return destino


# ---------------------------------------------------------------- blocos comuns
def migalhas(itens):
    """itens: [(nome, caminho_ou_None)] -> breadcrumb visível + JSON-LD"""
    lis = []
    for nome, url in itens:
        lis.append(f'<li><a href="{url}">{e(nome)}</a></li>' if url is not None else f'<li aria-current="page">{e(nome)}</li>')
    vis = '<nav class="migalhas" aria-label="Você está em"><ol>' + ''.join(lis) + '</ol></nav>'
    ld = {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, **({'item': DOM + (u if u not in ('./', None) else '')} if u is not None else {})}
        for i, (n, u) in enumerate(itens)]}
    return vis, ld


def capa_foto(nome_img, alt, titulo, texto, migs, dados='', extra=''):
    return f'''    <header class="capa capa--foto">
      <picture class="capa__foto">
        <source media="(max-width: 700px)" srcset="assets/img/capas/{nome_img}-mobile.webp">
        <img src="assets/img/capas/{nome_img}.webp" alt="{e(alt)}" width="2400" height="1800" fetchpriority="high">
      </picture>
      <div class="capa__conteudo">
        {migs}
        <h1 class="capa__titulo">{titulo}</h1>
        <p class="capa__texto">{texto}</p>{dados}{extra}
      </div>
    </header>
'''


def capa_faixa(titulo, texto, migs, extra=''):
    return f'''    <header class="capa capa--faixa">
      <div class="capa__conteudo">
        {migs}
        <h1 class="capa__titulo">{titulo}</h1>
        <p class="capa__texto">{texto}</p>{extra}
      </div>
    </header>
'''


def chamada(titulo, texto, botao, wa_texto):
    return f'''    <section class="secao">
      <div class="chamada">
        <div>
          <h2 class="chamada__titulo">{titulo}</h2>
          <p>{texto}</p>
        </div>
        <a class="botao botao--claro botao--grande" data-wa data-wa-texto="{e(wa_texto)}" href="https://wa.me/{WA}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-wa"/></svg><span>{botao}</span></a>
      </div>
    </section>
'''


def grade_lanchas(slugs, cabecalho=''):
    cards = '\n'.join('          ' + CARDS[s]['html'] for s in slugs)
    return f'''          <ul class="grade-lanchas" data-grade-lanchas>
{cards}
          </ul>'''


ATUAL = ' aria-current="true"'

# ---------------------------------------------------------------- itens a bordo
def sem_acento(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')

# A ordem importa: a primeira regra que casar define o ícone (ex.: "Banheiro com ducha" é banheiro).
ICONE = [(r'cabin|cabine|quarto|cama', 'cabine'), (r'banheiro|vaso', 'banheiro'),
         (r'^carvao', 'fogo'), (r'churras', 'grelha'),
         (r'\bsom\b|bluetooth|jbl', 'som'), (r'tapete', 'tapete'), (r'stand ?up|padle|paddle', 'standup'),
         (r'geladeira|cooler|geleira|frigobar', 'gelo'), (r'ducha|chuveiro', 'ducha'), (r'toldo|fechamento', 'toldo'),
         (r'mergulho|mascara', 'mergulho'), (r'cafeteira', 'cafe'), (r'\bpia\b', 'pia'), (r'\bmesa\b', 'mesa'),
         (r'louca|tacas|copos|cristaleira', 'taca'), (r'gourmet', 'talher'),
         (r'colete', 'colete'), (r'extintor', 'extintor'), (r'socorro', 'socorro'), (r'pirotecnico', 'sinalizador'),
         (r'salvatagem|boia circular', 'boia'), (r'boia|espaguete|macarrao|splash', 'espaguete'),
         (r'carregador', 'carregador'), (r'ilumina|\bluz\b', 'luz'), (r'piso', 'piso'), (r'porta objetos', 'gaveta'),
         (r'solari|chaise|estofad|estofamento', 'solario'), (r'\bfly\b', 'escada'),
         (r'deck|popa|proa|cockpit', 'conves'), (r'^agua$', 'agua'), (r'motor', 'helice'),
         (r'gps|sonda|radio|vhf', 'sonda'), (r'gerador', 'energia')]
FORA = r'^(passageiros:?|itens:?|incluso:?|lancha phantom|\d+ passageiros|\d+ ?p[eé]s|\*?kit (diversao|de seguranca)\*?|oferecemos agua e frutas a bordo!?)$'


# Itens que estavam só na descrição longa do site antigo (e no card da home), não na lista curta.
ITENS_EXTRA = {'phantom-30': ['Tapete flutuante', 'Stand up'], 'phantom-29-my-girl': ['Tapete flutuante']}


def itens_de(slug):
    l = L_JSON[slug]
    vistos, saida = set(), []
    for bruto in l['descricao_curta_itens'] + ITENS_EXTRA.get(slug, []):
        t = re.sub(r'^[\s*•\-–]+|\*+$', '', bruto).strip().rstrip('.')
        if not t:
            continue
        k = sem_acento(t)
        if re.match(FORA, k) or re.search(r'passageir|marinheiro|combustivel|^\d+ ?(ilha|costa)|^phantom \d|^\d+ pes|cabrasmar|top line', k):
            continue
        if k in vistos:
            continue
        vistos.add(k)
        t = t[0].upper() + t[1:]
        t = t.replace('Padle', 'Paddle').replace('Socorro', 'Socorros').replace('Standup', 'Stand up').replace('E.V.A', 'EVA')
        icone = next((i for rx, i in ICONE if re.search(rx, k)), 'lancha')
        saida.append((icone, t))
    return saida


# ---------------------------------------------------------------- disponibilidade (exemplo da prévia)
def disponibilidade_exemplo():
    """Na produção o calendário lê as datas ocupadas do painel (Supabase).
    Na prévia geramos datas de exemplo, sempre as mesmas, só para mostrar o funcionamento."""
    hoje = datetime.date(2026, 11, 16)
    dados = {}
    for s in ORDEM:
        rnd = random.Random(s)
        ocup = set()
        for d in range(1, 90):
            dia = hoje + datetime.timedelta(days=d)
            chance = .42 if dia.weekday() >= 5 else .14
            if dia.month in (12, 1, 2):
                chance += .2
            if rnd.random() < chance:
                ocup.add(dia.isoformat())
        dados[s] = sorted(ocup)
    os.makedirs(os.path.join(PROJ, 'assets/data'), exist_ok=True)
    json.dump({'exemplo': True, 'aviso': 'Datas de exemplo da prévia. Na produção vêm do painel.', 'gerado': hoje.isoformat(), 'ocupadas': dados},
              open(os.path.join(PROJ, 'assets/data/disponibilidade.json'), 'w', encoding='utf-8'), ensure_ascii=False)


# ================================================================ PÁGINAS
gerados = []
EMPRESA_REF = {'@id': DOM + '#empresa'}

# ---------------------------------------------------------------- /lanchas/
migs, ld_m = migalhas([('Início', './'), ('Lanchas', None)])
corpo = capa_faixa('Aluguel de lancha em Florianópolis: escolha a sua',
                   '17 lanchas privativas de 23 a 37 pés, para grupos de 7 a 13 pessoas. Todas com marinheiro e combustível do roteiro inclusos. Escolha a lancha que mais combina com o seu dia de diversão!',
                   migs) + f'''
    <section class="secao" aria-labelledby="frota-titulo">
      <div class="secao__cabeca secao__cabeca--linha">
        <div>
          <h2 id="frota-titulo" class="titulo">A frota</h2>
          <p class="secao__intro"><span data-contagem>17 lanchas</span>. Escolha pelo tamanho do grupo: criança de qualquer idade conta como passageiro.</p>
        </div>
        <div class="filtro" role="group" aria-label="Filtrar por número de pessoas" data-filtro>
          <button type="button" aria-pressed="true" data-pax="0">Todas</button>
          <button type="button" aria-pressed="false" data-pax="7">Até 7</button>
          <button type="button" aria-pressed="false" data-pax="10">8 a 10</button>
          <button type="button" aria-pressed="false" data-pax="13">11 ou mais</button>
        </div>
      </div>
{grade_lanchas(ORDEM)}
    </section>

    <section class="secao" aria-labelledby="como-escolher">
      <div class="duas-colunas">
        <div>
          <h2 id="como-escolher" class="titulo">Como escolher a lancha</h2>
          <p class="secao__intro">Três perguntas resolvem quase tudo.</p>
        </div>
        <ol class="lista-passos">
          <li><b>Quantas pessoas vão?</b><span>Conte todo mundo, inclusive crianças e bebês. A lancha nunca leva mais gente do que a capacidade permite.</span></li>
          <li><b>Precisa de cabine e banheiro?</b><span>Para grupos com crianças ou para quem passa o dia inteiro a bordo, prefira lanchas cabinadas com banheiro.</span></li>
          <li><b>Qual roteiro?</b><span>A Ilha do Campeche é em mar aberto, com 30 a 40 minutos de navegação por trajeto. A Costa da Lagoa é em águas calmas, dentro da Lagoa da Conceição.</span></li>
        </ol>
      </div>
    </section>
'''
ld = [ld_m, {'@type': 'ItemList', 'name': 'Lanchas para aluguel em Florianópolis', 'numberOfItems': 17,
             'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'url': f'{DOM}lanchas/{s}/', 'name': CARDS[s]['nome']} for i, s in enumerate(ORDEM)]}]
gerados.append(pagina('lanchas/', 'Lanchas para alugar em Florianópolis | Barra Boat Floripa',
                      'Escolha entre 17 lanchas privativas de 23 a 37 pés, para 7 a 13 pessoas, com marinheiro e combustível inclusos.', corpo, ld))

# ---------------------------------------------------------------- /lanchas/<slug>/
disponibilidade_exemplo()
for s in ORDEM:
    c = CARDS[s]
    nome, pax, pes, reg = c['nome'], c['pax'], c['pes'], c['regiao']
    fotos = IMGS['galerias'].get(s, [])
    itens = itens_de(s)
    migs, ld_m = migalhas([('Início', './'), ('Lanchas', 'lanchas/'), (nome, None)])
    norte = reg.startswith('Norte')
    intro = (f'A {nome} tem {pes} pés e leva até {pax} pessoas. A lancha é só do seu grupo, com marinheiro habilitado e o combustível do roteiro inclusos.'
             + (' Ela fica no Norte da Ilha, e o ponto de embarque é combinado na reserva.' if norte else ' O embarque é no Canal da Barra da Lagoa.'))
    principal = fotos[0] if fotos else {'n': 1, 'w': 900, 'h': 900}
    miniaturas = '\n'.join(
        f'            <li><button type="button" class="galeria__mini" data-foto="{f["n"]}" aria-label="Ver foto {f["n"]} de {len(fotos)}"{ATUAL if i == 0 else ""}><img src="assets/img/lanchas/{s}/{f["n"]:02d}-p.webp" alt="" width="160" height="120" loading="lazy"></button></li>'
        for i, f in enumerate(fotos))
    lista_itens = '\n'.join(f'          <li><svg aria-hidden="true"><use href="#i-{i}"/></svg>{e(t)}</li>' for i, t in itens)
    outras = [x for x in ORDEM if x != s]
    parecidas = sorted(outras, key=lambda x: (abs(CARDS[x]['pax'] - pax), ORDEM.index(x)))[:4]
    wa_texto = f'Olá! Vim pelo site da Barra Boat. Quero consultar a lancha {nome}.'
    corpo = f'''    <div class="lancha-pagina">
      {migs}
      <div class="lancha-topo">
        <section class="galeria" aria-label="Fotos da {e(nome)}" data-galeria data-pasta="assets/img/lanchas/{s}/" data-total="{len(fotos)}">
          <figure class="galeria__palco">
            <img src="assets/img/lanchas/{s}/{principal['n']:02d}.webp" alt="{e(nome)}, foto 1 de {len(fotos)}" width="{principal['w']}" height="{principal['h']}" fetchpriority="high" data-galeria-img>
            <button type="button" class="galeria__seta galeria__seta--volta" data-galeria-passo="-1" aria-label="Foto anterior"><svg aria-hidden="true"><use href="#i-seta"/></svg></button>
            <button type="button" class="galeria__seta" data-galeria-passo="1" aria-label="Próxima foto"><svg aria-hidden="true"><use href="#i-seta"/></svg></button>
            <figcaption class="galeria__conta" aria-live="polite"><span data-galeria-n>1</span> / {len(fotos)}</figcaption>
          </figure>
          <ul class="galeria__minis">
{miniaturas}
          </ul>
        </section>

        <aside class="ficha" aria-labelledby="lancha-nome">
          <p class="ficha__regiao">{e(reg)}</p>
          <h1 id="lancha-nome" class="ficha__nome">{e(nome)}</h1>
          <ul class="ficha__specs">
            <li><svg aria-hidden="true"><use href="#i-pessoas"/></svg><b>{pax}</b> pessoas</li>
            <li><svg aria-hidden="true"><use href="#i-regua"/></svg><b>{pes}</b> pés</li>
            <li><svg aria-hidden="true"><use href="#i-relogio"/></svg><b>7 h</b> de diária</li>
          </ul>
          <p class="ficha__intro">{intro}</p>

          <div class="agenda" data-agenda data-lancha="{s}" data-nome="{e(nome)}" data-fonte="assets/data/disponibilidade.json">
            <div class="agenda__topo">
              <h2 class="agenda__titulo">Datas livres</h2>
              <div class="agenda__nav">
                <button type="button" class="agenda__mes-btn agenda__mes-btn--volta" data-agenda-mes="-1" aria-label="Mês anterior"><svg aria-hidden="true"><use href="#i-seta"/></svg></button>
                <p class="agenda__mes" aria-live="polite" data-agenda-titulo></p>
                <button type="button" class="agenda__mes-btn" data-agenda-mes="1" aria-label="Próximo mês"><svg aria-hidden="true"><use href="#i-seta"/></svg></button>
              </div>
            </div>
            <div class="agenda__semana" aria-hidden="true"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
            <div class="agenda__dias" role="grid" data-agenda-dias></div>
            <ul class="agenda__legenda">
              <li><i class="agenda__marca agenda__marca--livre"></i>Livre</li>
              <li><i class="agenda__marca agenda__marca--ocupada"></i>Reservada</li>
              <li><i class="agenda__marca agenda__marca--escolhida"></i>Sua data</li>
            </ul>
            <p class="agenda__aviso" data-agenda-aviso hidden></p>
          </div>

          <a class="botao botao--mar botao--cheio botao--grande" href="https://wa.me/{WA}?text={e(wa_texto)}" target="_blank" rel="noopener" data-agenda-cta data-wa-base="{e(wa_texto)}"><svg aria-hidden="true"><use href="#i-wa"/></svg><span data-agenda-cta-txt>Consultar valores no WhatsApp</span></a>
          <p class="ficha__nota">Valor por lancha, não por pessoa. Você fala direto com a nossa equipe pelo WhatsApp.</p>
        </aside>
      </div>
    </div>

    <section class="secao" aria-labelledby="bordo-titulo">
      <div class="duas-colunas duas-colunas--topo">
        <div>
          <h2 id="bordo-titulo" class="titulo">O que tem a bordo</h2>
          <p class="secao__intro">Itens desta lancha, informados pelo dono. Marinheiro e combustível do roteiro já estão no valor.</p>
          <ul class="incluso-curto">
            <li><svg aria-hidden="true"><use href="#i-leme"/></svg>Marinheiro habilitado</li>
            <li><svg aria-hidden="true"><use href="#i-bomba"/></svg>Combustível do roteiro</li>
            <li><svg aria-hidden="true"><use href="#i-escudo"/></svg>Coletes e itens de segurança</li>
          </ul>
        </div>
        <ul class="bordo">
{lista_itens}
        </ul>
      </div>
    </section>

    <section class="secao" aria-labelledby="roteiros-titulo">
      <div class="secao__cabeca">
        <h2 id="roteiros-titulo" class="titulo">Para onde a {e(nome)} vai</h2>
        <p class="secao__intro">Os dois roteiros saem com a mesma lancha. A diária é de 7 horas, das 10h às 17h.</p>
      </div>
      <div class="mini-roteiros">
        <a class="mini-roteiro" href="ilha-do-campeche/">
          <img src="assets/img/paginas/sobre-06.webp" alt="Ilha do Campeche vista do alto, com lanchas ancoradas na água azul" width="1400" height="1050" loading="lazy">
          <span class="mini-roteiro__txt"><b>Ilha do Campeche</b><span>Mar aberto, 10,4 milhas, água cristalina</span></span>
        </a>
        <a class="mini-roteiro" href="costa-da-lagoa/">
          <img src="assets/img/fotos/costa-da-lagoa.webp" alt="Trapiche da Costa da Lagoa ao pôr do sol" width="1400" height="1050" loading="lazy">
          <span class="mini-roteiro__txt"><b>Costa da Lagoa</b><span>Águas calmas, cachoeira e restaurantes</span></span>
        </a>
      </div>
    </section>

    <section class="secao" aria-labelledby="outras-titulo">
      <div class="secao__cabeca secao__cabeca--linha">
        <div>
          <h2 id="outras-titulo" class="titulo">Lanchas para grupos parecidos</h2>
        </div>
        <a class="botao botao--contorno" href="lanchas/"><span>Ver as 17 lanchas</span><svg aria-hidden="true"><use href="#i-seta"/></svg></a>
      </div>
{grade_lanchas(parecidas)}
    </section>
'''
    # Service, não Product: sem preço no site, o Google acusaria erro em Product sem offers/review
    ld_prod = {'@type': 'Service', 'name': f'Aluguel da lancha {nome} em Florianópolis', 'serviceType': 'Aluguel de lancha com marinheiro',
               'description': intro, 'url': f'{DOM}lanchas/{s}/', 'image': [f'{DOM}assets/img/lanchas/{s}/{f["n"]:02d}.webp' for f in fotos[:6]],
               'provider': EMPRESA_REF, 'areaServed': 'Florianópolis, Santa Catarina'}
    gerados.append(pagina(f'lanchas/{s}/', f'{nome}, lancha para {pax} pessoas | Barra Boat Floripa',
                          f'Aluguel da lancha {nome}, {pes} pés, até {pax} pessoas, com marinheiro e combustível inclusos. Veja fotos, itens a bordo e as datas livres.',
                          corpo, [ld_m, ld_prod], og_img=f'assets/img/lanchas/{s}/01.webp',
                          js_extra=f'\n  <script src="{{pre}}assets/js/lancha.js?v=5" defer></script>'))

# Fichas de cada roteiro (os cartõezinhos de dados). Uma lista só por roteiro, até 4, editável no painel
# (bb_roteiros.fichas): a capa da página do roteiro e a comparação em /roteiros/ mostram todas; o card da
# home (index.html, editado à mão) mostra as 3 primeiras. Mudou aqui? Mude a home e lib/conteudo.php confere.
FICHAS = {
    'ilha-do-campeche': [('Distância', '10,4 milhas'), ('Cada trajeto', '30 a 40 min'), ('Diária', '7 horas'), ('Saída', 'Canal da Barra')],
    'costa-da-lagoa': [('Mar', 'Águas calmas'), ('Saída', 'Barra ou Lagoa'), ('Diária', '6 horas'), ('Paradas', '5')],
}


def fichas_comparar(slug):
    return '\n'.join(f'              <div><dt>{a}</dt><dd>{b}</dd></div>' for a, b in FICHAS[slug])


# ---------------------------------------------------------------- /roteiros/
migs, ld_m = migalhas([('Início', './'), ('Roteiros', None)])
corpo = capa_foto('roteiros', 'Lanchas ancoradas em frente a uma praia de areia branca, vistas de cima', 'Roteiros de lancha em Florianópolis',
                  'Dois passeios de dia inteiro saindo do Canal da Barra da Lagoa: mar aberto até a Ilha do Campeche ou águas calmas pela Costa da Lagoa. Ou um roteiro personalizado, do seu jeito.', migs) + '''
    <section class="secao" aria-labelledby="comparar-titulo">
      <div class="secao__cabeca">
        <h2 id="comparar-titulo" class="titulo">Qual roteiro combina com o seu grupo</h2>
        <p class="secao__intro">Os dois usam a mesma lancha e saem às 10h. A diferença está no tipo de mar e no que fazer durante o dia.</p>
      </div>
      <div class="comparar">
        <article class="comparar__card">
          <a class="comparar__foto" href="ilha-do-campeche/" tabindex="-1" aria-hidden="true"><img src="assets/img/paginas/sobre-06.webp" alt="" width="1400" height="1050" loading="lazy"></a>
          <div class="comparar__corpo">
            <p class="roteiro__fama">O roteiro mais pedido</p>
            <h3 class="comparar__nome"><a href="ilha-do-campeche/">Ilha do Campeche</a></h3>
            <dl class="comparar__dados">
''' + fichas_comparar('ilha-do-campeche') + '''
            </dl>
            <p>Água cristalina e areia branca, tapete flutuante, stand up e mergulho com snorkel. Churrasco a bordo com a ilha na frente.</p>
            <p class="comparar__ideal"><b>Ideal para</b> quem quer praia de água clara e não enjoa no mar aberto.</p>
            <a class="botao botao--contorno" href="ilha-do-campeche/"><span>Ver o roteiro completo</span><svg aria-hidden="true"><use href="#i-seta"/></svg></a>
          </div>
        </article>
        <article class="comparar__card">
          <a class="comparar__foto" href="costa-da-lagoa/" tabindex="-1" aria-hidden="true"><img src="assets/img/fotos/costa-da-lagoa.webp" alt="" width="1400" height="1050" loading="lazy"></a>
          <div class="comparar__corpo">
            <p class="roteiro__fama">Lagoa calma e mesa farta</p>
            <h3 class="comparar__nome"><a href="costa-da-lagoa/">Costa da Lagoa</a></h3>
            <dl class="comparar__dados">
''' + fichas_comparar('costa-da-lagoa') + '''
            </dl>
            <p>Castelinho, Praia do Saquinho, cachoeira, Pedra do Navio e restaurantes de frutos do mar à beira da água.</p>
            <p class="comparar__ideal"><b>Ideal para</b> famílias com crianças, idosos e quem enjoa com facilidade.</p>
            <a class="botao botao--contorno" href="costa-da-lagoa/"><span>Ver o roteiro completo</span><svg aria-hidden="true"><use href="#i-seta"/></svg></a>
          </div>
        </article>
      </div>
    </section>

    <section class="secao" id="personalizado" aria-labelledby="pers-titulo">
      <div class="secao__cabeca secao__cabeca--linha">
        <div>
          <h2 id="pers-titulo" class="titulo">Roteiro personalizado</h2>
          <p class="secao__intro">Quer embarcar em outro lugar, conhecer outras praias ou passear em outro horário? A nossa equipe monta o passeio com você.</p>
        </div>
        <div class="pers__acoes">
          <a class="botao botao--mar" data-wa data-wa-texto="Olá! Vim pelo site da Barra Boat. Quero montar um passeio de lancha personalizado." href="https://wa.me/5548991153172" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-wa"/></svg><span>Montar no WhatsApp</span></a>
          <a class="botao botao--contorno" href="contato/?roteiro=personalizado"><span>Preencher o pedido</span><svg aria-hidden="true"><use href="#i-seta"/></svg></a>
        </div>
      </div>
      <ul class="valores">
        <li><svg aria-hidden="true"><use href="#i-pin"/></svg><h3>Embarque em outro ponto</h3><p>A lancha pode buscar o grupo em outro lugar da Ilha, como um trapiche ou uma marina perto de onde vocês estão. O deslocamento é combinado na reserva.</p></li>
        <li><svg aria-hidden="true"><use href="#i-leme"/></svg><h3>Paradas do seu jeito</h3><p>Diga quais praias e ilhas quer conhecer. O marinheiro monta o caminho conforme o vento e a maré do dia.</p></li>
        <li><svg aria-hidden="true"><use href="#i-relogio"/></svg><h3>Horário combinado</h3><p>Saída e volta em outro horário, acertados com a nossa equipe conforme a lancha livre na data.</p></li>
      </ul>
    </section>

    <section class="secao" aria-labelledby="dia-titulo">
      <div class="duas-colunas">
        <div>
          <h2 id="dia-titulo" class="titulo">Como é o dia a bordo</h2>
          <p class="secao__intro">Vale para os roteiros da Ilha do Campeche e da Costa da Lagoa.</p>
        </div>
        <ol class="lista-passos">
          <li><b>Embarque no Canal da Barra</b><span>Às 10h, na Rod. Jorn. Manoel de Menezes, 3007. Pontualidade conta: o tempo de atraso não é reposto no fim do dia.</span></li>
          <li><b>Navegação até a primeira parada</b><span>O marinheiro conduz e explica o trajeto. Ninguém pula da lancha em movimento.</span></li>
          <li><b>Lancha ancorada, dia livre</b><span>Banho de mar, tapete flutuante, stand up quando a lancha tem, e o churrasco que o marinheiro prepara com as carnes que vocês levarem.</span></li>
          <li><b>Volta ao fim da tarde</b><span>Desembarque no mesmo ponto, às 17h.</span></li>
        </ol>
      </div>
    </section>
''' + chamada('Já sabe o roteiro?', 'Mande a data e quantas pessoas vão. A nossa equipe responde pelo WhatsApp com as lanchas livres.', 'Consultar uma data',
              'Olá! Vim pelo site da Barra Boat. Quero consultar um passeio de lancha.')
ld = [ld_m]
gerados.append(pagina('roteiros/', 'Roteiros de lancha em Florianópolis | Barra Boat Floripa',
                      'Compare os passeios de lancha saindo da Barra da Lagoa: Ilha do Campeche em mar aberto ou Costa da Lagoa em águas calmas. Também montamos roteiro personalizado.',
                      corpo, ld, og_img='assets/img/capas/roteiros.webp'))


# ---------------------------------------------------------------- páginas de roteiro
def paradas_html(paradas):
    """Cada parada: (nome, texto, foto, alt). A foto fica ao lado do texto (embaixo no celular)."""
    return '\n'.join(f'''          <li class="rota-v__parada">
            <span class="rota-v__n">{i + 1}</span>
            <div class="rota-v__corpo">
              <div><h3>{e(n)}</h3><p>{t}</p></div>
              <img class="rota-v__foto" src="{foto}" alt="{e(alt)}" width="1400" height="1050" loading="lazy">
            </div>
          </li>''' for i, (n, t, foto, alt) in enumerate(paradas))


def fotos_html(fotos):
    return '\n'.join(f'        <figure class="mosaico__f mosaico__f--{i + 1}"><img src="{src}" alt="{e(alt)}" width="1400" height="1050" loading="lazy"><figcaption>{e(leg)}</figcaption></figure>'
                     for i, (src, alt, leg) in enumerate(fotos))


def pagina_roteiro(slug, nome, capa_html, dados, paradas, fotos, blocos, regras, wa, titulo_seo, desc_seo, ld_trip, og):
    migs, ld_m = migalhas([('Início', './'), ('Roteiros', 'roteiros/'), (nome, None)])
    mosaico = f'''
    <section class="secao" aria-label="Fotos do roteiro">
      <div class="mosaico">
{fotos_html(fotos)}
      </div>
    </section>''' if fotos else ''
    corpo = capa_html(migs, dados) + f'''
    <section class="secao" aria-labelledby="rota-titulo">
      <div class="duas-colunas duas-colunas--topo">
        <div class="pegajoso">
          <h2 id="rota-titulo" class="titulo">O caminho, parada por parada</h2>
          <p class="secao__intro">A ordem pode mudar conforme o vento e a maré. O marinheiro decide o melhor caminho no dia.</p>
        </div>
        <ol class="rota-v">
{paradas_html(paradas)}
        </ol>
      </div>
    </section>
{mosaico}
{blocos}{regras}
    <section class="secao" aria-labelledby="escolha-titulo">
      <div class="secao__cabeca secao__cabeca--linha">
        <div>
          <h2 id="escolha-titulo" class="titulo">Escolha a lancha para este roteiro</h2>
          <p class="secao__intro">Todas as 17 lanchas fazem o roteiro. Veja algumas por tamanho de grupo.</p>
        </div>
        <a class="botao botao--contorno" href="lanchas/"><span>Ver as 17 lanchas</span><svg aria-hidden="true"><use href="#i-seta"/></svg></a>
      </div>
{grade_lanchas([ORDEM[0], ORDEM[3], ORDEM[8], ORDEM[-1]])}
    </section>
''' + chamada(f'Quer fazer o roteiro {nome}?', 'Mande a data e quantas pessoas vão. A nossa equipe responde pelo WhatsApp com as lanchas livres e os valores.', 'Consultar uma data', wa)
    gerados.append(pagina(f'{slug}/', titulo_seo, desc_seo, corpo, [ld_m, ld_trip], og_img=og))


def dados_html(pares):
    return '\n        <dl class="capa__dados">' + ''.join(f'<div><dt>{a}</dt><dd>{b}</dd></div>' for a, b in pares) + '</dl>'


# Ilha do Campeche
pagina_roteiro(
    'ilha-do-campeche', 'Ilha do Campeche',
    lambda migs, d: capa_foto('ilha-do-campeche', 'Lancha com grupo a bordo em frente às pedras da Ilha do Campeche',
                              'Passeio de lancha para a Ilha do Campeche',
                              'O roteiro mais pedido da Barra Boat: água cristalina e areia branca, no lugar que muita gente chama de Caribe brasileiro.', migs, d),
    dados_html(FICHAS['ilha-do-campeche']),
    [('Canal da Barra da Lagoa', 'Embarque no canal, ao lado da ponte pênsil. Daqui a lancha sai para o mar aberto.',
      'assets/img/fotos/canal-barra.webp', 'Lancha passando pelo Canal da Barra da Lagoa, com as casas e os barcos de pesca na margem'),
     ('Prainha da Barra', 'Vista panorâmica da Prainha logo na saída do canal.',
      'assets/img/paginas/campeche-rota.webp', 'Prainha da Barra e a saída do canal vistas do alto, com uma lancha indo para o mar'),
     ('Piscinas naturais da Barra', 'Piscinas de água salgada formadas entre as pedras, no costão.',
      'assets/img/paginas/sobre-11.webp', 'Costão de pedras da Barra da Lagoa com a água entrando entre as rochas'),
     ('Praia da Galheta', 'Praia de natureza preservada, sem acesso de carro, entre a Mole e a Barra.',
      'assets/img/paginas/sobre-07.webp', 'Praia da Galheta com o costão de pedras em primeiro plano'),
     ('Ponta do Gravatá', 'Costão com trilhas e mirantes, já na direção do Campeche.',
      'assets/img/fotos/campeche-pedras.webp', 'Lancha navegando perto de um costão de pedras no caminho para o Campeche'),
     ('Ilha do Campeche', 'A lancha fica ancorada em frente à ilha. Dia de banho, mergulho com snorkel, tapete flutuante e churrasco a bordo.',
      'assets/img/paginas/sobre-06.webp', 'Ilha do Campeche vista do alto, com a faixa de areia branca e lanchas ancoradas')],
    [('assets/img/paginas/campeche-ilha.webp', 'Faixa de areia branca da Ilha do Campeche com a água cristalina', 'A areia branca do Campeche'),
     ('assets/img/fotos/campeche-mergulho.webp', 'Pessoa mergulhando com snorkel em água transparente', 'Snorkel na água transparente'),
     ('assets/img/paginas/sobre-02.webp', 'Grupo de amigos brindando a bordo da lancha', 'O grupo a bordo'),
     ('assets/img/fotos/tapete.webp', 'Grupo sentado no tapete flutuante ao lado da lancha', 'Tapete flutuante'),
     ('assets/img/paginas/sobre-10.webp', 'Mergulhadora nadando sobre o fundo de areia clara', 'Mergulho no fundo de areia')],
    '''
    <section class="secao" aria-labelledby="bordo-titulo">
      <div class="lado-a-lado">
        <img src="assets/img/fotos/churrasco.webp" alt="Churrasco sendo preparado na churrasqueira de bordo" width="1400" height="1050" loading="lazy">
        <div>
          <h2 id="bordo-titulo" class="titulo">O dia ancorado na ilha</h2>
          <p>Com a lancha parada em frente ao Campeche, o grupo aproveita tapete flutuante, espaguetes e stand up nas lanchas que têm. O marinheiro prepara o churrasco a bordo com as carnes que vocês levarem; carvão, sal, tábuas e utensílios já estão na lancha.</p>
          <p>Para chegar na areia, o acesso é com boias, coletes ou stand up. Desembarcar a lancha na praia só com voucher da Prefeitura, emitido no site <a class="link-forte" href="https://ilhadocampeche.pmf.sc.gov.br" target="_blank" rel="noopener">ilhadocampeche.pmf.sc.gov.br</a>.</p>
          <p>Quem enjoa com facilidade deve tomar um remédio para enjoo antes de embarcar: são 30 a 40 minutos de mar aberto em cada trajeto.</p>
        </div>
      </div>
    </section>
''',
    '''
    <section class="secao" aria-labelledby="regras-titulo">
      <div class="aviso-regras">
        <h2 id="regras-titulo" class="titulo">Regras da Ilha do Campeche</h2>
        <p class="secao__intro">A ilha é tombada como patrimônio e tem regras de visitação. Valem para todos os passeios.</p>
        <ul>
          <li>Não é permitido alimentar os quatis.</li>
          <li>Não é permitido retirar plantas, conchas ou pedras da ilha.</li>
          <li>Churrasco e acampamento são proibidos na praia e no interior da ilha. O churrasco é feito a bordo.</li>
          <li>Trilhas e costões só com monitores credenciados.</li>
          <li>Sem som alto e sem cadeiras na areia.</li>
          <li>Recolha o seu lixo e evite canudos e copos descartáveis.</li>
          <li>Animais de estimação não podem entrar na ilha, por isso não embarcam neste roteiro. Para passear com o seu pet, escolha a Costa da Lagoa.</li>
        </ul>
      </div>
    </section>
''',
    'Olá! Vim pelo site da Barra Boat. Quero consultar um passeio para a Ilha do Campeche.',
    'Passeio de lancha para a Ilha do Campeche | Barra Boat Floripa',
    'Passeio de lancha privativa para a Ilha do Campeche: 10,4 milhas desde o Canal da Barra da Lagoa, 30 a 40 minutos por trajeto, diária de 7 horas com marinheiro.',
    {'@type': 'TouristTrip', 'name': 'Passeio de lancha para a Ilha do Campeche', 'touristType': ['Famílias', 'Grupos de amigos'],
     'description': 'Passeio de lancha privativa saindo do Canal da Barra da Lagoa até a Ilha do Campeche, 10,4 milhas, diária de 7 horas com marinheiro e combustível inclusos.',
     'provider': EMPRESA_REF, 'url': DOM + 'ilha-do-campeche/',
     'itinerary': {'@type': 'ItemList', 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'item': {'@type': 'Place', 'name': n}} for i, n in enumerate(
         ['Canal da Barra da Lagoa', 'Prainha da Barra', 'Piscinas naturais da Barra', 'Praia da Galheta', 'Ponta do Gravatá', 'Ilha do Campeche'])]}},
    'assets/img/capas/ilha-do-campeche.webp')


# Costa da Lagoa (capa: a foto do trapiche, que já é do roteiro)
def capa_costa(migs, d):
    return f'''    <header class="capa capa--foto">
      <picture class="capa__foto">
        <img src="assets/img/fotos/costa-da-lagoa.webp" alt="Trapiche da Costa da Lagoa ao pôr do sol" width="1400" height="1050" fetchpriority="high">
      </picture>
      <div class="capa__conteudo">
        {migs}
        <h1 class="capa__titulo">Passeio de lancha pela Costa da Lagoa</h1>
        <p class="capa__texto">Um dia em águas calmas na Lagoa da Conceição, com cachoeira, prainhas e restaurantes de frutos do mar à beira da água.</p>{d}
      </div>
    </header>
'''

pagina_roteiro(
    'costa-da-lagoa', 'Costa da Lagoa', capa_costa,
    dados_html(FICHAS['costa-da-lagoa']),
    [('Castelinho', 'Construção histórica à beira da Lagoa, ligada aos primeiros moradores da região.',
      'assets/img/paginas/costa-castelinho.webp', 'Castelinho de pedra entre as árvores da Costa da Lagoa'),
     ('Praia do Saquinho', 'Prainha de areia clara e água tranquila para banho.',
      'assets/img/paginas/costa-saquinho.webp', 'Praia do Saquinho vista do alto, com a água calma da Lagoa'),
     ('Cachoeira da Costa', 'Queda alta com uma piscina natural embaixo. Não é permitido subir até o topo; o banho é na piscina.',
      'assets/img/paginas/costa-cachoeira.webp', 'Cachoeira da Costa da Lagoa caindo entre as pedras e a mata'),
     ('Pedra do Navio', 'Canto da Lagoa da Conceição também chamado de Bia Funda, bom para parar e nadar.',
      'assets/img/paginas/costa-lagoa.webp', 'Lagoa da Conceição cercada de morros e mata'),
     ('Restaurantes da Costa', 'Vários restaurantes à beira da água. A dica da casa: sequência de frutos do mar e caipirinha de pitanga.',
      'assets/img/paginas/costa-gastronomia.webp', 'Mesa com frutos do mar em um restaurante à beira da Lagoa')],
    [],  # as fotos do site antigo já estão nas paradas
    '''
    <section class="secao" aria-labelledby="calmo-titulo">
      <div class="lado-a-lado">
        <img src="assets/img/paginas/sobre-03.webp" alt="Mulher no stand up paddle na água calma, perto da praia" width="1400" height="1050" loading="lazy">
        <div>
          <h2 id="calmo-titulo" class="titulo">Por que escolher a Costa da Lagoa</h2>
          <p>A Lagoa da Conceição não tem ondas de mar aberto. É o roteiro indicado para famílias com crianças pequenas, pessoas mais velhas e quem enjoa com facilidade.</p>
          <p>A saída pode ser pelo Canal da Barra da Lagoa ou direto da Lagoa da Conceição, combinado na reserva. O almoço pode ser no churrasco de bordo ou em um dos restaurantes da Costa, com a lancha esperando no trapiche.</p>
          <p>Pets de porte pequeno e médio são bem-vindos neste roteiro. Avise a nossa equipe na reserva.</p>
        </div>
      </div>
    </section>
''', '',
    'Olá! Vim pelo site da Barra Boat. Quero consultar um passeio para a Costa da Lagoa.',
    'Passeio de lancha pela Costa da Lagoa | Barra Boat Floripa',
    'Passeio de lancha privativa pela Costa da Lagoa: Castelinho, Praia do Saquinho, cachoeira, Pedra do Navio e restaurantes. Águas calmas, saída da Barra ou da Lagoa.',
    {'@type': 'TouristTrip', 'name': 'Passeio de lancha pela Costa da Lagoa', 'touristType': ['Famílias com crianças', 'Grupos de amigos'],
     'description': 'Passeio de lancha privativa em águas calmas pela Lagoa da Conceição e a Costa da Lagoa, com marinheiro e combustível inclusos.',
     'provider': EMPRESA_REF, 'url': DOM + 'costa-da-lagoa/',
     'itinerary': {'@type': 'ItemList', 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'item': {'@type': 'Place', 'name': n}} for i, n in enumerate(
         ['Castelinho', 'Praia do Saquinho', 'Cachoeira da Costa', 'Pedra do Navio', 'Restaurantes da Costa'])]}},
    'assets/img/fotos/costa-da-lagoa.webp')

# ---------------------------------------------------------------- /sobre/
migs, ld_m = migalhas([('Início', './'), ('Sobre', None)])
galeria_sobre = '\n'.join(f'        <li><img src="assets/img/paginas/sobre-{k:02d}.webp" alt="{e(a)}" width="1400" height="1050" loading="lazy"></li>' for k, a in [
    (1, 'Marinheiro preparando o churrasco na churrasqueira de bordo'), (2, 'Grupo de amigos sorrindo no deck da lancha'),
    (3, 'Mulher remando em pé no stand up paddle'), (8, 'Mergulho com snorkel em água transparente'),
    (9, 'Grupo de amigas a bordo da lancha'), (11, 'A Fenda, na Ilha do Xavier, vista da lancha'),
    (4, 'Marinheiro no comando da lancha'), (10, 'Mergulho em água verde-azulada')])
corpo = capa_foto('sobre', 'Lancha navegando entre as casas coloridas e os barcos de pesca', 'Desde 2010 na Barra da Lagoa',
                  'Empresa familiar de aluguel de lanchas privativas em Florianópolis, criada por quem vive o mar da Ilha há mais de 30 anos.', migs) + f'''
    <section class="secao" aria-labelledby="historia-titulo">
      <div class="lado-a-lado lado-a-lado--texto">
        <div>
          <h2 id="historia-titulo" class="titulo">Um pouco da nossa história</h2>
          <p>A Barra Boat Floripa nasceu da paixão pelo mar de Neto Linhares, nativo da Ilha, marinheiro, velejador e mecânico náutico com mais de 30 anos de experiência. Ele criou a empresa para mostrar as praias e ilhas de Florianópolis do jeito que só se vê de barco.</p>
          <p>Hoje é uma equipe pequena e próxima que cuida de tudo: do atendimento no WhatsApp à recepção no Canal da Barra e ao preparo das lanchas. Quem fala com você indica a lancha certa para o seu grupo e confere cada detalhe antes do embarque.</p>
        </div>
        <ul class="numeros">
          <li><b>2010</b><span>o ano em que começamos</span></li>
          <li><b data-frota-n>17</b><span>lanchas de 23 a 37 pés</span></li>
          <li><b>4,8</b><span>de nota no Google</span></li>
          <li><b>30+</b><span>anos de mar do fundador</span></li>
        </ul>
      </div>
    </section>

    <section class="secao" aria-labelledby="valores-titulo">
      <div class="secao__cabeca">
        <h2 id="valores-titulo" class="titulo">O que não abrimos mão</h2>
      </div>
      <ul class="valores">
        <li><svg aria-hidden="true"><use href="#i-escudo"/></svg><h3>Segurança em primeiro lugar</h3><p>Lanchas revisadas, coletes para todos e marinheiros atentos ao mar e ao tempo. Com aviso de mau tempo da Marinha, o passeio é remarcado.</p></li>
        <li><svg aria-hidden="true"><use href="#i-leme"/></svg><h3>Qualidade em cada detalhe</h3><p>Da escolha das lanchas à equipe de marinheiros profissionais, cuidamos de tudo para o dia sair como você planejou.</p></li>
        <li><svg aria-hidden="true"><use href="#i-boia"/></svg><h3>Respeito ao mar</h3><p>Seguimos as regras das áreas protegidas, como a Ilha do Campeche, e pedimos que cada grupo recolha o próprio lixo.</p></li>
      </ul>
    </section>

    <section class="secao" aria-labelledby="momentos-titulo">
      <div class="secao__cabeca">
        <h2 id="momentos-titulo" class="titulo">Momentos a bordo</h2>
        <p class="secao__intro">Fotos de passeios com quem já embarcou com a gente.</p>
      </div>
      <ul class="galeria-sobre">
{galeria_sobre}
      </ul>
    </section>

    <section class="secao" aria-labelledby="cadastur-titulo">
      <div class="cadastur-bloco">
        <img src="assets/img/marca/cadastur.png" alt="Cadastur" width="200" height="40" loading="lazy">
        <div>
          <h2 id="cadastur-titulo">Empresa cadastrada no Ministério do Turismo</h2>
          <p>A Barra Boat Floripa tem cadastro ativo no Cadastur, o sistema oficial de prestadores de serviços turísticos do Governo Federal.</p>
        </div>
        <a class="botao botao--contorno" href="https://cadastur.turismo.gov.br/cadastur/#!/public/qrcode/12443869000190" target="_blank" rel="noopener"><span>Consultar no Cadastur</span><svg aria-hidden="true"><use href="#i-seta"/></svg></a>
      </div>
    </section>
''' + chamada('Vamos para o mar?', 'Conte a data e quantas pessoas vão. A nossa equipe responde pelo WhatsApp com as lanchas livres.', 'Falar com a equipe',
              'Olá! Vim pelo site da Barra Boat e quero consultar um passeio.')
gerados.append(pagina('sobre/', 'Sobre a Barra Boat Floripa: aluguel de lanchas desde 2010',
                      'Empresa familiar de aluguel de lanchas na Barra da Lagoa desde 2010, fundada por Neto Linhares, marinheiro com mais de 30 anos de mar.',
                      corpo, [ld_m, {'@type': 'AboutPage', 'url': DOM + 'sobre/', 'about': EMPRESA_REF}], og_img='assets/img/capas/sobre.webp'))

# ---------------------------------------------------------------- /contato/
migs, ld_m = migalhas([('Início', './'), ('Contato', None)])
corpo = capa_faixa('Fale com a Barra Boat', 'Atendimento 24 horas pelo WhatsApp. Você fala direto com a nossa equipe.', migs) + f'''
    <section class="secao" aria-label="Formas de contato">
      <div class="contato">
        <div class="contato__canais">
          <a class="canal canal--destaque" data-wa href="https://wa.me/{WA}" target="_blank" rel="noopener">
            <svg aria-hidden="true"><use href="#i-wa"/></svg>
            <span><b>WhatsApp</b>(48) 99115-3172</span>
          </a>
          <a class="canal" href="tel:+5548991153172"><svg aria-hidden="true"><use href="#i-tel"/></svg><span><b>Telefone</b>(48) 99115-3172</span></a>
          <a class="canal" href="mailto:contato@barraboatfloripa.com.br"><svg aria-hidden="true"><use href="#i-mail"/></svg><span><b>E-mail</b>contato@barraboatfloripa.com.br</span></a>
          <a class="canal" href="https://maps.app.goo.gl/BpSAjwD4joPXAXKb7" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-pin"/></svg><span><b>Sede e embarque</b>Rod. Jorn. Manoel de Menezes, 3007, Barra da Lagoa, Florianópolis, SC</span></a>
          <div class="canal canal--redes">
            <svg aria-hidden="true"><use href="#i-relogio"/></svg><span><b>Atendimento 24 horas</b>Siga também:</span>
            <span class="canal__redes">
              <a href="https://www.instagram.com/barraboatfloripa/" target="_blank" rel="noopener" aria-label="Instagram"><svg><use href="#i-ig"/></svg></a>
              <a href="https://www.tiktok.com/@barra.boat.florip" target="_blank" rel="noopener" aria-label="TikTok"><svg><use href="#i-tt"/></svg></a>
            </span>
          </div>
        </div>

        <form class="form-contato" data-form-contato novalidate>
          <h2 class="form-contato__titulo">Mande sua consulta</h2>
          <p class="form-contato__sub">Preencha e a conversa abre no WhatsApp com tudo escrito. Sem cadastro.</p>
          <label class="campo">Seu nome<input name="nome" autocomplete="name" required></label>
          <div class="campo-linha">
            <label class="campo">Data do passeio<input name="data" type="date"></label>
            <label class="campo">Pessoas<input name="pessoas" type="number" min="1" max="13" inputmode="numeric" placeholder="Ex.: 8"></label>
          </div>
          <label class="campo">Roteiro
            <select name="roteiro" data-roteiro>
              <option value="Ilha do Campeche" data-slug="ilha-do-campeche" selected>Ilha do Campeche</option>
              <option value="Costa da Lagoa" data-slug="costa-da-lagoa">Costa da Lagoa</option>
              <option value="Personalizado" data-slug="personalizado">Personalizado</option>
            </select>
          </label>
          <div class="campo-pers" data-pers hidden>
            <label class="campo">A lancha precisa buscar o grupo em outro lugar?
              <select name="desloc">
                <option value="nao">Não, embarcamos no ponto da Barra Boat</option>
                <option value="sim">Sim, tenho píer ou outro ponto</option>
              </select>
            </label>
            <label class="campo" data-desloc-local hidden>Onde buscar o grupo<input name="local" autocomplete="off" placeholder="Ex.: píer de casa em Jurerê"></label>
          </div>
          <label class="campo"><span data-rotulo-msg>Mensagem</span><textarea name="mensagem" rows="3" placeholder="Alguma dúvida ou pedido especial?"></textarea></label>
          <p class="form-contato__erro" data-form-erro hidden>Escreva o seu nome para a nossa equipe saber com quem está falando.</p>
          <button class="botao botao--mar botao--cheio botao--grande" type="submit"><svg aria-hidden="true"><use href="#i-wa"/></svg><span>Enviar pelo WhatsApp</span></button>
        </form>
      </div>
    </section>

    <section class="secao" aria-labelledby="mapa-titulo">
      <div class="duas-colunas embarque">
        <div>
          <h2 id="mapa-titulo" class="titulo">Onde é o embarque</h2>
          <p class="secao__intro">A sede da Barra Boat fica na Rod. Jorn. Manoel de Menezes, 3007, na Barra da Lagoa. É dali, pelo canal, que sai a maior parte dos passeios. O local certo do seu embarque, com o link do mapa, vai na confirmação da reserva pelo WhatsApp.</p>
        </div>
        <ul class="lista-passos lista-passos--pontos">
          <li><b>Ilha do Campeche</b><span>Embarque no Canal da Barra da Lagoa, junto à sede.</span></li>
          <li><b>Costa da Lagoa</b><span>Saída pelo Canal da Barra ou direto da Lagoa da Conceição, combinada na reserva.</span></li>
          <li><b>Lanchas de outras regiões e roteiro personalizado</b><span>O ponto de embarque é combinado com a nossa equipe. A lancha também pode buscar o grupo em outro lugar, desde que consiga chegar e manobrar com segurança.</span></li>
        </ul>
      </div>
      <div class="mapa">
        <iframe title="Mapa da sede da Barra Boat, no Canal da Barra da Lagoa" src="https://maps.google.com/maps?q=Rod.+Jorn.+Manoel+de+Menezes,+3007,+Barra+da+Lagoa,+Florian%C3%B3polis&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </section>
'''
gerados.append(pagina('contato/', 'Contato e embarque | Barra Boat Floripa',
                      'Fale com a Barra Boat Floripa pelo WhatsApp (48) 99115-3172, atendimento 24 horas. Sede e embarque no Canal da Barra da Lagoa, Rod. Jorn. Manoel de Menezes, 3007.',
                      corpo, [ld_m, {'@type': 'ContactPage', 'url': DOM + 'contato/', 'about': EMPRESA_REF}],
                      js_extra='\n  <script src="{pre}assets/js/contato.js?v=5" defer></script>'))


# ---------------------------------------------------------------- políticas
def politica(slug, titulo, texto, secoes, seo_t, seo_d, atualizada='16 de novembro de 2026'):
    migs, ld_m = migalhas([('Início', './'), (titulo, None)])
    sumario = ''.join(f'<li><a href="#{a}">{e(t)}</a></li>' for a, t, _ in secoes)
    conteudo = '\n'.join(f'        <section id="{a}" aria-labelledby="{a}-t"><h2 id="{a}-t">{e(t)}</h2>{c}</section>' for a, t, c in secoes)
    corpo = capa_faixa(titulo, texto, migs) + f'''
    <section class="secao">
      <div class="prosa-grade">
        <nav class="sumario" aria-label="Nesta página"><p>Nesta página</p><ol>{sumario}</ol></nav>
        <div class="prosa">
          <p class="prosa__data">Atualizada em {atualizada}.</p>
{conteudo}
        </div>
      </div>
    </section>
'''
    arq = pagina(f'{slug}/', seo_t, seo_d, corpo, [ld_m])
    # o sumário aponta para a própria página (o prefixa() trata "#x" como âncora da home)
    h = open(arq, encoding='utf-8').read()
    for a, _, _ in secoes:
        h = h.replace(f'href="../#{a}"', f'href="#{a}"')
    open(arq, 'w', encoding='utf-8').write(h)
    gerados.append(arq)


politica('politica-de-cancelamento', 'Política de cancelamento e reembolso',
         'Como funcionam a reserva, a remarcação e a devolução de valores nos passeios da Barra Boat Floripa.',
         [('reserva', 'Reserva e pagamento', '<p>A data é garantida com o pagamento de 50% do valor da diária. Os outros 50% são pagos no dia do passeio, antes do embarque. Depois da reserva, a Barra Boat envia um contrato com os dados do passeio, as normas de navegação e as regras do local visitado.</p><p>Pagamentos com cartão de crédito ou em moeda estrangeira podem ter taxas e impostos, informados antes da reserva.</p>'),
          ('tempo', 'Tempo ruim ou mar sem segurança', '<p>Com chuva, vento forte ou aviso de mau tempo do Centro de Hidrografia da Marinha para a área e o horário do passeio, a Barra Boat pode cancelar a saída por segurança. Nesses casos você escolhe entre:</p><ul><li>remarcar para outra data livre;</li><li>trocar por outro roteiro disponível;</li><li>receber de volta todo o valor já pago.</li></ul><p>A decisão de cancelar por tempo é tomada no dia do passeio, com base nas condições reais do mar.</p>'),
          ('lancha', 'Problema com a lancha', '<p>Se a lancha precisar de manutenção antes do passeio, oferecemos outra lancha equivalente, uma nova data ou a devolução do valor pago.</p><p>Se uma pane ou defeito impedir a navegação segura durante o passeio, devolvemos o valor proporcional ao tempo não utilizado ou damos crédito de igual período para uma nova data, combinada entre as partes.</p>'),
          ('mudanca', 'Mudança de data pelo cliente', '<p>A troca de data é possível quando a lancha estiver livre no novo dia, com taxa de 10% sobre o valor total do contrato.</p><p>Se alguém do grupo ficar doente, o passeio é remarcado. Como o restante do grupo pode embarcar, não cancelamos a reserva, mas podemos descontar o valor proporcional.</p>'),
          ('atraso', 'Atraso e não comparecimento', '<p>O horário de embarque precisa ser respeitado. O tempo perdido por atraso do grupo não é acrescentado ao fim do dia.</p><p>Atraso acima de duas horas sem aviso, ou o não comparecimento, cancela o passeio sem devolução do sinal de 50%.</p>'),
          ('devolucao', 'Como é feita a devolução', '<p>A devolução é feita pelo mesmo meio do pagamento. Se você pedir outra forma de devolução, podem ser descontadas taxas de transação financeira.</p><p>Dúvidas sobre cancelamento: WhatsApp <a href="https://wa.me/5548991153172">(48) 99115-3172</a> ou <a href="mailto:contato@barraboatfloripa.com.br">contato@barraboatfloripa.com.br</a>.</p>')],
         'Política de cancelamento e reembolso | Barra Boat Floripa',
         'Regras de reserva, remarcação por tempo ruim, troca de data, atraso e devolução de valores dos passeios de lancha da Barra Boat Floripa.')

politica('politica-de-privacidade', 'Política de privacidade',
         'Quais dados a Barra Boat Floripa coleta, para que usa e como você exerce os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).',
         [('quem', 'Quem somos', '<p>Barra Boat Floripa, empresa de aluguel de lanchas com sede na Rod. Jorn. Manoel de Menezes, 3007, Barra da Lagoa, Florianópolis, SC. Para assuntos de privacidade, fale com a gente pelo e-mail <a href="mailto:contato@barraboatfloripa.com.br">contato@barraboatfloripa.com.br</a>.</p>'),
          ('dados', 'Dados que coletamos', '<ul><li><b>Dados que você informa:</b> nome, telefone ou WhatsApp, e-mail, data do passeio, número de pessoas e as mensagens que você envia.</li><li><b>Dados da reserva:</b> dados do contrato, como CPF ou documento do responsável, e os registros de pagamento.</li><li><b>Dados de navegação:</b> páginas visitadas, origem da visita (anúncio, busca, rede social) e informações do aparelho, coletados por cookies e ferramentas do Google.</li></ul>'),
          ('uso', 'Para que usamos', '<ul><li>Responder as suas consultas e montar o orçamento.</li><li>Fazer a reserva, emitir o contrato e organizar o embarque.</li><li>Enviar avisos sobre o seu passeio, como mudanças por causa do tempo.</li><li>Enviar novidades e datas especiais, só se você aceitar. Você pode sair a qualquer momento.</li><li>Medir o resultado dos anúncios e melhorar o site.</li></ul><p>As bases legais são a execução do contrato, o legítimo interesse em responder quem nos procura, o cumprimento de obrigações legais e o seu consentimento, quando for o caso.</p>'),
          ('compartilhamento', 'Com quem compartilhamos', '<ul><li><b>Donos das lanchas parceiras:</b> quando você reserva uma lancha de parceiro, ele recebe os dados necessários para o passeio.</li><li><b>WhatsApp (Meta):</b> as conversas acontecem pelo WhatsApp e seguem também a política da Meta.</li><li><b>Google:</b> ferramentas de medição e anúncios, como o Google Tag Manager e o Google Ads.</li><li><b>Autoridades:</b> quando a lei exigir, como a lista de passageiros para a Marinha.</li></ul><p>Não vendemos os seus dados.</p>'),
          ('agenda-google', 'Agenda Google dos donos das lanchas', '<p>Os donos das lanchas parceiras podem conectar a própria conta Google à Barra Boat, pelo link que a nossa equipe envia. Com a autorização do dono:</p><ul><li><b>Lemos</b> os eventos só da agenda que ele escolher, para saber quais dias cada lancha está ocupada. Do evento guardamos apenas o dia e a lancha; título, descrição e demais dados não são guardados.</li><li><b>Criamos, mudamos e apagamos</b> só os eventos das reservas que a nossa equipe marcar nas lanchas dele.</li><li>Não acessamos e-mail, contatos, fotos, arquivos nem outra parte da conta. A autorização fica guardada cifrada no nosso servidor.</li></ul><p>O uso e a transferência de informações recebidas das APIs do Google seguem a <a href="https://developers.google.com/terms/api-services-user-data-policy" rel="noopener">Política de Dados do Usuário dos Serviços de API do Google</a>, incluindo os requisitos de uso limitado. Esses dados não são vendidos, não são usados para anúncios e não são usados para treinar modelos de inteligência artificial. O dono pode desligar a conexão a qualquer momento, pedindo à nossa equipe ou em myaccount.google.com/permissions; ao desligar, apagamos a autorização e os dias lidos da agenda dele.</p>'),
          ('cookies', 'Cookies', '<p>O site usa cookies para medir visitas e o resultado dos anúncios. Você pode bloquear ou apagar cookies nas configurações do seu navegador; o site continua funcionando.</p>'),
          ('guarda', 'Por quanto tempo guardamos', '<p>Guardamos os dados enquanto forem necessários para a finalidade de cada um e pelo prazo exigido em lei, como o das obrigações fiscais e de contrato. Depois disso, são apagados ou tornados anônimos.</p>'),
          ('direitos', 'Os seus direitos', '<p>Pela LGPD você pode pedir a qualquer momento: confirmação de que tratamos os seus dados, acesso, correção, anonimização ou exclusão, portabilidade, informação sobre compartilhamento e a revogação do consentimento. Basta escrever para <a href="mailto:contato@barraboatfloripa.com.br">contato@barraboatfloripa.com.br</a>. Respondemos em até 15 dias.</p>'),
          ('seguranca', 'Segurança', '<p>Usamos medidas técnicas e administrativas para proteger os dados contra acesso não autorizado, perda ou uso indevido, com acesso restrito a quem precisa deles para o atendimento.</p>'),
          ('mudancas', 'Mudanças nesta política', '<p>Esta política pode ser atualizada. A data da versão em vigor fica no topo da página.</p>')],
         'Política de privacidade | Barra Boat Floripa',
         'Como a Barra Boat Floripa coleta, usa e protege os seus dados pessoais, e como exercer os seus direitos pela LGPD.')

politica('termos-de-uso', 'Termos de uso',
         'As regras para usar o site, reservar um passeio e, para os donos das lanchas parceiras, conectar a agenda Google à Barra Boat Floripa.',
         [('quem', 'Quem somos', '<p>Barra Boat Floripa, empresa de aluguel de lanchas privativas com marinheiro, com sede na Rod. Jorn. Manoel de Menezes, 3007, Barra da Lagoa, Florianópolis, SC. Estes termos valem para o site barraboatfloripa.com.br, para o atendimento pelo WhatsApp e para a conexão de agenda usada pelos donos das lanchas parceiras. Ao usar o site ou reservar um passeio, você concorda com eles.</p>'),
          ('site', 'Informações do site', '<p>As fotos, os itens a bordo e a capacidade de cada lancha mostram como ela é hoje e podem mudar. O calendário de datas livres é uma referência: a data só está garantida depois da confirmação da nossa equipe e do pagamento do sinal.</p><p>O site não mostra preços. Valores, roteiros e horários são combinados com a nossa equipe pelo WhatsApp.</p>'),
          ('reserva', 'Reserva', '<p>A reserva é feita pelo WhatsApp <a href="https://wa.me/5548991153172">(48) 99115-3172</a>. A data fica garantida com o pagamento de 50% do valor, e o restante é pago no dia, antes do embarque. Depois da reserva, enviamos o contrato com os dados do passeio.</p><p>Remarcação, tempo ruim, atraso e devolução de valores seguem a <a href="politica-de-cancelamento/">Política de cancelamento e reembolso</a>.</p>'),
          ('passeio', 'No passeio', '<ul><li>O número de pessoas a bordo não pode passar da capacidade da lancha, contando crianças e bebês.</li><li>O marinheiro é o responsável pela navegação. Por segurança, ele pode mudar o roteiro, encurtar a parada ou voltar antes, conforme o mar e o tempo.</li><li>Valem as regras de cada lugar visitado. A Ilha do Campeche, por exemplo, não aceita animais e limita o número de visitantes por dia.</li><li>Danos causados à lancha por mau uso do grupo podem ser cobrados do responsável pela reserva.</li></ul>'),
          ('parceiros', 'Donos das lanchas parceiras e a agenda Google', '<p>O dono de lancha parceira pode conectar a própria conta Google pelo link que a nossa equipe envia. Ao conectar, ele autoriza a Barra Boat a:</p><ul><li>ler os eventos da agenda que ele escolher, para marcar como ocupados os dias das lanchas dele e das lanchas que ele vende;</li><li>criar, mudar e apagar nessa agenda os eventos das reservas que a nossa equipe marcar nas lanchas dele.</li></ul><p>O dono continua responsável por manter a própria agenda em dia e por escrever o nome da lancha nos eventos. Ele pode desligar a conexão a qualquer momento, pedindo à nossa equipe ou nas permissões da conta Google. O que fazemos com esses dados está na <a href="politica-de-privacidade/#agenda-google">Política de privacidade</a>.</p>'),
          ('conteudo', 'Textos, fotos e marca', '<p>Os textos, as fotos, os vídeos e a marca Barra Boat Floripa pertencem à empresa ou aos donos das lanchas parceiras. Não podem ser copiados ou usados para fins comerciais sem autorização por escrito.</p>'),
          ('limites', 'Limites de responsabilidade', '<p>Trabalhamos para manter o site no ar e com informações corretas, mas ele pode ficar fora do ar por manutenção ou falha técnica. Serviços de terceiros usados no atendimento, como o WhatsApp e o Google, seguem as regras das próprias empresas.</p>'),
          ('mudancas', 'Mudanças e foro', '<p>Estes termos podem ser atualizados, e a data da versão em vigor fica no topo da página. Valem as leis brasileiras, e o foro é o da comarca de Florianópolis, SC. Dúvidas: <a href="mailto:contato@barraboatfloripa.com.br">contato@barraboatfloripa.com.br</a>.</p>')],
         'Termos de uso | Barra Boat Floripa',
         'Regras de uso do site, da reserva dos passeios de lancha e da conexão da agenda Google dos donos das lanchas parceiras da Barra Boat Floripa.',
         atualizada='26 de novembro de 2026')

# ---------------------------------------------------------------- 404
corpo = capa_faixa('Esta página saiu da rota', 'O endereço pode ter mudado. Volte para o início ou escolha a sua lancha.', '', '''
        <div class="capa__acoes">
          <a class="botao botao--claro" href="./"><span>Ir para o início</span></a>
          <a class="botao botao--mar" href="lanchas/"><span>Ver as lanchas</span></a>
        </div>''')
gerados.append(pagina('404.html', 'Página não encontrada | Barra Boat Floripa', 'Página não encontrada.', corpo))

# ---------------------------------------------------------------- /link/ (bio do Instagram)
# Página avulsa, sem o cabeçalho, o menu e o rodapé do site: quem chega da bio veio de um link único e
# precisa de destinos, não de menu. noindex e fora do sitemap (lista de atalhos competiria no Google com as
# páginas de verdade), mas passa pelo site.php como as outras: GTM no domínio oficial, números da frota do
# banco, os 6 primeiros barcos do banco (bb_link_frota em lib/lanchas.php, mesmo HTML de link_barco) e os
# 9 idiomas (/es/link/...). Rastreamento: todo link interno leva utm_source=instagram&utm_medium=link, que o
# site.js grava como origem "instagram/link"; o link.js grava a mesma origem antes de o visitante sair daqui.
UTM_LINK = '?utm_source=instagram&amp;utm_medium=link&amp;utm_campaign=bio'
WA_LINK = 'Olá! Vim pelo Instagram da Barra Boat e quero consultar uma data para um passeio de lancha.'


def simbolos(ids):
    return '\n'.join(re.search(rf'<symbol id="{i}".*?</symbol>', SPRITE, re.S).group(0) for i in ids)


def link_barco(c):
    """Um barco da faixa da frota. Igual ao bb_link_barco do lib/lanchas.php (o conferidor compara)."""
    s = c['slug']
    return (f'<li class="lk-barco"><a href="../lanchas/{s}/{UTM_LINK}"><img src="../assets/img/lanchas/{s}.webp" '
            f'alt="Lancha {c["nome"]}" width="800" height="800" loading="lazy"><b>{c["nome"]}</b><span>{c["pax"]} pessoas, {c["pes"]} pés</span></a></li>')


def pagina_link():
    frota = '\n'.join('          ' + link_barco(CARDS[s]) for s in ORDEM[:6])
    idiomas = ''.join(f'\n          <li><a href="/{"" if c == "pt" else c + "/"}link/" hreflang="{h}" lang="{h}" data-idioma-cod="{c}"{" aria-current=\"true\"" if c == "pt" else ""}><b>{c.upper()}</b>{n}</a></li>'
                      for c, h, n in [('pt', 'pt-BR', 'Português'), ('es', 'es', 'Español'), ('en', 'en', 'English'), ('fr', 'fr', 'Français'), ('de', 'de', 'Deutsch'),
                                      ('it', 'it', 'Italiano'), ('nl', 'nl', 'Nederlands'), ('ja', 'ja', '日本語'), ('zh', 'zh-Hans', '简体中文')])
    wa = f'https://wa.me/{WA}?text=' + urllib.parse.quote(WA_LINK, safe='')
    titulo = 'Barra Boat Floripa | Lanchas privativas na Barra da Lagoa'
    desc = 'Consulte uma data pelo WhatsApp, veja as lanchas, os roteiros para a Ilha do Campeche e a Costa da Lagoa e o embarque no Canal da Barra.'
    doc = f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{e(titulo)}</title>
  <meta name="description" content="{e(desc)}">
  <!-- noindex de propósito (não é o da prévia): página de atalhos da bio, conteúdo repetido do site -->
  <meta name="robots" content="noindex, follow">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Barra Boat Floripa">
  <meta property="og:title" content="{e(titulo)}">
  <meta property="og:description" content="{e(desc)}">
  <meta property="og:url" content="{DOM}link/">
  <meta property="og:image" content="{og_url('assets/img/fotos/hero.webp')}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#F3F7FA">
  <link rel="icon" href="../favicon.ico" sizes="any">
  <link rel="icon" type="image/png" href="../assets/img/marca/favicon.png">
  <link rel="apple-touch-icon" href="../assets/img/marca/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,300..800;1,62..125,500..900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/link.css?v=3">
</head>
<body class="lk-corpo">
  <!-- Fundo náutico do site: ondas em traço fino + a lancha que cruza de vez em quando (link.js) -->
  <canvas class="mar" aria-hidden="true"></canvas>

  <svg class="sprite" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    {simbolos(['i-wa', 'i-google', 'i-estrela', 'i-lancha', 'i-leme', 'i-boia', 'i-tel', 'i-seta', 'i-ig', 'i-tt', 'i-pin'])}
  </svg>

  <p class="lk-trilho" aria-hidden="true"><span>27°35′11″S</span><i></i><span>48°26′11″W</span></p>

  <main class="lk" id="conteudo">
    <header class="lk-topo" style="--i:0">
      <a class="lk-topo__marca" href="../{UTM_LINK}"><img src="../assets/img/marca/logo.png" alt="Barra Boat Floripa, ir para o site" width="600" height="282"></a>
      <div class="idioma" data-idioma translate="no">
        <button class="topo__idioma" type="button" aria-label="Idioma do site: Português" aria-expanded="false" aria-controls="idiomas" data-idioma-botao>
          <svg class="idioma__globo" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3Z"/></svg><span data-idioma-atual>PT</span>
        </button>
        <ul class="idioma__lista" id="idiomas" hidden>{idiomas}
        </ul>
      </div>
    </header>

    <section class="lk-abre" style="--i:1" aria-labelledby="lk-titulo">
      <h1 class="lk-abre__titulo" id="lk-titulo">A lancha é só do seu grupo.</h1>
      <p class="lk-abre__texto">Marinheiro e combustível inclusos, saindo do Canal da Barra da Lagoa desde 2010.</p>
      <a class="lk-google" href="https://search.google.com/local/reviews?placeid=ChIJweQXY-8_J5URa4sYsQVDMTc" target="_blank" rel="noopener">
        <svg aria-hidden="true"><use href="#i-google"/></svg><b>4,8</b><span class="lk-google__estrelas" aria-hidden="true">★★★★★</span><span>no Google</span>
      </a>
    </section>

    <a class="lk-wa" style="--i:2" href="{wa}" target="_blank" rel="noopener" data-link-wa>
      <span class="lk-wa__icone" aria-hidden="true"><svg><use href="#i-wa"/></svg></span>
      <span class="lk-wa__txt"><b>Consultar uma data</b><small>Pelo WhatsApp, com a nossa equipe, 24 horas</small></span>
      <svg class="lk-wa__seta" aria-hidden="true"><use href="#i-seta"/></svg>
    </a>

    <section class="lk-bloco" style="--i:3" aria-labelledby="lk-roteiros">
      <h2 class="lk-h2" id="lk-roteiros">Roteiros</h2>
      <div class="lk-roteiros">
        <a class="lk-postal" href="../ilha-do-campeche/{UTM_LINK}">
          <img src="../assets/img/capas/ilha-do-campeche-mobile.webp" alt="Água azul e areia branca na Ilha do Campeche" width="1200" height="900" loading="lazy">
          <span class="lk-postal__selo">O mais pedido</span>
          <span class="lk-postal__txt"><b>Ilha do Campeche</b><span>10,4 milhas, diária de 7 horas</span></span>
        </a>
        <a class="lk-postal" href="../costa-da-lagoa/{UTM_LINK}">
          <img src="../assets/img/fotos/costa-da-lagoa.webp" alt="Lancha na Lagoa da Conceição, a caminho da Costa da Lagoa" width="1400" height="775" loading="lazy">
          <span class="lk-postal__txt"><b>Costa da Lagoa</b><span>Águas calmas, 5 paradas</span></span>
        </a>
      </div>
    </section>

    <section class="lk-bloco lk-frota" style="--i:4" aria-labelledby="lk-frota">
      <div class="lk-bloco__cab">
        <h2 class="lk-h2" id="lk-frota">A frota</h2>
        <a class="lk-mais" href="../lanchas/{UTM_LINK}">Ver as 17 lanchas<svg aria-hidden="true"><use href="#i-seta"/></svg></a>
      </div>
      <ul class="lk-frota__lista" data-link-frota>
{frota}
        </ul>
    </section>

    <nav class="lk-bloco lk-rota" style="--i:5" aria-labelledby="lk-atalhos" data-rota>
      <h2 class="lk-h2" id="lk-atalhos">Atalhos do site</h2>
      <span class="lk-rota__barco" aria-hidden="true" data-rota-barco><svg viewBox="0 0 24 40"><path class="lk-rota__esteira" d="M12 0v14"/><path class="lk-rota__casco" d="M12 39c-4-3.4-6.2-8.6-6.2-15.2V12.6c0-1.6 1.2-2.8 2.8-2.8h6.8c1.6 0 2.8 1.2 2.8 2.8v11.2c0 6.6-2.2 11.8-6.2 15.2Z"/><path class="lk-rota__cabine" d="M8.6 15.2h6.8v6.4c0 1-.8 1.8-1.8 1.8h-3.2c-1 0-1.8-.8-1.8-1.8Z"/><path class="lk-rota__vidro" d="M8.4 25.4c2.3 1.6 4.9 1.6 7.2 0"/></svg></span>
      <ul class="lk-rota__lista">
        <li><a href="../lanchas/{UTM_LINK}"><span class="lk-rota__boia" aria-hidden="true"><svg><use href="#i-lancha"/></svg></span><span class="lk-rota__txt"><b>Lanchas</b><span>17 lanchas de 23 a 37 pés</span></span><svg class="lk-rota__seta" aria-hidden="true"><use href="#i-seta"/></svg></a></li>
        <li><a href="../{UTM_LINK}#avaliacoes"><span class="lk-rota__boia" aria-hidden="true"><svg><use href="#i-estrela"/></svg></span><span class="lk-rota__txt"><b>Avaliações</b><span>Nota 4,8 no Google, de turistas do Brasil e de fora</span></span><svg class="lk-rota__seta" aria-hidden="true"><use href="#i-seta"/></svg></a></li>
        <li><a href="../sobre/{UTM_LINK}"><span class="lk-rota__boia" aria-hidden="true"><svg><use href="#i-leme"/></svg></span><span class="lk-rota__txt"><b>Sobre a Barra Boat</b><span>Desde 2010 no Canal da Barra</span></span><svg class="lk-rota__seta" aria-hidden="true"><use href="#i-seta"/></svg></a></li>
        <li><a href="../{UTM_LINK}#duvidas"><span class="lk-rota__boia" aria-hidden="true"><svg><use href="#i-boia"/></svg></span><span class="lk-rota__txt"><b>Dúvidas frequentes</b><span>Pagamento, horário e o que levar</span></span><svg class="lk-rota__seta" aria-hidden="true"><use href="#i-seta"/></svg></a></li>
        <li><a href="../contato/{UTM_LINK}"><span class="lk-rota__boia" aria-hidden="true"><svg><use href="#i-tel"/></svg></span><span class="lk-rota__txt"><b>Contato</b><span>WhatsApp, e-mail e endereço</span></span><svg class="lk-rota__seta" aria-hidden="true"><use href="#i-seta"/></svg></a></li>
      </ul>
    </nav>

    <section class="lk-bloco lk-embarque" style="--i:6" aria-labelledby="lk-embarque">
      <div class="lk-carta" data-mapa>
        <svg class="lk-carta__desenho" viewBox="0 0 400 210" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g class="lk-carta__curvas">
            <path d="M-10 40C60 20 110 70 180 52S300 10 410 34"/>
            <path d="M-10 78C70 58 120 104 196 88S310 50 410 70"/>
            <path d="M-10 118C80 100 130 140 210 126S320 92 410 108"/>
            <path d="M-10 160C90 142 150 178 226 166S330 136 410 150"/>
            <path d="M-10 198C100 184 160 214 240 204S340 178 410 190"/>
          </g>
          <path class="lk-carta__rota" d="M150 118C210 104 250 70 330 58S400 40 420 30"/>
          <g class="lk-carta__pino" transform="translate(150 118)"><circle class="lk-carta__onda" r="9"/><circle r="5"/></g>
          <text class="lk-carta__nome" x="136" y="146" text-anchor="end">Canal da Barra</text>
          <text class="lk-carta__nome lk-carta__nome--mar" x="384" y="104" text-anchor="end">Oceano Atlântico</text>
        </svg>
        <button class="lk-carta__abrir" type="button" data-mapa-abrir><svg aria-hidden="true"><use href="#i-pin"/></svg>Mostrar o mapa</button>
      </div>
      <div class="lk-embarque__txt">
        <h2 class="lk-h2" id="lk-embarque">Embarque no Canal da Barra</h2>
        <p>Rod. Jorn. Manoel de Menezes, 3007<br>Barra da Lagoa, Florianópolis, SC</p>
        <div class="lk-embarque__acoes">
          <a class="lk-botao lk-botao--claro" href="https://www.google.com/maps/dir/?api=1&amp;destination=Barra%20Boat%20Floripa&amp;destination_place_id=ChIJweQXY-8_J5URa4sYsQVDMTc" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-pin"/></svg>Traçar rota</a>
          <a class="lk-botao lk-botao--linha" href="https://www.waze.com/ul?ll=-27.5863938%2C-48.4363769&amp;navigate=yes" target="_blank" rel="noopener">Abrir no Waze</a>
        </div>
      </div>
    </section>

    <section class="lk-bloco" style="--i:7" aria-labelledby="lk-redes">
      <h2 class="lk-h2" id="lk-redes">Acompanhe os passeios</h2>
      <div class="lk-redes">
        <a href="https://www.instagram.com/barraboatfloripa/" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-ig"/></svg><span><b>Instagram</b><span>@barraboatfloripa</span></span></a>
        <a href="https://www.tiktok.com/@barra.boat.florip" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-tt"/></svg><span><b>TikTok</b><span>@barra.boat.florip</span></span></a>
      </div>
    </section>

    <footer class="lk-fim" style="--i:8">
      <a class="lk-cadastur" href="https://cadastur.turismo.gov.br/cadastur/#!/public/qrcode/12443869000190" target="_blank" rel="noopener"><img src="../assets/img/marca/cadastur.png" alt="Cadastur" width="200" height="40" loading="lazy"><span>Empresa cadastrada no Ministério do Turismo</span></a>
      <a class="lk-botao lk-botao--claro lk-fim__site" href="../{UTM_LINK}">Ver o site completo<svg aria-hidden="true"><use href="#i-seta"/></svg></a>
      <p class="lk-fim__copy">© <span data-ano>2026</span> Barra Boat Floripa</p>
      <a class="assinatura" href="https://www.freelainhome.com.br/" target="_blank" rel="noopener" aria-label="Site desenvolvido pela Freela In Home">
        <span class="assinatura__mar" aria-hidden="true">
          <span class="assinatura__lancha">
            <svg viewBox="0 0 34 17"><path class="assinatura__casco" d="M1 10.5h23.5l8.5-3.6-4.6 7.6c-.5.8-1.3 1.3-2.2 1.3H4.6c-1 0-1.9-.6-2.3-1.5Z"/><path class="assinatura__cabine" d="M8 10.5 11.6 5h7.6l4.3 5.5Z"/><path class="assinatura__vidro" d="M17.2 6.2h1.6l3 3.6h-4.6Z"/></svg>
          </span>
        </span>
        <span class="assinatura__txt"><i>Feito para navegar sem enjoo,</i><span>desenvolvido pela <b>Freela In Home</b></span></span>
      </a>
    </footer>
  </main>

  <script src="../assets/js/link.js?v=3" defer></script>
</body>
</html>
'''
    destino = os.path.join(PROJ, 'link', 'index.html')
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    open(destino, 'w', encoding='utf-8').write(doc)
    return destino


gerados.append(pagina_link())

# ---------------------------------------------------------------- sitemap
urls =['', 'lanchas/'] + [f'lanchas/{s}/' for s in ORDEM] + ['roteiros/', 'ilha-do-campeche/', 'costa-da-lagoa/', 'sobre/', 'contato/', 'politica-de-cancelamento/', 'politica-de-privacidade/', 'termos-de-uso/']
hoje = datetime.date.today().isoformat()
# cada página em todos os idiomas (as traduções são servidas pelo site.php em /es/, /en/...),
# com as alternativas de idioma de cada uma, como o Google pede
IDIOMAS = [('pt', 'pt-BR'), ('es', 'es'), ('en', 'en'), ('fr', 'fr'), ('de', 'de'), ('it', 'it'), ('nl', 'nl'), ('ja', 'ja'), ('zh', 'zh-Hans')]


def url_i(c, u):
    return f'{DOM}{"" if c == "pt" else c + "/"}{u}'


def entrada(c, u):
    alt = ''.join(f'\n    <xhtml:link rel="alternate" hreflang="{h}" href="{url_i(c2, u)}"/>' for c2, h in IDIOMAS)
    alt += f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{url_i("pt", u)}"/>'
    return f'  <url><loc>{url_i(c, u)}</loc><lastmod>{hoje}</lastmod>{alt}\n  </url>\n'


open(os.path.join(PROJ, 'sitemap.xml'), 'w', encoding='utf-8').write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + ''.join(entrada(c, u) for u in urls for c, _ in IDIOMAS) + '</urlset>\n')

for g in gerados:
    print(os.path.relpath(g, PROJ))
print(len(gerados), 'páginas')
