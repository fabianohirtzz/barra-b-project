<?php
/* Confere se o PHP do servidor monta as mesmas páginas que o gerador estático.
   Usa as lanchas da carga do banco (supabase/seed/01-lanchas-roteiros.sql), que nasceram
   das mesmas fontes do gerador. Diferenças esperadas e ignoradas: o data-fotos da
   galeria, o endereço das datas (data-fonte) e a formatação do JSON-LD (compara o conteúdo).
   Uso: php tools/conferir_php.php            (sai com código 1 se algo diferir) */

require dirname(__DIR__) . '/lib/bb.php';
require dirname(__DIR__) . '/lib/site.php';

$sql = file_get_contents(BB_RAIZ . '/supabase/seed/01-lanchas-roteiros.sql');
preg_match('/\$carga\$(.*?)\$carga\$/s', $sql, $m);
$lanchas = json_decode($m[1], true);
foreach ($lanchas as &$l) $l['descricao'] = null;
unset($l);

// perguntas, avaliações e roteiros da carga 02 (extraídos do HTML por tools/extrair_conteudo.py)
$sql2 = file_get_contents(BB_RAIZ . '/supabase/seed/02-conteudo.sql');
preg_match('/\$carga\$(.*?)\$carga\$/s', $sql2, $m2);
$conteudo = json_decode($m2[1], true);
foreach ($conteudo['roteiros'] as &$r) $r['nome'] = $r['slug'] === 'ilha-do-campeche' ? 'Ilha do Campeche' : 'Costa da Lagoa';
unset($r);
preg_match('/\$carga\$(.*?)\$carga\$/s', file_get_contents(BB_RAIZ . '/supabase/seed/03-instagram.sql'), $m3);
$conteudo['instagram'] = json_decode($m3[1], true);

function normaliza($h)
{
    $lds = [];
    $h = preg_replace_callback('#<script type="application/ld\+json">(.*?)</script>#s', function ($m) use (&$lds) {
        $lds[] = json_decode($m[1], true);
        return '<LD>';
    }, $h);
    $h = preg_replace('# data-fotos="[^"]*"#', '', $h);
    $h = preg_replace('#data-fonte="[^"]*"#', 'data-fonte=""', $h);
    return [$h, $lds];
}

$paginas = ['', 'lanchas/', 'roteiros/', 'ilha-do-campeche/', 'costa-da-lagoa/'];
foreach ($lanchas as $l) $paginas[] = 'lanchas/' . $l['slug'] . '/';
$falhas = 0;
foreach ($paginas as $p) {
    list($st, $php) = bb_render($p, $lanchas, 'api/disponibilidade.php', $conteudo);
    $est = bb_molde($p . 'index.html');   // já troca CRLF por LF
    list($a, $la) = normaliza($php);
    list($b, $lb) = normaliza($est);
    $ok = $st === 200 && $a === $b && $la == $lb;
    if (!$ok) {
        $falhas++;
        echo "DIFERE  /$p  (status $st)\n";
        if ($la != $lb) echo "  JSON-LD diferente\n";
        if ($a !== $b) {
            $x = explode("\n", $a);
            $y = explode("\n", $b);
            for ($i = 0, $n = max(count($x), count($y)), $c = 0; $i < $n && $c < 4; $i++) {
                if ((isset($x[$i]) ? $x[$i] : null) !== (isset($y[$i]) ? $y[$i] : null)) {
                    echo "  linha " . ($i + 1) . "\n    php: " . substr(isset($x[$i]) ? trim($x[$i]) : '(nada)', 0, 220) . "\n    est: " . substr(isset($y[$i]) ? trim($y[$i]) : '(nada)', 0, 220) . "\n";
                    $c++;
                }
            }
        }
    }
}

