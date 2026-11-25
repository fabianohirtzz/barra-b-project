"""Gera supabase/seed/02-conteudo.sql com o conteúdo que hoje está fixo no HTML:
perguntas frequentes e avaliações da home, paradas e regras de cada roteiro.
Depois da carga o painel passa a mandar nesse conteúdo e o PHP monta os trechos.
O tools/conferir_php.php usa o mesmo JSON para provar que nada muda na tela.

Uso: python tools/extrair_conteudo.py
"""
import html
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def texto(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s)).strip()


def faq(h):
    lista = re.search(r'<div class="faq__lista">(.*?)\n      </div>', h, re.S).group(1)
    out = []
    for i, (p, r) in enumerate(re.findall(r'<summary>(.*?)</summary>\s*(.*?)\s*</details>', lista, re.S)):
        paragrafos = [texto(x) for x in re.findall(r'<p>(.*?)</p>', r, re.S)]
        out.append({'pergunta': texto(p), 'resposta': '\n\n'.join(paragrafos), 'ordem': i})
    return out


def avaliacoes(h):
    gal = re.search(r'<div class="avaliacoes__galeria">(.*?)\n      </div>', h, re.S).group(1)
    out = []
    for i, (attrs, q, nome, data) in enumerate(re.findall(
            r'<figure class="avaliacao[^"]*"([^>]*)>\s*<blockquote>(.*?)</blockquote>\s*<figcaption>.*?<b>(.*?)</b>(.*?)</span></figcaption>', gal, re.S)):
        m = re.search(r'lang="([a-z-]+)"', attrs)
        out.append({'nome': texto(nome), 'texto': texto(q), 'nota': 5, 'data_label': texto(data),
                    'idioma': m.group(1) if m else 'pt', 'ordem': i})
    return out


def instagram(h):
    lista = re.search(r'<ul class="trilho__lista insta__lista">(.*?)\n        </ul>', h, re.S).group(1)
    out = []
    for i, (src, poster, w, alt) in enumerate(re.findall(
            r'<video class="reel__video" src="([^"]+)" poster="([^"]+)" width="(\d+)" height="\d+"[^>]*aria-label="([^"]*)"', lista)):
        hgt = re.findall(r'<video class="reel__video"[^>]*height="(\d+)"', lista)[i]
        out.append({'video_url': '/' + src, 'poster_url': '/' + poster, 'legenda': html.unescape(alt),
                    'largura': int(w), 'altura': int(hgt), 'ordem': i})
    return out


def roteiro(slug):
    h = (RAIZ / slug / 'index.html').read_text(encoding='utf-8')
    paradas = []
    for n, t, foto, alt in re.findall(
            r'<h3>(.*?)</h3><p>(.*?)</p></div>\s*<img class="rota-v__foto" src="\.\./([^"]+)" alt="([^"]*)"', h, re.S):
        paradas.append({'nome': texto(n), 'texto': texto(t), 'foto': '/' + foto, 'alt': html.unescape(alt)})
    regras = []
    m = re.search(r'<div class="aviso-regras">.*?<ul>(.*?)</ul>', h, re.S)
    if m:
        regras = [texto(x) for x in re.findall(r'<li>(.*?)</li>', m.group(1), re.S)]
    return {'slug': slug, 'paradas': paradas, 'regras': regras}


def main():
    h = (RAIZ / 'index.html').read_text(encoding='utf-8')
    dados = {'faq': faq(h), 'avaliacoes': avaliacoes(h), 'roteiros': [roteiro('ilha-do-campeche'), roteiro('costa-da-lagoa')]}
    j = json.dumps(dados, ensure_ascii=False, indent=1)
    sql = f"""-- Carga do conteúdo que estava fixo no HTML (gerado por tools/extrair_conteudo.py).
-- Perguntas frequentes e avaliações da home; paradas e regras dos roteiros.
-- Só preenche o que está vazio: rodar de novo não apaga o que a Michele mudou no painel.
-- Rodar inteiro de uma vez (a tabela temporária vive só nesta execução).
-- Depende da migração 2026-11-24-10-conteudo.sql (coluna idioma das avaliações).
drop table if exists _carga;
create temp table _carga as select $carga${j}$carga$::jsonb as d;

insert into public.bb_faq (pergunta, resposta, ordem)
select x->>'pergunta', x->>'resposta', (x->>'ordem')::int from _carga c, jsonb_array_elements(c.d->'faq') x
 where not exists (select 1 from public.bb_faq);

insert into public.bb_avaliacoes (nome, texto, nota, data_label, idioma, ordem)
select x->>'nome', x->>'texto', (x->>'nota')::smallint, x->>'data_label', x->>'idioma', (x->>'ordem')::int
  from _carga c, jsonb_array_elements(c.d->'avaliacoes') x
 where not exists (select 1 from public.bb_avaliacoes);

-- roteiros: paradas e regras como estão hoje no site (inclui a regra dos pets de 19/11).
-- Só antes de 26/11: rodar de novo depois disso não desfaz o que a Michele mudou no painel.
update public.bb_roteiros r set paradas = x->'paradas', regras = x->'regras'
  from _carga c, jsonb_array_elements(c.d->'roteiros') x
 where r.slug = x->>'slug' and now() < '2026-11-26';

drop table _carga;

select (select count(*) from public.bb_faq) as perguntas, (select count(*) from public.bb_avaliacoes) as avaliacoes,
       (select string_agg(slug || ': ' || jsonb_array_length(paradas) || ' paradas, ' || jsonb_array_length(regras) || ' regras', '; ') from public.bb_roteiros) as roteiros;
"""
    vids = instagram(h)
    jv = json.dumps(vids, ensure_ascii=False, indent=1)
    (RAIZ / 'supabase' / 'seed' / '03-instagram.sql').write_text(f"""-- Os vídeos do Instagram que estavam fixos na home (gerado por tools/extrair_conteudo.py).
-- Só entra se a tabela estiver vazia. Depende da migração 2026-11-25-11-instagram.sql.
insert into public.bb_instagram (video_url, poster_url, legenda, largura, altura, ordem, pronto)
select x->>'video_url', x->>'poster_url', x->>'legenda', (x->>'largura')::int, (x->>'altura')::int, (x->>'ordem')::int, true
  from jsonb_array_elements($carga${jv}$carga$::jsonb) x
 where not exists (select 1 from public.bb_instagram);

select count(*) as videos from public.bb_instagram;
""", encoding='utf-8')
    print(f"{len(vids)} vídeos")
    destino = RAIZ / 'supabase' / 'seed' / '02-conteudo.sql'
    destino.write_text(sql, encoding='utf-8')
    print(f"{len(dados['faq'])} perguntas, {len(dados['avaliacoes'])} avaliações, "
          + ', '.join(f"{r['slug']}: {len(r['paradas'])} paradas e {len(r['regras'])} regras" for r in dados['roteiros']))


if __name__ == '__main__':
    main()
