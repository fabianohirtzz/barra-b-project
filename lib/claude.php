<?php
/* Barra Boat Floripa | lib/claude.php
   Tradução dos textos do site pela API do Claude. Usado por tools/i18n.php (o site inteiro,
   no computador) e por cron/traduz.php (o que a equipe escreve no painel, no servidor).
   Chamada HTTP direta com curl: o site não tem composer nem build, e o servidor recebe os
   arquivos por FTP. A chave fica no config.local.php (ANTHROPIC_API_KEY), nunca no Git. */

const BB_CLAUDE_MODELO = 'claude-opus-5-5';

function bb_claude_chave()
{
    $k = getenv('ANTHROPIC_API_KEY');
    if (!$k && function_exists('bb_config')) $k = bb_config('ANTHROPIC_API_KEY');
    return $k ?: null;
}

function bb_claude_regras($idioma)
{
    $nome = BB_IDIOMAS[$idioma][3];
    $tom = [
        'es' => 'Espanhol neutro da América Latina, tratando o leitor por "tú" (o público principal é argentino, uruguaio e chileno; não use voseo).',
        'en' => 'Inglês americano, direto e caloroso.',
        'fr' => 'Francês, tratando o leitor por "vous".',
        'de' => 'Alemão, tratando o leitor por "Sie".',
        'it' => 'Italiano, tratando o leitor por "tu", como fazem os sites de turismo.',
        'nl' => 'Holandês, tratando o leitor por "je", como fazem os sites de turismo.',
        'ja' => 'Japonês em estilo です/ます, cordial e natural para um site de turismo (não traduza palavra por palavra).',
        'zh' => 'Chinês simplificado, natural para um site de turismo.',
    ][$idioma];
    $g = [
        'es' => ['"capitán"', '"lancha"', '"paseo"', '"recorrido"'],
        'en' => ['"skipper"', '"boat" (ou "speedboat" quando precisar especificar)', '"boat trip"', '"route"'],
        'fr' => ['"skipper"', '"bateau"', '"sortie en bateau"', '"itinéraire"'],
        'de' => ['"Skipper"', '"Boot"', '"Bootstour"', '"Route"'],
        'it' => ['"skipper"', '"barca"', '"gita in barca"', '"itinerario"'],
        'nl' => ['"schipper"', '"boot"', '"boottocht"', '"route"'],
        'ja' => ['「船長」', '「ボート」', '「ボートツアー」', '「コース」'],
        'zh' => ['“船长”', '“游艇”', '“游艇出海”', '“路线”'],
    ][$idioma];
    return <<<TXT
Você traduz o site da Barra Boat Floripa, empresa de aluguel de lanchas privativas com marinheiro e combustível inclusos, na Barra da Lagoa, Florianópolis, Brasil. Traduza do português do Brasil para $nome.

Tom: $tom Escreva como um texto que nasceu no idioma, para turistas que vão escolher um passeio de lancha. Frases claras e concretas.

Regras, sem exceção:
- Etiquetas como <a1>, </a1>, <b2>, </b2>, <span3>, <br4/> marcam trechos com formatação ou link. Devolva exatamente as mesmas etiquetas, cada uma uma vez, em volta das palavras equivalentes da tradução (a ordem pode mudar se o idioma pedir). Não crie outras marcas de HTML.
- Marcadores entre chaves, como {n}, {lancha}, {data}, {max}, ficam iguais: o código troca depois.
- Entidades de HTML (&amp;, &nbsp;, &quot;) ficam como estão.
- Não traduza nomes próprios: Barra Boat Floripa, Barra da Lagoa, Ilha do Campeche, Costa da Lagoa, Lagoa da Conceição, Florianópolis, Floripa, Santa Catarina, Cadastur, WhatsApp, Instagram, TikTok, Google, nomes de pessoas e os nomes das lanchas (Phantom 30 BBF, HD 260 Lulu, My Nega e todos os outros). Ruas e endereços ficam iguais.
- Glossário, sempre o mesmo termo no site inteiro: "marinheiro" (quem conduz a lancha) = $g[0]; "lancha" = $g[1]; "passeio" = $g[2]; "roteiro" = $g[3]. Exceção: na história do fundador, Neto Linhares, "marinheiro" é a profissão dele (homem do mar), traduza como tal.
- Milhas são milhas náuticas. "Pés" é a medida da lancha (feet/pies). Use o separador decimal do idioma (10,4 vira 10.4 em inglês, japonês e chinês).
- Nunca invente preço, desconto ou informação que não está no texto. Nada de travessão (— ou –) e nada de emoji.
- Texto só com número, sigla ou nome próprio volta igual.
- Avaliações de clientes: traduza fielmente, sem melhorar o texto.
- Devolva um item para cada índice pedido, com o mesmo índice.
TXT;
}

