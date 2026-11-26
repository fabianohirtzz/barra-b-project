<?php
/* Barra Boat Floripa | llms.php
   O /llms.txt do servidor (o .htaccess manda para cá): o texto do llms.txt com os números da frota
   que estão no painel (quantas lanchas, pés e pessoas), como as páginas. Sem banco, vale o arquivo.
   /llms-full.txt (?completo=1): o mesmo começo e, saindo do banco, cada lancha ativa (pés, pessoas,
   região, itens a bordo), as paradas e regras de cada roteiro e as perguntas frequentes. É o texto que
   as IAs (ChatGPT, Perplexity, Gemini) leem para responder sobre a empresa com os dados de hoje. */

require_once __DIR__ . '/lib/bb.php';
require_once __DIR__ . '/lib/site.php';

header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: public, max-age=3600');
$txt = (string) file_get_contents(__DIR__ . '/llms.txt');
$lanchas = bb_lanchas();
$txt = $lanchas ? bb_textos_frota($txt, bb_frota($lanchas)) : $txt;
if (empty($_GET['completo']) || !$lanchas) { echo $txt; exit; }

function llms_limpa($s)
{
    return trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags((string) $s), ENT_QUOTES, 'UTF-8')));
}

// tira o bloco que aponta para esta própria versão completa
$txt = preg_replace('/\n## Mais detalhes\n.*?(?=\n## |\z)/s', "\n", $txt);
$out = rtrim($txt) . "\n\n## Lanchas\n";
foreach ($lanchas as $l) {
    $dados = [];
    if (!empty($l['pes'])) $dados[] = str_replace('.', ',', (string) (float) $l['pes']) . ' pés';
    if (!empty($l['passageiros'])) $dados[] = 'até ' . (int) $l['passageiros'] . ' pessoas';
    if (!empty($l['regiao'])) $dados[] = 'região ' . llms_limpa($l['regiao']);
    $out .= "\n### " . llms_limpa($l['nome']) . "\n";
    $out .= '- Página: ' . BB_DOM . 'lanchas/' . $l['slug'] . "/\n";
    if ($dados) $out .= '- ' . ucfirst(implode(', ', $dados)) . ".\n";
    $itens = array_values(array_filter(array_map('llms_limpa', (array) $l['itens'])));
    if ($itens) $out .= '- A bordo: ' . implode('; ', $itens) . ".\n";
    if (!empty($l['descricao'])) $out .= '- ' . llms_limpa($l['descricao']) . "\n";
}

$c = bb_conteudo();
if (is_array($c)) {
    foreach ((array) $c['roteiros'] as $r) {
        // só os roteiros com página no site (os novos do painel podem estar em rascunho ou desativados)
        if (empty($r['nome']) || !in_array($r['slug'], ['ilha-do-campeche', 'costa-da-lagoa'], true)) continue;
        $out .= "\n## Roteiro: " . llms_limpa($r['nome']) . "\n";
        $out .= '- Página: ' . BB_DOM . $r['slug'] . "/\n";
        foreach ((array) (isset($r['fichas']) ? $r['fichas'] : []) as $f) {
            if (!empty($f['rotulo']) && !empty($f['valor'])) $out .= '- ' . llms_limpa($f['rotulo']) . ': ' . llms_limpa($f['valor']) . "\n";
        }
        $par = (array) (isset($r['paradas']) ? $r['paradas'] : []);
        if ($par) {
            $out .= "\nParadas:\n";
            foreach ($par as $p) $out .= '- ' . llms_limpa($p['nome']) . (empty($p['texto']) ? '' : ': ' . llms_limpa($p['texto'])) . "\n";
        }
        $reg = array_values(array_filter(array_map('llms_limpa', (array) (isset($r['regras']) ? $r['regras'] : []))));
        if ($reg) {
            $out .= "\nRegras:\n";
            foreach ($reg as $x) $out .= '- ' . $x . "\n";
        }
    }
    if (!empty($c['faq'])) {
        $out .= "\n## Perguntas frequentes\n";
        foreach ($c['faq'] as $q) $out .= "\n### " . llms_limpa($q['pergunta']) . "\n" . llms_limpa($q['resposta']) . "\n";
    }
}
echo $out;
