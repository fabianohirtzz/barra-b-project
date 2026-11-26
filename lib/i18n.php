<?php
/* Barra Boat Floripa | lib/i18n.php
   Site em outros idiomas. A página é montada em português (bb_render) e, no fim, este arquivo
   troca cada trecho de texto pela tradução do idioma pedido. Assim o gerador, o molde e o
   conteúdo do painel continuam só em português, e a tradução vale para tudo que aparece.

   De onde vem a tradução de cada trecho, nesta ordem:
     1. i18n/<idioma>.json   (no Git: o site inteiro traduzido por tools/i18n.php, revisável)
     2. traducoes/<idioma>.json (no servidor, fora do Git: o que o cron/traduz.php traduziu depois,
        em geral texto novo que a equipe escreveu no painel)
   Trecho sem tradução sai em português e entra na fila (traducoes/faltam.json); o cron traduz
   em até 15 minutos.

   O trecho é o texto de um bloco com as marcas de dentro (<b>, <a>, <span>...) trocadas por
   etiquetas curtas (<a1>, </a1>, <br2/>), o que deixa a chave igual em qualquer profundidade de
   pasta (o href muda, a etiqueta não). Também entram alt, title, aria-label, placeholder, as
   metas de descrição, o JSON-LD e o texto dos links do WhatsApp. Compatível com PHP 7.4+. */

/* código na URL => [hreflang/lang, nome no próprio idioma, og:locale, nome em português] */
const BB_IDIOMAS = [
    'pt' => ['pt-BR', 'Português', 'pt_BR', 'português'],
    'es' => ['es', 'Español', 'es_LA', 'espanhol'],
    'en' => ['en', 'English', 'en_US', 'inglês'],
    'fr' => ['fr', 'Français', 'fr_FR', 'francês'],
    'de' => ['de', 'Deutsch', 'de_DE', 'alemão'],
    'it' => ['it', 'Italiano', 'it_IT', 'italiano'],
    'nl' => ['nl', 'Nederlands', 'nl_NL', 'holandês'],
    'ja' => ['ja', '日本語', 'ja_JP', 'japonês'],
    'zh' => ['zh-Hans', '简体中文', 'zh_CN', 'chinês simplificado'],
];
define('BB_I18N_DIR', BB_RAIZ . '/i18n');
define('BB_TRAD_DIR', BB_RAIZ . '/traducoes');

/* marcas que ficam dentro de um trecho; qualquer outra marca separa trechos */
const BB_INLINE = ['a', 'b', 'strong', 'em', 'i', 'small', 'span', 'br', 'abbr', 'time', 'sup', 'sub', 'mark', 's', 'u', 'q', 'cite', 'wbr', 'bdi', 'data'];
const BB_VAZIAS = ['br', 'wbr', 'img', 'input', 'meta', 'link', 'source', 'hr', 'area', 'base', 'col', 'embed', 'param', 'track'];
/* atributos com texto para pessoas */
const BB_ATRIBUTOS = ['alt', 'title', 'aria-label', 'placeholder'];
/* campos de texto do JSON-LD */
const BB_LD_CAMPOS = ['name', 'description', 'text', 'reviewBody', 'headline', 'alternateName', 'disambiguatingDescription', 'slogan'];
const BB_LD_SEM_TRADUCAO = ['Person', 'PostalAddress', 'GeoCoordinates', 'Organization', 'Brand', 'ImageObject'];

function bb_idioma_valido($c)
{
    return is_string($c) && isset(BB_IDIOMAS[$c]);
}

/* "es/lanchas/x/" => ['es', 'lanchas/x/']; sem prefixo => ['pt', ...] */
function bb_separa_idioma($p)
{
    $p = ltrim((string) $p, '/');
    if (preg_match('#^([a-z]{2})(?:/(.*))?$#', $p, $m) && $m[1] !== 'pt' && bb_idioma_valido($m[1])) return [$m[1], isset($m[2]) ? $m[2] : ''];
    return ['pt', $p];
}

