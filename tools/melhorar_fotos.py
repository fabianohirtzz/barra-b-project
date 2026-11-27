"""Melhora com IA as fotos pequenas que a equipe enviou pelo painel.

O painel guarda o quadrado original de toda foto com menos de 1400 px em
fotos/lanchas/<slug>/orig/<nome>.jpg (e marca melhorar: true no banco). Este script, rodado
aqui no computador (a IA não roda na hospedagem):
  1. lista esses originais pelo FTP;
  2. reduz a entrada para no máx. 560 px, aplica o Real-ESRGAN 4x e reduz para 1400 px;
  3. sobe <nome>-ia.webp (1400) e <nome>-ia-p.webp (480) na pasta da lancha.
O cron do servidor (cron/videos.php, a cada 5 min) vê o -ia.webp, troca a foto no banco, tira o
"vai melhorar", refaz a capa se for a primeira foto e apaga o original e a versão pequena.
Nome novo de propósito: o celular não fica com a foto antiga guardada.

Uso:
    python tools/melhorar_fotos.py                          # melhora tudo o que está na fila
    python tools/melhorar_fotos.py --listar                 # só mostra a fila
"""
import argparse
import io
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from publicar import conecta, senha_ftp  # noqa: E402

BASE = '/fotos/lanchas'
ENTRADA_MAX, LADO, LADO_MINI = 560, 1400, 480


def fila(ftp):
    out = []
    for slug, fa in ftp.mlsd(BASE):
        if fa.get('type') != 'dir' or slug in ('.', '..'):
            continue
        try:
            nomes = {n for n, _ in ftp.mlsd(f'{BASE}/{slug}')}
            origs = [n for n, f in ftp.mlsd(f'{BASE}/{slug}/orig') if n.endswith('.jpg')]
        except Exception:
            continue
        for o in sorted(origs):
            nome = o[:-4]
            if f'{nome}-ia.webp' not in nomes:   # já melhorada, esperando o cron trocar
                out.append((slug, nome))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--listar', action='store_true')
    a = ap.parse_args()
    ftp = conecta(senha_ftp())
    itens = fila(ftp)
    print(f'{len(itens)} foto(s) na fila')
    for slug, nome in itens:
        print('  ', slug, nome)
    if a.listar or not itens:
        ftp.quit()
        return

    from PIL import Image
    import esrgan
    for k, (slug, nome) in enumerate(itens, 1):
        t = time.time()
        buf = io.BytesIO()
        ftp.retrbinary(f'RETR {BASE}/{slug}/orig/{nome}.jpg', buf.write)
        ftp.close()   # a IA leva mais de um minuto: a ErêHost derrubaria a sessão parada
        im = Image.open(io.BytesIO(buf.getvalue())).convert('RGB')
        entrada = esrgan.reduz(im, ENTRADA_MAX)
        grande = esrgan.reduz(esrgan.melhora(entrada), LADO)
        mini = grande.resize((LADO_MINI, round(grande.height * LADO_MINI / grande.width)), Image.LANCZOS)
        arquivos = {}
        for sufixo, img, q in (('-ia.webp', grande, 84), ('-ia-p.webp', mini, 80)):
            b = io.BytesIO()
            img.save(b, 'WEBP', quality=q, method=6)
            arquivos[nome + sufixo] = b.getvalue()
        ftp = conecta(senha)
        # a miniatura sobe antes: o cron só olha o -ia.webp grande
        for n in sorted(arquivos, key=lambda x: not x.endswith('-p.webp')):
            ftp.storbinary(f'STOR {BASE}/{slug}/{n}', io.BytesIO(arquivos[n]))
        print(f'[{k}/{len(itens)}] {slug}/{nome}: {im.width}px -> {grande.width}px em {time.time() - t:.0f} s')
    ftp.quit()
    print('Pronto. Em até 5 minutos o servidor troca as fotos no site.')


if __name__ == '__main__':
    main()
