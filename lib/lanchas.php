<?php
/* Barra Boat Floripa | lib/lanchas.php
   HTML das lanchas a partir do banco: card (home e /lanchas/), opções do formulário da
   home e a página /lanchas/<slug>/. É o MESMO HTML do tools/gerar_paginas.py (a prévia
   estática); tools/conferir_php.php compara os dois. Mudou o HTML lá? Mude aqui também. */

const BB_DOM = 'https://barraboatfloripa.com.br/';
const BB_WA = '5548991153172';

/* mesmo escape do html.escape do Python */
function bb_e($s)
{
    return str_replace(['&', '<', '>', '"', "'"], ['&amp;', '&lt;', '&gt;', '&quot;', '&#x27;'], (string) $s);
}

function bb_sem_acento($s)
{
    $s = mb_strtolower((string) $s, 'UTF-8');
    return strtr($s, ['á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'é' => 'e', 'ê' => 'e', 'è' => 'e', 'ë' => 'e',
        'í' => 'i', 'î' => 'i', 'ì' => 'i', 'ï' => 'i', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ò' => 'o', 'ö' => 'o',
        'ú' => 'u', 'û' => 'u', 'ù' => 'u', 'ü' => 'u', 'ç' => 'c', 'ñ' => 'n']);
}

/* Regras de ícone: iguais às de ICONE no gerador. A primeira que casar vence. */
function bb_icone($texto)
{
    static $regras = [['cabin|cabine|quarto|cama', 'cabine'], ['banheiro|vaso', 'banheiro'],
        ['^carvao', 'fogo'], ['churras', 'grelha'],
        ['\bsom\b|bluetooth|jbl', 'som'], ['tapete', 'tapete'], ['stand ?up|padle|paddle', 'standup'],
        ['geladeira|cooler|geleira|frigobar', 'gelo'], ['ducha|chuveiro', 'ducha'], ['toldo|fechamento', 'toldo'],
        ['mergulho|mascara', 'mergulho'], ['cafeteira', 'cafe'], ['\bpia\b', 'pia'], ['\bmesa\b', 'mesa'],
        ['louca|tacas|copos|cristaleira', 'taca'], ['gourmet', 'talher'],
        ['colete', 'colete'], ['extintor', 'extintor'], ['socorro', 'socorro'], ['pirotecnico', 'sinalizador'],
        ['salvatagem|boia circular', 'boia'], ['boia|espaguete|macarrao|splash', 'espaguete'],
        ['carregador', 'carregador'], ['ilumina|\bluz\b', 'luz'], ['piso', 'piso'], ['porta objetos', 'gaveta'],
        ['solari|chaise|estofad|estofamento', 'solario'], ['\bfly\b', 'escada'],
        ['deck|popa|proa|cockpit', 'conves'], ['^agua$', 'agua'], ['motor', 'helice'],
        ['gps|sonda|radio|vhf', 'sonda'], ['gerador', 'energia']];
    $k = bb_sem_acento($texto);
    foreach ($regras as $r) if (preg_match('/' . $r[0] . '/u', $k)) return $r[1];
    return 'lancha';
}

/* Destaques do card: um rótulo curto por tipo, nesta ordem. Diferente do ícone da página,
   aqui cada item pode contar em mais de um tipo ("Banheiro com ducha" é banheiro e ducha). */
function bb_destaques($itens)
{
    static $tipos = [['cabine', 'Cabine', 'cabin|cabine|quarto|cama'], ['banheiro', 'Banheiro', 'banheiro|vaso'],
        ['grelha', 'Churrasqueira', 'churras'], ['som', 'Som', '\bsom\b|bluetooth|jbl'], ['tapete', 'Tapete flutuante', 'tapete'],
        ['standup', 'Stand up', 'stand ?up|padle|paddle'], ['gelo', 'Geladeira', 'geladeira|cooler|geleira|frigobar'],
        ['ducha', 'Ducha', 'ducha|chuveiro'], ['toldo', 'Toldo', 'toldo|fechamento'], ['mergulho', 'Máscara de mergulho', 'mergulho|mascara'],
        ['taca', 'Mesa e louças', '\bmesa\b|louca|tacas|copos|cristaleira']];
    $txt = array_map('bb_sem_acento', (array) $itens);
    $saida = [];
    foreach ($tipos as $t) {
        foreach ($txt as $k) {
            if (preg_match('/' . $t[2] . '/u', $k)) { $saida[] = [$t[0], $t[1]]; break; }
        }
    }
    return $saida;
}

