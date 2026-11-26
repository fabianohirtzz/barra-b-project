"""Avisa Bing, Yandex, Seznam e Naver (IndexNow) de que as páginas do site mudaram.

O Google não usa IndexNow: no Google, o caminho é o sitemap no Search Console.
A chave é pública por desenho: o arquivo <chave>.txt fica na raiz do site e prova que o domínio é nosso.

Uso (depois da troca para o domínio oficial):
    python tools/indexnow.py                 # todas as URLs do /sitemap.xml no ar (216)
    python tools/indexnow.py /lanchas/x/ ... # só estas, nos 9 idiomas
    python tools/indexnow.py --listar        # só mostra o que mandaria
"""
import glob
import json
import os
import re
import sys
import urllib.request

HOST = 'barraboatfloripa.com.br'
DOM = f'https://{HOST}/'
IDIOMAS = ['', 'es/', 'en/', 'fr/', 'de/', 'it/', 'nl/', 'ja/', 'zh/']
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def chave():
    for f in glob.glob(os.path.join(RAIZ, '*.txt')):
        n = os.path.basename(f)[:-4]
        if re.fullmatch(r'[0-9a-f]{32}', n):
            return n
    sys.exit('arquivo de chave <32 hex>.txt não encontrado na raiz do repositório')


def urls_do_sitemap():
    req = urllib.request.Request(DOM + 'sitemap.xml', headers={'User-Agent': 'BarraBoat-IndexNow/1.0'})
    xml = urllib.request.urlopen(req, timeout=30).read().decode('utf-8')
    return re.findall(r'<loc>(.*?)</loc>', xml)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if args:
        urls = [DOM + i + a.strip('/') + ('/' if a.strip('/') else '') for a in args for i in IDIOMAS]
        urls = [u.replace(DOM + '/', DOM) for u in urls]
    else:
        urls = urls_do_sitemap()
    k = chave()
    print(f'{len(urls)} URLs, chave {k}')
    if '--listar' in sys.argv:
        print('\n'.join(urls))
        return
    # confere se a chave está no ar antes de mandar (sem ela o IndexNow recusa tudo)
    no_ar = urllib.request.urlopen(f'{DOM}{k}.txt', timeout=30).read().decode().strip()
    if no_ar != k:
        sys.exit(f'{DOM}{k}.txt não devolve a chave: publique o arquivo na raiz antes')
    corpo = json.dumps({'host': HOST, 'key': k, 'keyLocation': f'{DOM}{k}.txt', 'urlList': urls}).encode()
    req = urllib.request.Request('https://api.indexnow.org/indexnow', data=corpo, method='POST',
                                 headers={'Content-Type': 'application/json; charset=utf-8'})
    try:
        r = urllib.request.urlopen(req, timeout=60)
        print('IndexNow respondeu', r.status, '(200 ou 202 = recebido)')
    except urllib.error.HTTPError as e:
        print('IndexNow recusou:', e.code, e.read().decode(errors='replace')[:300])
        sys.exit(1)


if __name__ == '__main__':
    main()
