"""Gera supabase/seed/01-lanchas-roteiros.sql com as 17 lanchas e os 2 roteiros do site.

Lê as MESMAS fontes do gerador das páginas (cards da home, lanchas.json, regras de itens,
paradas dos roteiros), então o banco nasce igual ao site da prévia.
Uso: python tools/gerar_carga.py
A carga usa "on conflict do nothing": rodar de novo não apaga o que a Michele editou no painel.
"""
import json, os, re

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = open(os.path.join(PROJ, 'tools/gerar_paginas.py'), encoding='utf-8').read()

# 1) definições do gerador (até antes de gerar as páginas): CARDS, ORDEM, L_JSON, itens_de
ns = {'__file__': os.path.join(PROJ, 'tools/gerar_paginas.py')}
exec(SRC[:SRC.index('# ================================================================ PÁGINAS')], ns)

# 2) os dois pagina_roteiro(...), capturando os argumentos em vez de gerar HTML
ROTEIROS = []
bloco = SRC[SRC.index("pagina_roteiro(\n    'ilha-do-campeche'"):SRC.index('# ---------------------------------------------------------------- /sobre/')]
exec(bloco, {**ns, 'EMPRESA_REF': {}, 'DOM': '', 'capa_foto': lambda *a, **k: '', 'dados_html': lambda p: p,
             'pagina_roteiro': lambda *a: ROTEIROS.append(a)})

raiz = lambda p: '/' + p.lstrip('/')

lanchas = []
for ordem, s in enumerate(ns['ORDEM']):
    c, l = ns['CARDS'][s], ns['L_JSON'][s]
    pasta = os.path.join(PROJ, 'assets/img/lanchas', s)
    fotos = [{'url': raiz(f'assets/img/lanchas/{s}/{f}'), 'url_p': raiz(f'assets/img/lanchas/{s}/{f[:-5]}-p.webp'),
              'alt': f"{c['nome']}, foto {int(f[:2])}"}
             for f in sorted(os.listdir(pasta)) if re.fullmatch(r'\d\d\.webp', f)] if os.path.isdir(pasta) else []
    lanchas.append({'slug': s, 'legado_id': l['id'], 'nome': c['nome'], 'pes': float(c['pes'].replace(',', '.')),
                    'passageiros': c['pax'], 'regiao': c['regiao'], 'itens': [t for _, t in ns['itens_de'](s)],
                    'capa_url': raiz(f'assets/img/lanchas/{s}.webp'), 'fotos': fotos, 'ordem': ordem})

EXTRA = {  # o que no gerador fica dentro do HTML da capa
    'ilha-do-campeche': {'resumo': 'O roteiro mais pedido da Barra Boat: água cristalina e areia branca, no lugar que muita gente chama de Caribe brasileiro.',
                         'duracao_horas': 8, 'distancia_milhas': 10.4, 'trajeto_texto': '30 a 40 min por trajeto',
                         'palavras_chave': 'campeche, ilha do campeche, caribe'},
    'costa-da-lagoa': {'resumo': 'Um dia em águas calmas na Lagoa da Conceição, com cachoeira, prainhas e restaurantes de frutos do mar à beira da água.',
                       'duracao_horas': 6, 'distancia_milhas': None, 'trajeto_texto': 'Águas calmas, saída da Barra ou da Lagoa',
                       'palavras_chave': 'costa da lagoa, lagoa, lagoa da conceição, cachoeira'},
}
roteiros = []
for ordem, a in enumerate(ROTEIROS):
    slug, nome, _, _, paradas, fotos, _, regras_html = a[:8]
    roteiros.append({'slug': slug, 'nome': nome, **EXTRA[slug], 'ordem': ordem,
                     'paradas': [{'nome': n, 'texto': t, 'foto': raiz(f), 'alt': al} for n, t, f, al in paradas],
                     'fotos': [{'url': raiz(f), 'alt': al} for f, al, _ in fotos],
                     'regras': re.findall(r'<li>(.*?)</li>', regras_html)})

assert len(lanchas) == 17 and len(roteiros) == 2, (len(lanchas), len(roteiros))
dump = lambda x: json.dumps(x, ensure_ascii=False, indent=1)
assert '$carga$' not in dump(lanchas) + dump(roteiros)

sql = f"""-- Carga inicial: 17 lanchas e 2 roteiros, iguais ao site da prévia.
-- GERADO por tools/gerar_carga.py. Não editar à mão. Rodar depois das migrations 01 a 05.
-- "on conflict do nothing": rodar de novo não sobrescreve o que foi editado no painel.
-- Todas entram como lancha própria (parceiro_id nulo); a Michele marca o dono de cada uma no painel.

insert into public.bb_lanchas (slug, legado_id, nome, pes, passageiros, regiao, itens, capa_url, fotos, ordem)
select slug, legado_id, nome, pes, passageiros, regiao, itens, capa_url, fotos, ordem
  from jsonb_to_recordset($carga${dump(lanchas)}$carga$::jsonb)
    as x(slug text, legado_id int, nome text, pes numeric, passageiros int, regiao text, itens jsonb, capa_url text, fotos jsonb, ordem int)
on conflict (slug) do nothing;

insert into public.bb_roteiros (slug, nome, resumo, duracao_horas, distancia_milhas, trajeto_texto, paradas, regras, fotos, palavras_chave, ordem)
select slug, nome, resumo, duracao_horas, distancia_milhas, trajeto_texto, paradas, regras, fotos, palavras_chave, ordem
  from jsonb_to_recordset($carga${dump(roteiros)}$carga$::jsonb)
    as x(slug text, nome text, resumo text, duracao_horas numeric, distancia_milhas numeric, trajeto_texto text,
         paradas jsonb, regras jsonb, fotos jsonb, palavras_chave text, ordem int)
on conflict (slug) do nothing;
"""
os.makedirs(os.path.join(PROJ, 'supabase/seed'), exist_ok=True)
saida = os.path.join(PROJ, 'supabase/seed/01-lanchas-roteiros.sql')
open(saida, 'w', encoding='utf-8', newline='\n').write(sql)
print('ok', len(lanchas), 'lanchas,', len(roteiros), 'roteiros ->', saida)
for l in lanchas:
    print(f"  {l['ordem']:2} {l['slug']:24} {l['nome']:22} {l['passageiros']:3} pax {l['pes']:5} pés  {len(l['itens']):2} itens  {len(l['fotos'])} fotos")