function bb_pes($n)
{
    $n = (float) $n;
    return ($n == floor($n)) ? (string) (int) $n : str_replace('.', ',', rtrim(rtrim(number_format($n, 1, '.', ''), '0'), '.'));
}

/* "/assets/x.webp" do banco vira caminho relativo à página ("../../assets/x.webp") */
function bb_url($url, $pre)
{
    $url = (string) $url;
    if (preg_match('#^(https?:)?//#', $url)) return $url;
    return $pre . ltrim($url, '/');
}

function bb_card($l, $pre = '')
{
    $s = $l['slug'];
    $d = bb_destaques($l['itens']);
    $vis = array_slice($d, 0, 3);
    $mais = array_slice($d, 3);
    $lis = '';
    foreach ($vis as $x) $lis .= '<li><svg aria-hidden="true"><use href="#i-' . $x[0] . '"/></svg>' . bb_e($x[1]) . '</li>';
    if ($mais) {
        $nomes = implode(', ', array_column($mais, 1));
        $lis .= '<li class="lancha__mais" title="' . bb_e($nomes) . '">+' . count($mais) . (count($mais) === 1 ? ' item' : ' itens') . '<span class="sr">: ' . bb_e($nomes) . '</span></li>';
    }
    $capa = $l['capa_url'] ? bb_url($l['capa_url'], $pre) : $pre . 'assets/img/marca/apple-touch-icon.png';
    return '<li class="lancha" data-pax="' . (int) $l['passageiros'] . '">' . "\n"
        . '            <a class="lancha__link" href="' . $pre . 'lanchas/' . bb_e($s) . '/">' . "\n"
        . '              <span class="lancha__foto"><img src="' . bb_e($capa) . '" alt="Lancha ' . bb_e($l['nome']) . '" width="800" height="800" loading="lazy"><span class="lancha__regiao">' . bb_e($l['regiao']) . '</span></span>' . "\n"
        . '              <span class="lancha__nome">' . bb_e($l['nome']) . '</span>' . "\n"
        . '              <span class="lancha__specs"><span><svg aria-hidden="true"><use href="#i-pessoas"/></svg>' . (int) $l['passageiros'] . ' pessoas</span><span><svg aria-hidden="true"><use href="#i-regua"/></svg>' . bb_pes($l['pes']) . ' pés</span></span>'
        . '<ul class="lancha__itens" aria-label="A bordo">' . $lis . '</ul>' . "\n"
        . '            </a>' . "\n"
        . '          </li>';
}

/* <li> de cada card, como no gerador: 10 espaços antes de cada um, separados por \n */
function bb_cards($lanchas, $pre = '')
{
    $out = [];
    foreach ($lanchas as $l) $out[] = '          ' . bb_card($l, $pre);
    return implode("\n", $out);
}

function bb_opcoes($lanchas)
{
    $max = 0;
    foreach ($lanchas as $l) $max = max($max, (int) $l['passageiros']);
    $o = '              <option value="" data-pax="' . $max . '">Quero ajuda da equipe para escolher</option>';
    foreach ($lanchas as $l) {
        $o .= "\n" . '              <option value="' . bb_e($l['nome']) . '" data-pax="' . (int) $l['passageiros'] . '">' . bb_e($l['nome']) . ', até ' . (int) $l['passageiros'] . ' pessoas</option>';
    }
    return $o;
}

/* Números da frota para os textos ("17 lanchas de 23 a 37 pés"). */
function bb_frota($lanchas)
{
    $pes = array_map(function ($l) { return (float) $l['pes']; }, $lanchas);
    $pax = array_map(function ($l) { return (int) $l['passageiros']; }, $lanchas);
    return ['n' => count($lanchas), 'pes_min' => bb_pes($pes ? min($pes) : 0), 'pes_max' => bb_pes($pes ? max($pes) : 0),
        'pax_min' => $pax ? min($pax) : 0, 'pax_max' => $pax ? max($pax) : 0];
}

