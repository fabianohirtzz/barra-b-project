"""Gera os WebP das páginas internas a partir das fotos melhoradas com IA.

Fonte: <cliente>/Site/imagens-site-antigo/melhoradas-ia/ + manifesto.json (fora do Git).
Saída:  assets/img/lanchas/<slug>/NN.webp (1400 px) e NN-p.webp (480 px, miniatura)
        assets/img/paginas/<nome>.webp (1400 px)
Rodar:  python tools/gerar_imagens.py
"""
import os, json
from PIL import Image

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = r'e:/Clientes/Barra Boat Floripa/Site/imagens-site-antigo'
man = json.load(open(os.path.join(BASE, 'manifesto.json'), encoding='utf-8'))
lanchas = json.load(open(os.path.join(PROJ, 'docs/conteudo-site-atual/lanchas.json'), encoding='utf-8'))


def salva(src, dst, lado, q=78):
    im = Image.open(src).convert('RGB')
    if max(im.size) > lado:
        f = lado / max(im.size)
        im = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, 'WEBP', quality=q, method=6)
    return im.size


galerias = {}
for l in lanchas:
    fotos, vistos = [], set()
    for img in l['imagens']:
        u = img['url']
        if u in vistos or u not in man:
            continue
        vistos.add(u)
        n = len(fotos) + 1
        src = os.path.join(BASE, man[u]['melhorada'])
        w, h = salva(src, os.path.join(PROJ, f"assets/img/lanchas/{l['slug']}/{n:02d}.webp"), 1400)
        salva(src, os.path.join(PROJ, f"assets/img/lanchas/{l['slug']}/{n:02d}-p.webp"), 480, 72)
        fotos.append({'n': n, 'w': w, 'h': h})
    galerias[l['slug']] = fotos
    print(l['slug'], len(fotos))

PAGINAS = {
    'campeche-rota': 'https://barraboatfloripa.com.br/wp-content/uploads/2024/04/barra-da-lagoa-florianopolis-sc.jpg',
    'campeche-ilha': 'https://barraboatfloripa.com.br/wp-content/uploads/2024/04/ilha-do-campeche-florianopolis-sc.jpg',
    'campeche-embarque': 'https://barraboatfloripa.com.br/wp-content/uploads/2024/03/Screenshot_13-1.jpg',
    'costa-castelinho': 'https://barraboatfloripa.com.br/wp-content/uploads/2024/04/castelinho-costa-da-lagoa-florianopolis-sc.jpg',
    'costa-saquinho': 'https://barraboatfloripa.com.br/wp-content/uploads/2024/03/costacastelinho-e1756865483335.jpg',
    'costa-cachoeira': 'https://barraboatfloripa.com.br/wp-content/uploads/2024/04/cachoeira-costa-da-lagoa-florianopolis-sc.jpg',
    'costa-lagoa': 'https://barraboatfloripa.com.br/wp-content/uploads/2024/03/lagoa-1.jpg',
    'costa-gastronomia': 'https://barraboatfloripa.com.br/wp-content/uploads/2024/03/gastronomia-1.jpg',
}
for k in range(1, 12):
    if k != 5:
        PAGINAS[f'sobre-{k:02d}'] = f'https://barraboatfloripa.com.br/wp-content/uploads/2025/09/{k}.jpg'
paginas = {}
for nome, u in PAGINAS.items():
    if u in man:
        paginas[nome] = salva(os.path.join(BASE, man[u]['melhorada']), os.path.join(PROJ, f'assets/img/paginas/{nome}.webp'), 1400)
    else:
        print('faltou', nome)
json.dump({'galerias': galerias, 'paginas': paginas}, open(os.path.join(PROJ, 'tools/imagens.json'), 'w'), indent=1)
print('ok', len(paginas))
