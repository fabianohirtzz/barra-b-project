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

$paginas = ['', 'lanchas/', 'ilha-do-campeche/', 'costa-da-lagoa/'];
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

// lancha escondida ou inexistente vira 404; sem banco, a estática
list($st) = bb_render('lanchas/nao-existe/', $lanchas);
if ($st !== 404) { $falhas++; echo "lancha inexistente devolveu $st\n"; }
list($st) = bb_render('lanchas/1564/', array_values(array_filter($lanchas, function ($l) { return $l['slug'] !== '1564'; })));
if ($st !== 404) { $falhas++; echo "lancha escondida devolveu $st\n"; }
list($st, $h) = bb_render('lanchas/1564/', null);
if ($st !== 200 || $h !== bb_molde('lanchas/1564/index.html')) { $falhas++; echo "sem banco não serviu a estática\n"; }
list($st) = bb_render('../config.local.php', $lanchas);
if ($st !== 404) { $falhas++; echo "caminho com .. devolveu $st\n"; }

echo $falhas ? "$falhas problema(s)\n" : 'ok: ' . count($paginas) . " páginas iguais à prévia estática\n";
exit($falhas ? 1 : 0);