// lancha inexistente vira 404; escondida (com página antiga) vai para a lista; sem banco, a estática
list($st) = bb_render('lanchas/nao-existe/', $lanchas);
if ($st !== 404) { $falhas++; echo "lancha inexistente devolveu $st\n"; }
list($st, $destino) = bb_render('lanchas/1564/', array_values(array_filter($lanchas, function ($l) { return $l['slug'] !== '1564'; })));
if ($st !== 301 || $destino !== 'lanchas/') { $falhas++; echo "lancha escondida devolveu $st\n"; }
list($st, $h) = bb_render('lanchas/1564/', null);
if ($st !== 200 || $h !== bb_molde('lanchas/1564/index.html')) { $falhas++; echo "sem banco não serviu a estática\n"; }
list($st) = bb_render('../config.local.php', $lanchas);
if ($st !== 404) { $falhas++; echo "caminho com .. devolveu $st\n"; }

// o que a Michele muda no painel aparece no site
$testes = 0;
$confere = function ($ok, $msg) use (&$falhas, &$testes) { $testes++; if (!$ok) { $falhas++; echo "FALHA: $msg\n"; } };
$c2 = $conteudo;
$c2['faq'][0]['pergunta'] = 'Onde fica o embarque & a marina?';
$c2['roteiros'][0]['regras'] = [];
$c2['roteiros'][1]['regras'] = ['Coletes para todos a bordo.'];
$c2['roteiros'][1]['paradas'][] = ['nome' => 'Parada nova', 'texto' => 'Sem foto ainda.'];
$c2['instagram'] = [['video_url' => '/midia/instagram/x.mp4', 'poster_url' => '/midia/instagram/x.webp', 'legenda' => 'Pôr do sol & churrasco', 'largura' => 1080, 'altura' => 1920]];
list(, $h) = bb_render('', $lanchas, 'api/disponibilidade.php', $c2);
$confere(strpos($h, '<summary>Onde fica o embarque &amp; a marina?</summary>') !== false, 'pergunta editada não apareceu no HTML');
$confere(strpos($h, '"name": "Onde fica o embarque & a marina?"') !== false, 'pergunta editada não apareceu no JSON-LD');
$confere(substr_count($h, '<li class="reel">') === 1, 'a home deveria ter só o vídeo novo');
$confere(strpos($h, 'src="midia/instagram/x.mp4" poster="midia/instagram/x.webp" width="1080" height="1920"') !== false, 'vídeo novo sem src, capa ou tamanho certos');
$confere(strpos($h, 'Pôr do sol &amp; churrasco</figcaption>') !== false, 'legenda do vídeo não escapada');
list(, $h) = bb_render('ilha-do-campeche/', $lanchas, 'api/disponibilidade.php', $c2);
$confere(strpos($h, 'aviso-regras') === false, 'regras apagadas continuaram no Campeche');
$confere(strpos($h, '<h2 id="escolha-titulo"') !== false, 'apagar as regras levou junto a seção seguinte');
list(, $h) = bb_render('costa-da-lagoa/', $lanchas, 'api/disponibilidade.php', $c2);
$confere(strpos($h, '<li>Coletes para todos a bordo.</li>') !== false && strpos($h, 'Regras da Costa da Lagoa') !== false, 'regras novas não apareceram na Costa');
$confere(strpos($h, 'rota-v__parada--sem-foto') !== false, 'parada nova sem foto não apareceu');
$confere(strpos($h, '"name": "Parada nova"') !== false, 'parada nova fora do itinerário do JSON-LD');
// fichas dos roteiros: capa da página (todas), /roteiros/ (todas) e home (3 primeiras), com HTML escapado
$c3 = $conteudo;
$c3['roteiros'][1]['fichas'] = [['rotulo' => 'Mar', 'valor' => 'Calmo & raso'], ['rotulo' => 'Diária', 'valor' => '7 horas'], ['rotulo' => 'Saída', 'valor' => 'Lagoa'], ['rotulo' => 'Paradas', 'valor' => '6']];
$c3['roteiros'][0]['fichas'] = [['rotulo' => 'Distância', 'valor' => '11 milhas'], ['rotulo' => '', 'valor' => 'sem rótulo some']];
list(, $h) = bb_render('costa-da-lagoa/', $lanchas, 'api/disponibilidade.php', $c3);
$confere(strpos($h, '<dl class="capa__dados"><div><dt>Mar</dt><dd>Calmo &amp; raso</dd></div><div><dt>Diária</dt><dd>7 horas</dd></div><div><dt>Saída</dt><dd>Lagoa</dd></div><div><dt>Paradas</dt><dd>6</dd></div></dl>') !== false, 'fichas novas fora da capa da Costa');
list(, $h) = bb_render('ilha-do-campeche/', $lanchas, 'api/disponibilidade.php', $c3);
$confere(strpos($h, '<dl class="capa__dados"><div><dt>Distância</dt><dd>11 milhas</dd></div></dl>') !== false, 'ficha sem rótulo deveria sumir da capa do Campeche');
list(, $h) = bb_render('', $lanchas, 'api/disponibilidade.php', $c3);
$confere(preg_match('#costa-da-lagoa/">Costa da Lagoa</a></h3>.*?<dl class="roteiro__dados">
(.*?)
            </dl>#s', $h, $g) && substr_count($g[1], '<div>') === 3 && strpos($g[1], '7 horas') !== false && strpos($g[1], 'Paradas') === false, 'home deveria mostrar as 3 primeiras fichas da Costa');
$confere(preg_match('#ilha-do-campeche/">Ilha do Campeche</a></h3>.*?<dl class="roteiro__dados">
(.*?)
            </dl>#s', $h, $g) && substr_count($g[1], '<div>') === 1 && strpos($g[1], '11 milhas') !== false, 'home: fichas do Campeche não trocaram');
list(, $h) = bb_render('roteiros/', $lanchas, 'api/disponibilidade.php', $c3);
$confere(preg_match('#costa-da-lagoa/">Costa da Lagoa</a></h3>\s*<dl class="comparar__dados">
(.*?)
            </dl>#s', $h, $g) && substr_count($g[1], '<div>') === 4 && strpos($g[1], 'Calmo &amp; raso') !== false, '/roteiros/: fichas da Costa não trocaram');
$c4 = $conteudo;
foreach ($c4['roteiros'] as &$r) $r['fichas'] = null;
unset($r);
list(, $h) = bb_render('roteiros/', $lanchas, 'api/disponibilidade.php', $c4);
$confere($h === bb_render('roteiros/', $lanchas, 'api/disponibilidade.php', $conteudo)[1], 'sem fichas no banco, /roteiros/ deveria ficar como o molde');
$sem = array_values(array_filter($lanchas, function ($l) { return $l['slug'] !== '1564'; }));
list(, $h) = bb_render('costa-da-lagoa/', $sem, 'api/disponibilidade.php', $conteudo);
$confere(preg_match('#data-grade-lanchas>.*?</section>#s', $h, $g) && strpos($g[0], 'lanchas/1564/') === false && substr_count($g[0], '<li class="lancha"') === 4, 'amostra do roteiro com lancha escondida ou sem 4 lanchas');
// popup de reserva: as lanchas do banco nos dois formulários (capa da home e popup) e em todas as páginas
foreach (['', 'sobre/', 'lanchas/3363/', 'ilha-do-campeche/'] as $pg) {
    list(, $h) = bb_render($pg, $sem, 'api/disponibilidade.php', $conteudo);
    $selects = substr_count($h, '<select name="lancha" data-lancha>');
    $confere($selects === ($pg === '' ? 2 : 1) && substr_count($h, 'data-reserva hidden') === 1, "popup de reserva ausente em /$pg");
    preg_match_all('#<select name="lancha" data-lancha>(.*?)</select>#s', $h, $ss);
    $nomes = array_map(function ($l) { return $l['nome']; }, $sem);
    $ok = true;
    foreach ($ss[1] as $bloco) if (substr_count($bloco, '<option') !== count($sem) + 1) $ok = false;
    $confere($ok && count($ss[1]) === $selects, "opções de lancha do popup não vieram do banco em /$pg");
}
echo "$testes testes de mudança\n";

echo $falhas ? "$falhas problema(s)\n" : 'ok: ' . count($paginas) . " páginas iguais à prévia estática\n";
exit($falhas ? 1 : 0);