/* Traduz uma lista de textos. Devolve [texto em português => tradução] só com o que passou na conferência. */
function bb_claude_traduz($idioma, array $textos, $onde = [])
{
    $chave = bb_claude_chave();
    if (!$chave) throw new RuntimeException('Sem ANTHROPIC_API_KEY (config.local.php ou variável de ambiente).');
    $textos = array_values($textos);
    $itens = [];
    foreach ($textos as $i => $t) $itens[] = ['i' => $i, 't' => $t] + (isset($onde[$t]) ? ['pagina' => $onde[$t]] : []);
    $corpo = [
        'model' => BB_CLAUDE_MODELO,
        'max_tokens' => 32000,
        'thinking' => ['type' => 'adaptive'],
        'fallbacks' => 'default',
        'output_config' => [
            'effort' => 'high',
            'format' => ['type' => 'json_schema', 'schema' => [
                'type' => 'object',
                'properties' => ['itens' => ['type' => 'array', 'items' => [
                    'type' => 'object',
                    'properties' => ['i' => ['type' => 'integer'], 'v' => ['type' => 'string']],
                    'required' => ['i', 'v'], 'additionalProperties' => false,
                ]]],
                'required' => ['itens'], 'additionalProperties' => false,
            ]],
        ],
        'system' => bb_claude_regras($idioma),
        'messages' => [['role' => 'user', 'content' => "Traduza para " . BB_IDIOMAS[$idioma][3] . " (" . BB_IDIOMAS[$idioma][0] . "). Cada item tem o índice \"i\", o texto \"t\" e, às vezes, a página onde aparece (só contexto). Devolva {\"itens\": [{\"i\", \"v\"}]}.\n\n" . json_encode($itens, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]],
    ];
    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'content-type: application/json',
            'x-api-key: ' . $chave,
            'anthropic-version: 2026-10-21',
            'anthropic-beta: server-side-fallback-2026-07-01',
        ],
        CURLOPT_POSTFIELDS => json_encode($corpo, JSON_UNESCAPED_UNICODE),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 600,
    ]);
    // ocupada (429, 5xx, 529) ou rede caiu: espera e tenta de novo, até 5 vezes
    for ($vez = 1; ; $vez++) {
        $txt = curl_exec($ch);
        $st = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $erro = curl_error($ch);
        if (($txt === false || $st === 429 || $st >= 500) && $vez < 5) { sleep(min(60, 8 * $vez)); continue; }
        break;
    }
    curl_close($ch);
    if ($txt === false) throw new RuntimeException("Falha de rede: $erro");
    $r = json_decode($txt, true);
    if ($st !== 200) throw new RuntimeException("API respondeu $st: " . substr($txt, 0, 400));
    $parada = isset($r['stop_reason']) ? $r['stop_reason'] : '';
    if ($parada === 'max_tokens') throw new LengthException('Resposta cortada (max_tokens): diminua o lote.');
    if ($parada === 'refusal') throw new RuntimeException('A API recusou o lote.');
    $json = null;
    foreach (isset($r['content']) ? $r['content'] : [] as $b) if ($b['type'] === 'text') $json = json_decode($b['text'], true);
    if (!isset($json['itens']) || !is_array($json['itens'])) throw new RuntimeException('Resposta sem a lista de itens.');
    $saida = [];
    foreach ($json['itens'] as $it) {
        if (!isset($it['i'], $it['v'], $textos[$it['i']])) continue;
        $pt = $textos[$it['i']];
        $v = trim(preg_replace('/\s+/u', ' ', $it['v']));
        if ($v === '' || !bb_claude_confere($pt, $v)) continue;
        $saida[$pt] = $v;
    }
    $GLOBALS['bb_claude_uso'][] = isset($r['usage']) ? $r['usage'] : [];
    return $saida;
}

/* Mesmas etiquetas e os mesmos {marcadores}, sem HTML solto e sem travessão. */
function bb_claude_confere($pt, $v)
{
    $pega = function ($s, $re) { preg_match_all($re, $s, $m); $x = $m[0]; sort($x); return $x; };
    if ($pega($pt, '#</?[a-z]+\d+/?>#') !== $pega($v, '#</?[a-z]+\d+/?>#')) return false;
    if ($pega($pt, '/\{[a-z_]+\}/') !== $pega($v, '/\{[a-z_]+\}/')) return false;
    if (preg_match('#<(?![/]?[a-z]+\d+/?>)#', $v)) return false;
    return true;
}

/* Lotes: corta a lista em partes e, se uma resposta vier cortada, divide o lote ao meio. */
function bb_claude_traduz_tudo($idioma, array $textos, $onde = [], $lote = 50, callable $avisa = null)
{
    $feito = [];
    $fila = array_chunk(array_values($textos), $lote);
    while ($fila) {
        $parte = array_shift($fila);
        try {
            $lote_ok = bb_claude_traduz($idioma, $parte, $onde);
            $feito += $lote_ok;
            if ($avisa) $avisa(count($feito), count($textos), $lote_ok);
        } catch (LengthException $e) {
            if (count($parte) < 2) continue;
            $m = (int) ceil(count($parte) / 2);
            array_unshift($fila, array_slice($parte, 0, $m), array_slice($parte, $m));
        }
    }
    return $feito;
}