function bb_url_idioma($idioma, $p)
{
    return BB_DOM . ($idioma === 'pt' ? '' : $idioma . '/') . ltrim($p, '/');
}

/* ---------- normalização da chave ---------- */
function bb_i18n_chave($t)
{
    return trim(preg_replace('/\s+/u', ' ', $t));
}

function bb_i18n_tem_letra($t)
{
    // só número, sinal ou entidade não vale tradução ("4,8", "17", "&nbsp;")
    $s = preg_replace('/&[a-z#0-9]+;/i', '', strip_tags(preg_replace('#</?[a-z]+\d+/?>#', '', $t)));
    return (bool) preg_match('/\p{L}{2,}/u', $s);
}

/* ---------- dicionários ---------- */
function bb_i18n_dic($idioma)
{
    static $memo = [];
    if (isset($memo[$idioma])) return $memo[$idioma];
    $d = [];
    foreach ([BB_I18N_DIR . "/$idioma.json", BB_TRAD_DIR . "/$idioma.json"] as $arq) {
        if (!is_file($arq)) continue;
        $j = json_decode(file_get_contents($arq), true);
        if (is_array($j)) $d += $j;   // o do Git vale primeiro (revisado)
    }
    return $memo[$idioma] = $d;
}

/* Procura a tradução; sem ela, anota na lista do que falta e devolve null. */
function bb_i18n_busca($idioma, $chave)
{
    $d = bb_i18n_dic($idioma);
    if (isset($d[$chave]) && $d[$chave] !== '') return $d[$chave];
    $GLOBALS['bb_i18n_faltam'][$chave] = true;
    return null;
}

/* ---------- etiquetas: <a href="..."> vira <a1>, </a> vira </a1>, <br> vira <br2/> ---------- */

/* $tokens: lista de strings (texto ou marca inline). Devolve [chave, mapa etiqueta=>original] */
function bb_i18n_etiqueta(array $tokens)
{
    $n = 0;
    $pilha = [];
    $mapa = [];
    $out = '';
    foreach ($tokens as $t) {
        if ($t === '' || $t[0] !== '<') { $out .= $t; continue; }
        if (!preg_match('#^<(/?)([a-zA-Z][a-zA-Z0-9]*)#', $t, $m)) { $out .= $t; continue; }
        $nome = strtolower($m[2]);
        if ($m[1] === '/') {
            // fecha a última aberta com o mesmo nome
            $num = null;
            for ($i = count($pilha) - 1; $i >= 0; $i--) if ($pilha[$i][0] === $nome) { $num = $pilha[$i][1]; array_splice($pilha, $i, 1); break; }
            if ($num === null) $num = ++$n;
            $et = "</$nome$num>";
        } elseif (in_array($nome, BB_VAZIAS, true) || substr($t, -2) === '/>') {
            $num = ++$n;
            $et = "<$nome$num/>";
        } else {
            $num = ++$n;
            $pilha[] = [$nome, $num];
            $et = "<$nome$num>";
        }
        $mapa[$et] = $t;
        $out .= $et;
    }
    return [bb_i18n_chave($out), $mapa];
}

/* Confere se a tradução tem as mesmas etiquetas e devolve o HTML com as marcas originais. */
function bb_i18n_desetiqueta($trad, array $mapa)
{
    preg_match_all('#</?[a-z]+\d+/?>#', $trad, $m);
    $achadas = $m[0];
    $esperadas = array_keys($mapa);
    sort($achadas);
    sort($esperadas);
    if ($achadas !== $esperadas) return null;
    // fora das etiquetas não pode haver marca de HTML
    if (preg_match('#<(?![/]?[a-z]+\d+/?>)#', $trad)) return null;
    return strtr($trad, $mapa);
}

/* ---------- a página inteira ---------- */