function bb_intro($l)
{
    if (!empty($l['descricao'])) return trim($l['descricao']);
    $norte = strpos((string) $l['regiao'], 'Norte') === 0;
    return 'A ' . $l['nome'] . ' tem ' . bb_pes($l['pes']) . ' pés e leva até ' . (int) $l['passageiros'] . ' pessoas. A lancha é só do seu grupo, com marinheiro habilitado e o combustível do roteiro inclusos.'
        . ($norte ? ' Ela fica no Norte da Ilha, e o ponto de embarque é combinado na reserva.' : ' O embarque é no Canal da Barra da Lagoa.');
}

/* Tamanho da foto principal: lido do arquivo quando ele está no servidor. */
function bb_dimensoes($url)
{
    $arq = BB_RAIZ . '/' . ltrim(parse_url((string) $url, PHP_URL_PATH), '/');
    $t = is_file($arq) ? @getimagesize($arq) : false;
    return $t ? [$t[0], $t[1]] : [1400, 1050];
}

/* Página da lancha: [titulo, descricao, og_imagem, corpo, ld]. $todas = lanchas do site, na ordem. */
function bb_pagina_lancha($l, $todas, $pre, $fonte)
{
    $s = $l['slug'];
    $nome = $l['nome'];
    $pax = (int) $l['passageiros'];
    $pes = bb_pes($l['pes']);
    $reg = (string) $l['regiao'];
    $fotos = array_values(array_filter((array) $l['fotos'], function ($f) { return !empty($f['url']); }));
    $nf = count($fotos);
    $itens = array_map(function ($t) { return [bb_icone($t), $t]; }, (array) $l['itens']);
    $intro = bb_intro($l);
    $frota = bb_frota($todas);

    $migs = '<nav class="migalhas" aria-label="Você está em"><ol><li><a href="' . ($pre ?: './') . '">Início</a></li><li><a href="' . $pre . 'lanchas/">Lanchas</a></li><li aria-current="page">' . bb_e($nome) . '</li></ol></nav>';

    $principal = $nf ? $fotos[0] : ['url' => $l['capa_url'], 'url_p' => $l['capa_url']];
    list($w, $h) = bb_dimensoes($principal['url']);
    $minis = [];
    foreach ($fotos as $i => $f) {
        $minis[] = '            <li><button type="button" class="galeria__mini" data-foto="' . ($i + 1) . '" aria-label="Ver foto ' . ($i + 1) . ' de ' . $nf . '"' . ($i === 0 ? ' aria-current="true"' : '') . '><img src="' . bb_e(bb_url(isset($f['url_p']) ? $f['url_p'] : $f['url'], $pre)) . '" alt="" width="160" height="120" loading="lazy"></button></li>';
    }
    $lista = json_encode(array_map(function ($f) use ($pre) { return bb_url($f['url'], $pre); }, $fotos), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $bordo = [];
    foreach ($itens as $x) $bordo[] = '          <li><svg aria-hidden="true"><use href="#i-' . $x[0] . '"/></svg>' . bb_e($x[1]) . '</li>';

    $outras = [];
    $pos = 0;
    foreach ($todas as $x) { if ($x['slug'] !== $s) $outras[] = [abs((int) $x['passageiros'] - $pax), $pos, $x]; $pos++; }
    usort($outras, function ($a, $b) { return [$a[0], $a[1]] <=> [$b[0], $b[1]]; });
    $parecidas = array_map(function ($o) { return $o[2]; }, array_slice($outras, 0, 4));

    $wa = 'Olá! Vim pelo site da Barra Boat. Quero consultar a lancha ' . $nome . '.';
    $en = bb_e($nome);

    $corpo = '    <div class="lancha-pagina">
      ' . $migs . '
      <div class="lancha-topo">
        <section class="galeria" aria-label="Fotos da ' . $en . '" data-galeria data-pasta="' . $pre . 'assets/img/lanchas/' . bb_e($s) . '/" data-total="' . $nf . '" data-fotos="' . bb_e($lista) . '">
          <figure class="galeria__palco">
            <img src="' . bb_e(bb_url($principal['url'], $pre)) . '" alt="' . $en . ', foto 1 de ' . $nf . '" width="' . $w . '" height="' . $h . '" fetchpriority="high" data-galeria-img>
            <button type="button" class="galeria__seta galeria__seta--volta" data-galeria-passo="-1" aria-label="Foto anterior"><svg aria-hidden="true"><use href="#i-seta"/></svg></button>
            <button type="button" class="galeria__seta" data-galeria-passo="1" aria-label="Próxima foto"><svg aria-hidden="true"><use href="#i-seta"/></svg></button>
            <figcaption class="galeria__conta" aria-live="polite"><span data-galeria-n>1</span> / ' . $nf . '</figcaption>
          </figure>
          <ul class="galeria__minis">
' . implode("\n", $minis) . '
          </ul>
        </section>

        <aside class="ficha" aria-labelledby="lancha-nome">
          <p class="ficha__regiao">' . bb_e($reg) . '</p>
          <h1 id="lancha-nome" class="ficha__nome">' . $en . '</h1>
          <ul class="ficha__specs">
            <li><svg aria-hidden="true"><use href="#i-pessoas"/></svg><b>' . $pax . '</b> pessoas</li>
            <li><svg aria-hidden="true"><use href="#i-regua"/></svg><b>' . $pes . '</b> pés</li>
            <li><svg aria-hidden="true"><use href="#i-relogio"/></svg><b>8 h</b> de diária</li>
          </ul>
          <p class="ficha__intro">' . bb_e($intro) . '</p>

          <div class="agenda" data-agenda data-lancha="' . bb_e($s) . '" data-nome="' . $en . '" data-fonte="' . bb_e($fonte) . '">
            <div class="agenda__topo">
              <h2 class="agenda__titulo">Datas livres</h2>
              <div class="agenda__nav">
                <button type="button" class="agenda__mes-btn agenda__mes-btn--volta" data-agenda-mes="-1" aria-label="Mês anterior"><svg aria-hidden="true"><use href="#i-seta"/></svg></button>
                <p class="agenda__mes" aria-live="polite" data-agenda-titulo></p>
                <button type="button" class="agenda__mes-btn" data-agenda-mes="1" aria-label="Próximo mês"><svg aria-hidden="true"><use href="#i-seta"/></svg></button>
              </div>
            </div>
            <div class="agenda__semana" aria-hidden="true"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
            <div class="agenda__dias" role="grid" data-agenda-dias></div>
            <ul class="agenda__legenda">
              <li><i class="agenda__marca agenda__marca--livre"></i>Livre</li>
              <li><i class="agenda__marca agenda__marca--ocupada"></i>Reservada</li>
              <li><i class="agenda__marca agenda__marca--escolhida"></i>Sua data</li>
            </ul>
            <p class="agenda__aviso" data-agenda-aviso hidden></p>
          </div>

          <a class="botao botao--mar botao--cheio botao--grande" href="https://wa.me/' . BB_WA . '?text=' . bb_e($wa) . '" target="_blank" rel="noopener" data-agenda-cta data-wa-base="' . bb_e($wa) . '"><svg aria-hidden="true"><use href="#i-wa"/></svg><span data-agenda-cta-txt>Consultar valores no WhatsApp</span></a>
          <p class="ficha__nota">Valor por lancha, não por pessoa. Você fala direto com a nossa equipe pelo WhatsApp.</p>
        </aside>
      </div>
    </div>

    <section class="secao" aria-labelledby="bordo-titulo">
      <div class="duas-colunas duas-colunas--topo">
        <div>
          <h2 id="bordo-titulo" class="titulo">O que tem a bordo</h2>
          <p class="secao__intro">Itens desta lancha, informados pelo dono. Marinheiro e combustível do roteiro já estão no valor.</p>
          <ul class="incluso-curto">
            <li><svg aria-hidden="true"><use href="#i-leme"/></svg>Marinheiro habilitado</li>
            <li><svg aria-hidden="true"><use href="#i-bomba"/></svg>Combustível do roteiro</li>
            <li><svg aria-hidden="true"><use href="#i-escudo"/></svg>Coletes e itens de segurança</li>
          </ul>
        </div>
        <ul class="bordo">
' . implode("\n", $bordo) . '
        </ul>
      </div>
    </section>

    <section class="secao" aria-labelledby="roteiros-titulo">
      <div class="secao__cabeca">
        <h2 id="roteiros-titulo" class="titulo">Para onde a ' . $en . ' vai</h2>
        <p class="secao__intro">Os dois roteiros saem com a mesma lancha. A diária é de 8 horas, das 9h às 17h ou das 10h às 18h.</p>
      </div>
      <div class="mini-roteiros">
        <a class="mini-roteiro" href="' . $pre . 'ilha-do-campeche/">
          <img src="' . $pre . 'assets/img/paginas/sobre-06.webp" alt="Ilha do Campeche vista do alto, com lanchas ancoradas na água azul" width="1400" height="1050" loading="lazy">
          <span class="mini-roteiro__txt"><b>Ilha do Campeche</b><span>Mar aberto, 10,4 milhas, água cristalina</span></span>
        </a>
        <a class="mini-roteiro" href="' . $pre . 'costa-da-lagoa/">
          <img src="' . $pre . 'assets/img/fotos/costa-da-lagoa.webp" alt="Trapiche da Costa da Lagoa ao pôr do sol" width="1400" height="1050" loading="lazy">
          <span class="mini-roteiro__txt"><b>Costa da Lagoa</b><span>Águas calmas, cachoeira e restaurantes</span></span>
        </a>
      </div>
    </section>

    <section class="secao" aria-labelledby="outras-titulo">
      <div class="secao__cabeca secao__cabeca--linha">
        <div>
          <h2 id="outras-titulo" class="titulo">Lanchas para grupos parecidos</h2>
        </div>
        <a class="botao botao--contorno" href="' . $pre . 'lanchas/"><span>Ver as ' . $frota['n'] . ' lanchas</span><svg aria-hidden="true"><use href="#i-seta"/></svg></a>
      </div>
          <ul class="grade-lanchas" data-grade-lanchas>
' . bb_cards($parecidas, $pre) . '
          </ul>
    </section>
';

    $ld = [
        ['@type' => 'BreadcrumbList', 'itemListElement' => [
            ['@type' => 'ListItem', 'position' => 1, 'name' => 'Início', 'item' => BB_DOM],
            ['@type' => 'ListItem', 'position' => 2, 'name' => 'Lanchas', 'item' => BB_DOM . 'lanchas/'],
            ['@type' => 'ListItem', 'position' => 3, 'name' => $nome]]],
        // Service, não Product: sem preço no site, o Google acusaria erro em Product sem offers/review
        ['@type' => 'Service', 'name' => 'Aluguel da lancha ' . $nome . ' em Florianópolis', 'serviceType' => 'Aluguel de lancha com marinheiro',
            'description' => $intro, 'url' => BB_DOM . 'lanchas/' . $s . '/',
            'image' => array_map(function ($f) { return BB_DOM . ltrim(preg_replace('#^https?://[^/]+#', '', $f['url']), '/'); }, array_slice($fotos, 0, 6)),
            'provider' => ['@id' => BB_DOM . '#empresa'], 'areaServed' => 'Florianópolis, Santa Catarina'],
    ];
    $og = $nf ? ltrim(preg_replace('#^https?://[^/]+#', '', $fotos[0]['url']), '/') : 'assets/img/fotos/hero.webp';
    return [
        $nome . ', lancha para ' . $pax . ' pessoas | Barra Boat Floripa',
        'Aluguel da lancha ' . $nome . ', ' . $pes . ' pés, até ' . $pax . ' pessoas, com marinheiro e combustível inclusos. Veja fotos, itens a bordo e as datas livres.',
        $og, $corpo, $ld,
    ];
}
