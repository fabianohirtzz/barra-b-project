"""Publica o site na ErêHost por FTPS.

Uso (a senha vem de BB_FTP_SENHA ou de Site/ferramentas/ftp-senha.txt, fora do repositório):
    python tools/publicar.py                                 # envia o que mudou para o site oficial (raiz)
    python tools/publicar.py --destino /novo                 # envia para o servidor de teste (novo.)
    python tools/publicar.py --tudo                          # reenvia tudo
    python tools/publicar.py --listar                        # só mostra o que mudaria

A raiz do FTP é o site oficial (barraboatfloripa.com.br) desde a troca de 26/11/2026; o WordPress
antigo está em /home/barraboa/wordpress-antigo/, fora da web. /novo é o servidor de teste.
O config.local.php do servidor nunca é enviado nem apagado.
"""
import argparse
import ftplib
import hashlib
import json
import os
import ssl
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
HOST = 'ftp.barraboatfloripa.com.br'
USUARIO = 'barrab@barraboatfloripa.com.br'
MANIFESTO = RAIZ / '.publicado.json'   # fora do Git: hash do que já está no servidor

# Só vai para o servidor o que é do site. Documentação, banco e ferramentas ficam aqui.
FORA = ('docs/', 'supabase/', 'tools/', '.claude/', '.playwright-mcp/')
FORA_ARQ = {'CLAUDE.md', '.gitignore', 'config.local.example.php', 'config.local.php'}


def arquivos():
    saida = subprocess.run(['git', 'ls-files'], cwd=RAIZ, capture_output=True, text=True, check=True).stdout
    for p in saida.splitlines():
        if p in FORA_ARQ or p.startswith(FORA) or p.endswith('.md'):
            continue
        yield p


def sha1(p):
    return hashlib.sha1((RAIZ / p).read_bytes()).hexdigest()



# Senha do FTP: a variável BB_FTP_SENHA ou o arquivo local fora do repositório
# (E:\Clientes\Barra Boat Floripa\Site\ferramentas\ftp-senha.txt). Nunca no Git.
ARQ_SENHA = Path(__file__).resolve().parents[2] / 'Site' / 'ferramentas' / 'ftp-senha.txt'


def senha_ftp():
    senha = os.environ.get('BB_FTP_SENHA')
    if not senha and ARQ_SENHA.is_file():
        senha = ARQ_SENHA.read_text(encoding='utf-8').strip()
    if not senha:
        sys.exit(f'Defina BB_FTP_SENHA ou grave a senha em {ARQ_SENHA}.')
    return senha

def conecta(senha):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False          # o certificado do FTP é o do servidor da ErêHost
    ctx.verify_mode = ssl.CERT_NONE
    ftp = ftplib.FTP_TLS(HOST, timeout=60, context=ctx)
    ftp.login(USUARIO, senha)
    ftp.prot_p()
    return ftp


def garante_pasta(ftp, pasta, criadas):
    partes = [x for x in pasta.split('/') if x]
    atual = ''
    for parte in partes:
        atual += '/' + parte
        if atual in criadas:
            continue
        try:
            ftp.mkd(atual)
        except ftplib.error_perm:
            pass                         # já existe
        criadas.add(atual)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--destino', default='/')
    ap.add_argument('--producao', action='store_true', help='sem efeito (era a trava antes da troca)')
    ap.add_argument('--tudo', action='store_true')
    ap.add_argument('--listar', action='store_true')
    a = ap.parse_args()

    destino = '/' + a.destino.strip('/')

    chave = HOST + destino
    feito = json.loads(MANIFESTO.read_text()) if MANIFESTO.exists() else {}
    ja = {} if a.tudo else feito.get(chave, {})
    todos = {p: sha1(p) for p in arquivos()}
    mudou = [p for p, h in todos.items() if ja.get(p) != h]
    print(f'{len(mudou)} de {len(todos)} arquivos para enviar a {destino}')
    if a.listar or not mudou:
        for p in mudou:
            print('  ', p)
        return

    senha = senha_ftp()
    ftp = conecta(senha)
    criadas = set()
    registro = feito.setdefault(chave, {})
    try:
        for i, p in enumerate(mudou, 1):
            alvo = f'{destino}/{p}'
            for tentativa in range(4):
                try:
                    garante_pasta(ftp, alvo.rsplit('/', 1)[0], criadas)
                    with open(RAIZ / p, 'rb') as f:
                        ftp.storbinary(f'STOR {alvo}', f)
                    break
                except (EOFError, OSError, ftplib.error_temp):
                    # a ErêHost derruba a sessão depois de algumas centenas de envios
                    if tentativa == 3:
                        raise
                    try:
                        ftp.close()
                    except Exception:
                        pass
                    ftp = conecta(senha)
            registro[p] = todos[p]
            if i % 25 == 0 or i == len(mudou):
                print(f'  {i}/{len(mudou)}')
                MANIFESTO.write_text(json.dumps(feito, indent=0))
    finally:
        MANIFESTO.write_text(json.dumps(feito, indent=0))
        ftp.quit()
    print('ok')


if __name__ == '__main__':
    main()