/* Separa o HTML em pedaços: comentário, bloco cru (script, style, svg...), marca ou texto. */
function bb_i18n_tokens($html)
{
    preg_match_all('#<!--.*?-->|<(script|style|svg|textarea|pre|code|template)\b[^>]*>.*?</\1\s*>|<[!/]?[a-zA-Z][^>]*>|[^<]+|<#s', $html, $m);
    return $m[0];
}

function bb_i18n_nome_marca($t)
{
    return preg_match('#^</?([a-zA-Z][a-zA-Z0-9-]*)#', $t, $m) ? strtolower($m[1]) : null;
}

/* Traduz os atributos de texto de uma marca. */
function bb_i18n_attrs($tag, $idioma)
{
    if (!preg_match('#^<[a-zA-Z]#', $tag)) return $tag;
    $tag = preg_replace_callback('#\s(' . implode('|', BB_ATRIBUTOS) . ')="([^"]*)"#', function ($m) use ($idioma) {
        $txt = html_entity_decode($m[2], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $ch = bb_i18n_chave($txt);
        if (!bb_i18n_tem_letra($ch)) return $m[0];
        $t = bb_i18n_busca($idioma, $ch);
        return $t === null ? $m[0] : ' ' . $m[1] . '="' . htmlspecialchars($t, ENT_QUOTES, 'UTF-8') . '"';
    }, $tag);
    // metas de descrição e de compartilhamento
    if (preg_match('#^<meta\b[^>]*\b(name|property)="(description|og:title|og:description|twitter:title|twitter:description)"#', $tag)) {
        $tag = preg_replace_callback('#\scontent="([^"]*)"#', function ($m) use ($idioma) {
            $ch = bb_i18n_chave(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $t = bb_i18n_chave($ch) !== '' && bb_i18n_tem_letra($ch) ? bb_i18n_busca($idioma, $ch) : null;
            return $t === null ? $m[0] : ' content="' . htmlspecialchars($t, ENT_QUOTES, 'UTF-8') . '"';
        }, $tag);
    }
    // mensagem pronta dos links do WhatsApp (vale quando o JavaScript não roda)
    $tag = preg_replace_callback('#(\shref="https://wa\.me/\d+\?text=)([^"]*)"#', function ($m) use ($idioma) {
        $txt = rawurldecode(html_entity_decode($m[2], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        $t = bb_i18n_busca($idioma, bb_i18n_chave($txt));
        return $t === null ? $m[0] : $m[1] . htmlspecialchars(rawurlencode($t), ENT_QUOTES, 'UTF-8') . '"';
    }, $tag);
    return $tag;
}

/* Fecha um trecho: tira as pontas que não são texto e troca o miolo pela tradução. */
function bb_i18n_fecha_trecho(array $run, $idioma, callable $coleta = null)
{
    if (!$run) return '';
    $ini = 0;
    $fim = count($run) - 1;
    // pontas: espaço e marcas sem par dentro do trecho ficam de fora
    $sem_par = function ($i) use ($run, &$ini, &$fim) {
        $t = $run[$i];
        if ($t === '' || $t[0] !== '<') return trim($t) === '';
        $nome = bb_i18n_nome_marca($t);
        if (in_array($nome, BB_VAZIAS, true)) return true;
        $abre = $t[1] !== '/';
        $nivel = 0;
        if ($abre) {
            for ($j = $i; $j <= $fim; $j++) {
                if (bb_i18n_nome_marca($run[$j]) !== $nome || $run[$j][0] !== '<') continue;
                $nivel += $run[$j][1] === '/' ? -1 : 1;
                if ($nivel === 0) return $j === $fim;   // par fecha no fim: o trecho inteiro é a marca, pode tirar
            }
            return true;
        }
        for ($j = $i; $j >= $ini; $j--) {
            if (bb_i18n_nome_marca($run[$j]) !== $nome || $run[$j][0] !== '<') continue;
            $nivel += $run[$j][1] === '/' ? 1 : -1;
            if ($nivel === 0) return $j === $ini;
        }
        return true;
    };
    $antes = '';
    $depois = '';
    for ($volta = 0; $volta < 50 && $ini <= $fim; $volta++) {
        if ($sem_par($ini)) {
            $t = $run[$ini];
            if ($t !== '' && $t[0] !== '<' && trim($t) !== '') break;
            $antes .= $t; $ini++; continue;
        }
        if ($sem_par($fim)) {
            $t = $run[$fim];
            if ($t !== '' && $t[0] !== '<' && trim($t) !== '') break;
            $depois = $t . $depois; $fim--; continue;
        }
        break;
    }
    // só marcas, sem texto (link com ícone ou imagem): os atributos delas (aria-label, title, href do WhatsApp) também traduzem
    if ($ini > $fim) return bb_i18n_attrs_lista($run, $idioma);
    $miolo = array_slice($run, $ini, $fim - $ini + 1);
    // espaço nas pontas do texto fica de fora
    $primeiro = $miolo[0];
    if ($primeiro[0] !== '<') { $l = strlen($primeiro) - strlen(ltrim($primeiro)); $antes .= substr($primeiro, 0, $l); $miolo[0] = ltrim($primeiro); }
    $k = count($miolo) - 1;
    $ultimo = $miolo[$k];
    if ($ultimo !== '' && $ultimo[0] !== '<') { $r = rtrim($ultimo); $depois = substr($ultimo, strlen($r)) . $depois; $miolo[$k] = $r; }

    list($chave, $mapa) = bb_i18n_etiqueta($miolo);
    $original = implode('', $miolo);
    if ($chave === '' || !bb_i18n_tem_letra($chave)) return $antes . bb_i18n_attrs_lista($miolo, $idioma) . $depois;
    if ($coleta) { $coleta($chave); return $antes . $original . $depois; }
    $t = bb_i18n_busca($idioma, $chave);
    $html = $t === null ? null : bb_i18n_desetiqueta($t, $mapa);
    if ($html === null) {
        if ($t !== null) $GLOBALS['bb_i18n_faltam'][$chave] = true;   // tradução quebrada: refaz
        return $antes . bb_i18n_attrs_lista($miolo, $idioma) . $depois;
    }
    // as marcas de dentro também têm atributos (title, aria-label)
    return $antes . bb_i18n_attrs_lista(bb_i18n_tokens($html), $idioma) . $depois;
}

function bb_i18n_attrs_lista(array $tokens, $idioma)
{
    $o = '';
    foreach ($tokens as $t) $o .= ($t !== '' && $t[0] === '<') ? bb_i18n_attrs($t, $idioma) : $t;
    return $o;
}

/* Percorre o HTML. Com $coleta, só junta as chaves (ferramenta de extração) e devolve o HTML igual. */
function bb_i18n_traduz_html($html, $idioma, callable $coleta = null, callable $coleta_attr = null)
{
    $tokens = bb_i18n_tokens($html);
    $out = '';
    $run = [];
    $abertas = [];
    $pula = null;   // marca com translate="no": tudo até ela fechar fica igual
    $nivel_pula = 0;
    foreach ($tokens as $t) {
        if ($pula !== null) {
            $out .= $t;
            $nome = bb_i18n_nome_marca($t);
            if ($nome === $pula && $t[0] === '<') {
                if ($t[1] === '/') { if (--$nivel_pula === 0) $pula = null; }
                elseif (substr($t, -2) !== '/>') $nivel_pula++;
            }
            continue;
        }
        $eh_marca = $t !== '' && $t[0] === '<' && $t !== '<';
        $nome = $eh_marca ? bb_i18n_nome_marca($t) : null;
        if ($eh_marca && strpos($t, ' translate="no"') !== false && $t[1] !== '/') {
            $out .= bb_i18n_fecha_trecho($run, $idioma, $coleta);
            $run = [];
            $abertas = [];
            $out .= $t;
            if (!in_array($nome, BB_VAZIAS, true)) { $pula = $nome; $nivel_pula = 1; }
            continue;
        }
        if (!$eh_marca) { $run[] = $t; continue; }
        if ($nome !== null && in_array($nome, BB_INLINE, true) && substr($t, 0, 4) !== '<!--') {
            if ($t[1] !== '/') {
                if (!in_array($nome, BB_VAZIAS, true) && substr($t, -2) !== '/>') $abertas[] = $nome;
                $run[] = $t;
                continue;
            }
            // fecha uma marca aberta neste trecho: continua no trecho; aberta antes dele: vira limite
            $k = array_search($nome, array_reverse($abertas, true), true);
            if ($k !== false) { array_splice($abertas, $k, 1); $run[] = $t; continue; }
        }
        // limite de trecho: comentário, bloco cru, marca de bloco ou fechamento de fora
        $out .= bb_i18n_fecha_trecho($run, $idioma, $coleta);
        $run = [];
        $abertas = [];
        if ($coleta_attr && $t[0] === '<') $coleta_attr($t);
        $out .= ($coleta || substr($t, 0, 4) === '<!--' || preg_match('#^<(script|style|svg|textarea|pre|code|template)\b#i', $t)) ? $t : bb_i18n_attrs($t, $idioma);
    }
    $out .= bb_i18n_fecha_trecho($run, $idioma, $coleta);
    return $out;
}

/* JSON-LD: traduz os campos de texto e põe as URLs das páginas no idioma. */
function bb_i18n_ld($html, $idioma, callable $coleta = null)
{
    return preg_replace_callback('#(<script type="application/ld\+json">)(.*?)(</script>)#s', function ($m) use ($idioma, $coleta) {
        $j = json_decode($m[2], true);
        if (!is_array($j)) return $m[0];
        $anda = function ($no, $tipo_pai = null) use (&$anda, $idioma, $coleta) {
            if (!is_array($no)) return $no;
            $tipo = isset($no['@type']) && is_string($no['@type']) ? $no['@type'] : $tipo_pai;
            foreach ($no as $k => $v) {
                if (is_array($v)) { $no[$k] = $anda($v, $tipo); continue; }
                if (!is_string($v)) continue;
                if (in_array($k, BB_LD_CAMPOS, true) && !in_array($tipo, BB_LD_SEM_TRADUCAO, true)) {
                    $ch = bb_i18n_chave($v);
                    if (!bb_i18n_tem_letra($ch)) continue;
                    if ($coleta) { $coleta($ch); continue; }
                    $t = bb_i18n_busca($idioma, $ch);
                    if ($t !== null) $no[$k] = $t;
                } elseif (!$coleta && in_array($k, ['url', '@id', 'item'], true) && strpos($v, BB_DOM) === 0 && !preg_match('#/(assets|fotos|midia)/#', $v)) {
                    $no[$k] = BB_DOM . $idioma . '/' . substr($v, strlen(BB_DOM));
                } elseif (!$coleta && $k === 'inLanguage') {
                    $no[$k] = BB_IDIOMAS[$idioma][0];
                }
            }
            return $no;
        };
        $j = $anda($j);
        if ($coleta) return $m[0];
        $txt = json_encode($j, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        return $m[1] . "\n  " . str_replace("\n", "\n  ", str_replace('</', '<\/', $txt)) . "\n  " . $m[3];
    }, $html);
}

/* ---------- cabeça e ligações entre idiomas ---------- */

/* Links do seletor de idioma e as alternativas (hreflang) de toda página, inclusive em português. */
function bb_i18n_cabeca($h, $idioma, $p)
{
    $alt = '';
    foreach (BB_IDIOMAS as $c => $i) $alt .= "\n  <link rel=\"alternate\" hreflang=\"{$i[0]}\" href=\"" . bb_url_idioma($c, $p) . '">';
    $alt .= "\n  <link rel=\"alternate\" hreflang=\"x-default\" href=\"" . bb_url_idioma('pt', $p) . '">';
    $h = preg_replace('#(<link rel="canonical" href=")[^"]*(">)#', '${1}' . bb_url_idioma($idioma, $p) . '${2}' . str_replace('$', '\$', $alt), $h, 1);
    $h = preg_replace('#<meta property="og:url" content="[^"]*">#', '<meta property="og:url" content="' . bb_url_idioma($idioma, $p) . '">', $h, 1);
    if ($idioma !== 'pt') {
        $h = preg_replace('#<html lang="[^"]*">#', '<html lang="' . BB_IDIOMAS[$idioma][0] . '">', $h, 1);
        $h = preg_replace('#<meta property="og:locale" content="[^"]*">#', '<meta property="og:locale" content="' . BB_IDIOMAS[$idioma][2] . '">', $h, 1);
    }
    return bb_i18n_seletor($h, $idioma, $p);
}

/* Botão de idioma do cabeçalho: lista com o endereço desta página em cada idioma. */
function bb_i18n_seletor($h, $idioma, $p)
{
    $rotulos = ['pt' => 'Idioma do site', 'es' => 'Idioma del sitio', 'en' => 'Site language', 'fr' => 'Langue du site', 'de' => 'Sprache der Website',
        'it' => 'Lingua del sito', 'nl' => 'Taal van de site', 'ja' => 'サイトの言語', 'zh' => '网站语言'];
    $itens = '';
    foreach (BB_IDIOMAS as $c => $i) {
        $atual = $c === $idioma ? ' aria-current="true"' : '';
        $itens .= "\n          <li><a href=\"/" . ($c === 'pt' ? '' : $c . '/') . $p . "\" hreflang=\"{$i[0]}\" lang=\"{$i[0]}\" data-idioma-cod=\"$c\"$atual><b>" . strtoupper($c) . "</b>{$i[1]}</a></li>";
    }
    $h = preg_replace('#(<ul class="idioma__lista"[^>]*>).*?(\s*</ul>)#s', '$1' . str_replace('$', '\$', $itens) . '$2', $h, 1);
    $h = preg_replace('#(<button class="topo__idioma"[^>]*aria-label=")[^"]*(")#', '${1}' . $rotulos[$idioma] . ': ' . BB_IDIOMAS[$idioma][1] . '$2', $h, 1);
    return preg_replace('#(<span data-idioma-atual>)[A-Z]{2}(</span>)#', '${1}' . strtoupper($idioma) . '$2', $h, 1);
}

/* Na página em outro idioma o molde está uma pasta acima: assets, fotos e a api ganham um "../".
   (O .htaccess também desvia /es/assets/... para /assets/..., para o que escapar daqui.) */
function bb_i18n_caminhos($h)
{
    return preg_replace_callback('#<[a-zA-Z][^>]*>#', function ($m) {
        return preg_replace('#(?<=["\s,(;])((?:\.\./)*)(assets|fotos|midia|api|favicon\.ico)(?=[/"\s?])#', '../$1$2', $m[0]);
    }, $h);
}

/* Textos do JavaScript (T('...') nos arquivos de assets/js) no idioma da página. */
function bb_i18n_js($h, $idioma)
{
    $d = [];
    foreach (bb_i18n_textos_js() as $pt) {
        $t = bb_i18n_busca($idioma, $pt);
        if ($t !== null) $d[$pt] = $t;
    }
    $s = '<script>window.BB_T=' . json_encode((object) $d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) . ';</script>';
    return preg_replace('#</head>#', '  ' . str_replace('$', '\$', $s) . "\n</head>", $h, 1);
}

function bb_i18n_textos_js()
{
    static $lista = null;
    if ($lista !== null) return $lista;
    $lista = [];
    foreach (glob(BB_RAIZ . '/assets/js/*.js') ?: [] as $arq) {
        preg_match_all("#\\bT\\('((?:[^'\\\\]|\\\\.)*)'#", file_get_contents($arq), $m);
        foreach ($m[1] as $s) $lista[] = bb_i18n_chave(stripcslashes($s));
    }
    return $lista = array_values(array_unique($lista));
}

/* Avisos que só existem nas páginas traduzidas (escritos em português e traduzidos como o resto). */
function bb_i18n_avisos($h, $p)
{
    if (strpos($p, 'politica-') === 0) {
        $h = preg_replace('#(<p class="prosa__data">.*?</p>)#', '$1' . "\n          " . '<p class="aviso-traducao">Esta página foi traduzida automaticamente do português. Em caso de dúvida, vale a versão em português.</p>', $h, 1);
    }
    if ($p === '' && strpos($h, 'avaliacoes__galeria') !== false) {
        $h = preg_replace('#(<div class="avaliacoes__galeria">)#', '<p class="aviso-traducao">Avaliações traduzidas automaticamente do português.</p>' . "\n      " . '$1', $h, 1);
    }
    return $h;
}

/* A página pronta em português => no idioma pedido. */
function bb_traduz_pagina($h, $idioma, $p)
{
    if ($idioma === 'pt') return bb_i18n_cabeca($h, 'pt', $p);
    $GLOBALS['bb_i18n_faltam'] = isset($GLOBALS['bb_i18n_faltam']) ? $GLOBALS['bb_i18n_faltam'] : [];
    $h = bb_i18n_avisos($h, $p);
    $h = bb_i18n_ld($h, $idioma);
    $h = bb_i18n_traduz_html($h, $idioma);
    $h = bb_i18n_caminhos($h);
    $h = bb_i18n_cabeca($h, $idioma, $p);
    $h = bb_i18n_js($h, $idioma);
    bb_i18n_anota_faltas($idioma);
    return $h;
}

/* Guarda na fila o que faltou traduzir (o cron/traduz.php pega daqui). */
function bb_i18n_anota_faltas($idioma)
{
    $f = isset($GLOBALS['bb_i18n_faltam']) ? $GLOBALS['bb_i18n_faltam'] : [];
    $GLOBALS['bb_i18n_faltam'] = [];
    if (!$f || PHP_SAPI === 'cli') return;
    if (!is_dir(BB_TRAD_DIR)) @mkdir(BB_TRAD_DIR, 0755, true);
    $arq = BB_TRAD_DIR . '/faltam.json';
    $fp = @fopen($arq, 'c+');
    if (!$fp) return;
    if (flock($fp, LOCK_EX)) {
        $txt = stream_get_contents($fp);
        $fila = $txt ? (json_decode($txt, true) ?: []) : [];
        $mudou = false;
        foreach (array_keys($f) as $ch) {
            if (count($fila) >= 3000) break;   // trava contra fila sem fim
            if (!isset($fila[$ch])) { $fila[$ch] = []; }
            if (!in_array($idioma, $fila[$ch], true)) { $fila[$ch][] = $idioma; $mudou = true; }
        }
        if ($mudou) {
            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode($fila, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        }
        flock($fp, LOCK_UN);
    }
    fclose($fp);
}

/* Todas as chaves de uma página em português (para a ferramenta de tradução). */
function bb_i18n_chaves_da_pagina($h, $p)
{
    $ch = [];
    $junta = function ($c) use (&$ch) { $ch[$c] = true; };
    $h = bb_i18n_avisos($h, $p);
    bb_i18n_ld($h, 'en', $junta);
    // atributos: roda a tradução de verdade com um dicionário vazio e recolhe o que faltou
    $GLOBALS['bb_i18n_faltam'] = [];
    bb_i18n_traduz_html($h, '__coleta__');
    foreach (array_keys($GLOBALS['bb_i18n_faltam']) as $c) $ch[$c] = true;
    $GLOBALS['bb_i18n_faltam'] = [];
    return array_keys($ch);
}
