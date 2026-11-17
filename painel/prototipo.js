/* Painel Barra Boat | protótipo clicável com dados de exemplo.
   Serve para aprovar o jeito das telas com a Michele antes de ligar no Supabase.
   Nada é salvo: recarregar a página volta tudo ao exemplo. */
(function () {
  'use strict';

  /* ================= dados de exemplo ================= */
  const HOJE = new Date(2026, 10, 17); // 17/11/2026, terça
  const R = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const dd = (d) => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
  const somaDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const LANCHAS = [
    { id: '1564', nome: 'Phantom 36', pax: 13, pes: 36, dono: 'Própria', agenda: 'manual' },
    { id: 'phantom30bb', nome: 'Phantom 30 BB', pax: 12, pes: 30, dono: 'Própria', agenda: 'manual' },
    { id: 'phantom-36c', nome: 'Phantom 36 C', pax: 11, pes: 36, dono: 'Carlos (parceiro)', agenda: 'google', ocupados: 12 },
    { id: 'phantom-30', nome: 'Phantom 30 C', pax: 11, pes: 30, dono: 'Carlos (parceiro)', agenda: 'google', ocupados: 9 },
    { id: '3373', nome: 'Cabrasmar 37', pax: 10, pes: 37, dono: 'Rafael (parceiro)', agenda: 'planilha', ocupados: 6 },
    { id: '3363', nome: 'My Nega 30', pax: 10, pes: 30, dono: 'Jorge (parceiro)', agenda: null },
    { id: 'phantom29g', nome: 'Phantom 29 G', pax: 9, pes: 29, dono: 'Rafael (parceiro)', agenda: 'planilha', ocupados: 4 },
    { id: 'hd26-lulu', nome: 'HD 26 Lulu', pax: 9, pes: 26, dono: 'Marcos (parceiro)', agenda: null },
    { id: 'focker24d', nome: 'Focker 24', pax: 7, pes: 24, dono: 'Jorge (parceiro)', agenda: null },
  ];
  const lancha = (id) => LANCHAS.find((l) => l.id === id);
  const COR_DONO = { 'Própria': '#083359', 'Carlos (parceiro)': '#1A6FA8', 'Rafael (parceiro)': '#C97A2A', 'Jorge (parceiro)': '#5B8C3A', 'Marcos (parceiro)': '#8A5DB0' };

  const ETAPAS = [
    { id: 'novos', nome: 'Novos', ajuda: 'Pessoas que mandaram mensagem e ainda não foram atendidas.' },
    { id: 'conversando', nome: 'Conversando', ajuda: 'Já disseram a data e quantas pessoas vão.' },
    { id: 'orcamento', nome: 'Orçamento enviado', ajuda: 'Você já mandou o valor. Falta a resposta.' },
    { id: 'fechados', nome: 'Fechados', ajuda: 'Pagaram o sinal. O passeio está na agenda.' },
    { id: 'perdidos', nome: 'Não fecharam', ajuda: 'Desistiram ou fecharam com outra empresa. Fica anotado o motivo.' },
  ];

  const CLIENTES = [
    { id: 1, nome: 'Fernanda Lopes', etapa: 'novos', origem: 'Google (anúncio)', quando: 'há 6 min', data: '29/11', pessoas: 8, roteiro: 'Ilha do Campeche', lancha: null, msg: 'Olá! Vim pelo site. Quero consultar um passeio para a Ilha do Campeche. Data: 29/11/2026. Somos 8 pessoas.' },
    { id: 2, nome: 'Martín Gómez', etapa: 'novos', origem: 'Instagram', quando: 'há 22 min', data: '04/01', pessoas: 11, roteiro: 'Ilha do Campeche', lancha: 'phantom-36c', msg: 'Hola! Somos 11 personas, queremos ir a la Isla do Campeche el 4 de enero.' },
    { id: 3, nome: 'Juliana Prado', etapa: 'novos', origem: 'Google (sem anúncio)', quando: 'há 1 h', data: 'a definir', pessoas: 6, roteiro: 'Costa da Lagoa', lancha: null, msg: 'Oi, vocês fazem passeio na Lagoa? Somos 6 com duas crianças.' },
    { id: 4, nome: 'Rodrigo Mendes', etapa: 'conversando', origem: 'Indicação', quando: 'ontem', data: '06/12', pessoas: 10, roteiro: 'Ilha do Campeche', lancha: '3373', msg: 'Perfeito, então dia 6 de dezembro com 10 pessoas.' },
    { id: 5, nome: 'Patrícia Nunes', etapa: 'conversando', origem: 'Google (anúncio)', quando: 'ontem', data: '20/12', pessoas: 7, roteiro: 'Ilha do Campeche', lancha: null, msg: 'Qual lancha você indica para 7 pessoas?' },
    { id: 6, nome: 'Eduardo Ramos', etapa: 'orcamento', origem: 'Instagram', quando: 'há 2 dias', data: '13/12', pessoas: 12, roteiro: 'Ilha do Campeche', lancha: 'phantom30bb', orcado: 3800, msg: 'Vou ver com o pessoal e te falo até amanhã.' },
    { id: 7, nome: 'Camila Souza', etapa: 'orcamento', origem: 'TikTok', quando: 'há 3 dias', data: '27/12', pessoas: 9, roteiro: 'Costa da Lagoa', lancha: 'phantom29g', orcado: 2900, msg: 'Obrigada! Te confirmo.' },
    { id: 8, nome: 'André Pacheco', etapa: 'fechados', origem: 'Google (anúncio)', quando: 'hoje', data: '17/11', pessoas: 12, roteiro: 'Ilha do Campeche', lancha: '1564', orcado: 4200, fechado: 4000, sinal: 2000, msg: 'Combinado, até amanhã às 9h!' },
    { id: 9, nome: 'Beatriz Carvalho', etapa: 'fechados', origem: 'Indicação', quando: 'hoje', data: '17/11', pessoas: 9, roteiro: 'Costa da Lagoa', lancha: 'phantom-30', orcado: 3000, fechado: 3000, sinal: 1500, msg: 'Estamos chegando na Barra!' },
    { id: 10, nome: 'Lucas Teixeira', etapa: 'fechados', origem: 'Parceiro (Hotel Mar)', quando: 'há 4 dias', data: '22/11', pessoas: 8, roteiro: 'Ilha do Campeche', lancha: 'phantom30bb', orcado: 3600, fechado: 3400, sinal: 1700, msg: 'Pix do sinal enviado.' },
    { id: 11, nome: 'Renata Alves', etapa: 'perdidos', origem: 'Google (anúncio)', quando: 'há 5 dias', data: '15/11', pessoas: 14, roteiro: 'Ilha do Campeche', lancha: null, motivo: 'Lancha pequena para o grupo', msg: 'Somos 14, não dá então.' },
  ];

  // agenda: 14 dias a partir de hoje
  const RESERVAS = {
    '1564': { 0: 'André', 5: 'Família Sá', 6: 'Grupo Rui' },
    'phantom30bb': { 5: 'Lucas', 11: 'Bianca', 12: 'Eduardo' },
    'phantom-36c': { 3: 'dono', 4: 'dono', 10: 'dono', 11: 'dono' },
    'phantom-30': { 0: 'Beatriz', 6: 'dono', 12: 'dono' },
    '3373': { 2: 'bloqueio', 3: 'bloqueio', 5: 'dono', 6: 'dono' },
    '3363': { 5: 'Tiago', 13: 'Paula' },
    'phantom29g': { 6: 'dono', 12: 'Camila' },
    'hd26-lulu': { 4: 'Marta' },
    'focker24d': {},
  };

  let DESPESAS = [
    { dia: 17, cat: 'Combustível', valor: 640, lancha: 'Phantom 36', obs: 'Posto da Barra' },
    { dia: 17, cat: 'Gelo, carvão e frutas', valor: 180, lancha: 'Phantom 36', obs: '' },
    { dia: 16, cat: 'Marinheiro', valor: 350, lancha: 'Phantom 30 BB', obs: 'Diego' },
    { dia: 15, cat: 'Manutenção', valor: 1250, lancha: 'Phantom 30 BB', obs: 'Troca da bomba de porão' },
    { dia: 12, cat: 'Anúncios', valor: 900, lancha: '', obs: 'Google' },
    { dia: 10, cat: 'Marina e vaga', valor: 1800, lancha: '', obs: 'Mensal' },
    { dia: 8, cat: 'Combustível', valor: 1120, lancha: 'Phantom 36', obs: '' },
    { dia: 5, cat: 'Seguro', valor: 690, lancha: 'Phantom 36', obs: 'Parcela 4 de 10' },
    { dia: 3, cat: 'Marinheiro', valor: 700, lancha: '', obs: 'Diego e Neto' },
  ];
  const CATEGORIAS = ['Combustível', 'Marinheiro', 'Gelo, carvão e frutas', 'Manutenção', 'Marina e vaga', 'Seguro', 'Documentação', 'Anúncios', 'Repasse a parceiro', 'Comissão', 'Outros'];

  // relatório (novembro de 2026 e meses anteriores)
  const FAT_2026 = [61200, 54800, 38900, 14200, 6100, 3200, 4100, 5300, 9800, 21400, 38400, null];
  const FAT_2025 = [52300, 47100, 31800, 12600, 5400, 2900, 3600, 4800, 8200, 17900, 31500, 49800];

  /* ================= utilidades de tela ================= */
  const $ = (s, c = document) => c.querySelector(s);
  const tela = $('#tela');
  const gaveta = $('#gaveta');
  let ultimoFoco = null;

  function abreGaveta(titulo, html, aoAbrir) {
    ultimoFoco = document.activeElement;
    $('#gaveta-titulo').textContent = titulo;
    $('#gaveta-corpo').innerHTML = html;
    gaveta.hidden = false;
    document.body.style.overflow = 'hidden';
    $('[data-fechar].botao-icone', gaveta).focus();
    if (aoAbrir) aoAbrir($('#gaveta-corpo'));
  }
  function fechaGaveta() {
    gaveta.hidden = true;
    document.body.style.overflow = '';
    if (ultimoFoco) ultimoFoco.focus();
  }
  gaveta.addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) fechaGaveta(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !gaveta.hidden) fechaGaveta(); });

  let tAviso;
  function avisa(txt) {
    const a = $('#aviso');
    a.innerHTML = '<svg><use href="#p-ok"/></svg>' + esc(txt);
    a.hidden = false;
    clearTimeout(tAviso);
    tAviso = setTimeout(() => { a.hidden = true; }, 2800);
  }

  // dica ao passar o mouse ou focar nos gráficos
  const dica = document.createElement('div');
  dica.className = 'dica'; dica.hidden = true; document.body.appendChild(dica);
  function mostraDica(el) {
    const r = el.getBoundingClientRect();
    dica.innerHTML = el.dataset.dica;
    dica.style.left = (r.left + r.width / 2) + 'px';
    dica.style.top = r.top + 'px';
    dica.hidden = false;
  }
  document.addEventListener('mouseover', (e) => { const el = e.target.closest('[data-dica]'); if (el) mostraDica(el); else dica.hidden = true; });
  document.addEventListener('focusin', (e) => { const el = e.target.closest('[data-dica]'); if (el) mostraDica(el); else dica.hidden = true; });

  /* ================= HOJE ================= */
  function telaHoje() {
    const hojeP = CLIENTES.filter((c) => c.etapa === 'fechados' && c.data === dd(HOJE));
    const novos = CLIENTES.filter((c) => c.etapa === 'novos');
    const passeios = hojeP.map((c, i) => {
      const l = lancha(c.lancha);
      return `<li class="cartao passeio">
        <div class="passeio__topo">
          <div><div class="passeio__hora">${i === 0 ? '9h' : '10h'}</div>
          <div class="passeio__lancha"><i class="bolinha" style="background:${COR_DONO[l.dono]}"></i>${esc(l.nome)}</div></div>
          ${i === 0 ? '<span class="selo selo--bom"><svg><use href="#p-ok"/></svg>Lista completa</span>' : '<span class="selo selo--alerta">Lista: 6 de 9</span>'}
        </div>
        <dl class="dados">
          <div><dt>Cliente</dt><dd>${esc(c.nome)}</dd></div>
          <div><dt>Pessoas</dt><dd>${c.pessoas}</dd></div>
          <div><dt>Roteiro</dt><dd>${esc(c.roteiro)}</dd></div>
          <div><dt>Marinheiro</dt><dd>${i === 0 ? 'Diego' : 'Neto'}</dd></div>
          <div><dt>Falta receber</dt><dd>${R(c.fechado - c.sinal)}</dd></div>
        </dl>
        <div class="acoes"><button class="botao botao--leve botao--pequeno" type="button" data-cliente="${c.id}">Abrir</button>
        <button class="botao botao--leve botao--pequeno" type="button" data-recebi="${c.id}">Recebi o restante</button></div>
      </li>`;
    }).join('');
    const espera = novos.map((c) => `<li><button class="linha" type="button" data-cliente="${c.id}">
        <span class="avatar">${esc(c.nome[0])}</span>
        <span class="linha__corpo"><b>${esc(c.nome)}</b><span>${esc(c.msg)}</span></span>
        <span class="selo selo--alerta"><svg><use href="#p-relogio"/></svg>${esc(c.quando)}</span>
      </button></li>`).join('');
    tela.innerHTML = `
      <header class="cab"><div><h1>Bom dia, Michele</h1><p>Terça, 17 de novembro</p></div>
        <div class="acoes"><button class="botao botao--principal" type="button" data-despesa><svg><use href="#p-mais-um"/></svg>Anotar despesa</button></div></header>

      <div class="alerta" role="note"><svg><use href="#p-vento"/></svg><div>
        <b>Quinta, 19/11: vento sul forte (35 km/h) e chuva à tarde.</b>
        <p>Tem 1 passeio marcado nesse dia (Phantom 36 C, Grupo do Carlos). Vale avisar o cliente e oferecer outra data.</p>
        <button class="botao botao--leve botao--pequeno" type="button" data-avisar-clima>Avisar o cliente pelo WhatsApp</button>
      </div></div>

      <section class="bloco"><h2>Passeios de hoje <small>${hojeP.length} passeios</small></h2><ul class="lista">${passeios}</ul></section>

      <section class="bloco"><h2>Esperando sua resposta <small>${novos.length} pessoas</small></h2><ul class="lista">${espera}</ul></section>

      <section class="bloco"><h2>Dinheiro dos próximos dias</h2>
        <div class="numeros">
          <div class="numero"><span>Para receber em 7 dias</span><b>${R(9800)}</b><small>6 passeios marcados</small></div>
          <div class="numero"><span>Já garantido até fevereiro</span><b>${R(84300)}</b><small class="sobe">22% a mais que no ano passado</small></div>
          <div class="numero"><span>Despesas este mês</span><b>${R(totalDespesas())}</b><small>${DESPESAS.length} anotações</small></div>
        </div>
      </section>`;
  }

  /* ================= AGENDA ================= */
  // períodos em que a empresa não atende (férias, feriado, empresa fechada)
  let PERIODOS = [{ ini: '2026-11-28', fim: '2026-11-29', motivo: 'Empresa fechada', lancha: null }];
  const MOTIVOS = ['Empresa fechada', 'Férias', 'Feriado', 'Manutenção', 'Outro'];
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const deIso = (s) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
  const diaLongo = (d) => `${d.getDate()} de ${MESES_LONGOS[d.getMonth()]}`;
  const faixa = (p) => {
    const a = deIso(p.ini), b = deIso(p.fim);
    if (p.ini === p.fim) return `Dia ${diaLongo(a)}`;
    return a.getMonth() === b.getMonth() ? `De ${a.getDate()} a ${diaLongo(b)}` : `De ${diaLongo(a)} a ${diaLongo(b)}`;
  };
  const periodoDe = (id, d) => { const s = iso(d); return PERIODOS.find((p) => (!p.lancha || p.lancha === id) && s >= p.ini && s <= p.fim); };

  function telaAgenda() {
    const dias = Array.from({ length: 14 }, (_, i) => somaDias(HOJE, i));
    const cab = dias.map((d, i) => `<th scope="col" class="${i === 0 ? 'is-hoje' : ''} ${d.getDay() % 6 === 0 ? 'is-fds' : ''}">${DIAS[d.getDay()]}<b>${d.getDate()}</b></th>`).join('');
    const linhas = LANCHAS.map((l) => {
      const cel = dias.map((d, i) => {
        const r = (RESERVAS[l.id] || {})[i];
        const quando = `${DIAS[d.getDay()]} ${dd(d)}`;
        if (!r && periodoDe(l.id, d)) return `<td><button class="dia dia--fechado" type="button" data-dia="${l.id}|${i}" aria-label="${esc(l.nome)}, ${quando}, agenda fechada"><span>fech.</span></button></td>`;
        if (!r) return `<td><button class="dia dia--livre" type="button" data-dia="${l.id}|${i}" aria-label="${esc(l.nome)}, ${quando}, livre"><span>livre</span></button></td>`;
        if (r === 'dono') return `<td><button class="dia dia--dono" type="button" data-dia="${l.id}|${i}" aria-label="${esc(l.nome)}, ${quando}, ocupada na agenda do dono"><span>dono</span></button></td>`;
        if (r === 'bloqueio') return `<td><button class="dia dia--bloqueio" type="button" data-dia="${l.id}|${i}" aria-label="${esc(l.nome)}, ${quando}, manutenção"><span>manut.</span></button></td>`;
        return `<td><button class="dia dia--reservada" type="button" data-dia="${l.id}|${i}" aria-label="${esc(l.nome)}, ${quando}, reservada para ${esc(r)}"><span>${esc(r)}</span></button></td>`;
      }).join('');
      return `<tr><th scope="row"><i class="bolinha" style="background:${COR_DONO[l.dono]}"></i> ${esc(l.nome)}<small>${l.pax} pessoas · ${esc(l.dono)}</small></th>${cel}</tr>`;
    }).join('');
    tela.innerHTML = `
      <header class="cab"><div><h1>Agenda</h1><p>Próximas duas semanas, lancha por lancha. Toque num dia para ver ou marcar.</p></div>
        <button class="botao botao--principal" type="button" data-fechar-periodo><svg aria-hidden="true"><use href="#p-agenda"/></svg>Fechar a agenda por um período</button></header>
      ${PERIODOS.length ? `<section class="cartao periodos"><h2>Dias em que a agenda está fechada</h2>
        <ul>${PERIODOS.map((p, n) => `<li><span><b>${faixa(p)}</b><small>${esc(p.motivo)}, ${p.lancha ? esc(lancha(p.lancha).nome) : 'todas as lanchas'}</small></span>
          <button class="botao botao--leve botao--pequeno" type="button" data-reabrir="${n}">Reabrir</button></li>`).join('')}</ul></section>` : ''}
      <ul class="agenda-legenda">
        <li><i class="amostra amostra--reservada"></i>Reservada por você</li>
        <li><i class="amostra amostra--dono"></i>Ocupada na agenda do dono</li>
        <li><i class="amostra amostra--bloqueio"></i>Manutenção</li>
        <li><i class="amostra amostra--fechado"></i>Agenda fechada</li>
        <li><i class="amostra amostra--livre"></i>Livre</li>
      </ul>
      <div class="agenda-grade"><table><thead><tr><th scope="col" class="sr">Lancha</th>${cab}</tr></thead><tbody>${linhas}</tbody></table></div>
      <p class="ajuda" style="margin-top:14px">O que está aqui aparece no calendário do site como livre ou ocupado. O cliente nunca vê nomes nem valores.</p>`;
    tela.querySelector('[data-fechar-periodo]').addEventListener('click', fecharPeriodo);
    tela.querySelectorAll('[data-reabrir]').forEach((b) => b.addEventListener('click', () => {
      const p = PERIODOS[Number(b.dataset.reabrir)];
      PERIODOS = PERIODOS.filter((x) => x !== p);
      telaAgenda(); avisa(`Agenda reaberta: ${faixa(p).toLowerCase()}.`);
    }));
  }

  function fecharPeriodo() {
    const hoje = iso(HOJE);
    abreGaveta('Fechar a agenda por um período', `
      <p class="ajuda" style="margin-top:0">Para férias, feriado ou quando a empresa não vai atender. Nesses dias o site mostra tudo ocupado e nenhum passeio novo entra.</p>
      <div class="periodo-datas">
        <label class="campo"><span>Do dia</span><input type="date" data-ini min="${hoje}"></label>
        <label class="campo"><span>Até o dia</span><input type="date" data-fim min="${hoje}"></label>
      </div>
      <div class="campo"><span>Por quê?</span><div class="chips">${MOTIVOS.map((m, n) => `<button class="chip" type="button" aria-pressed="${n === 0}" data-motivo="${esc(m)}">${esc(m)}</button>`).join('')}</div>
        <small>Só você vê o motivo.</small></div>
      <label class="campo"><span>Quais lanchas?</span><select data-qual><option value="">Todas as lanchas</option>${LANCHAS.map((l) => `<option value="${l.id}">Só a ${esc(l.nome)}</option>`).join('')}</select></label>
      <div class="estado estado--sem" data-resumo hidden></div>
      <div class="alerta" data-conflito hidden><span><b>Já tem passeio marcado nesses dias</b><p data-conflito-txt></p></span></div>
      <p class="selo selo--alerta" data-erro hidden style="margin:0 0 12px"></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Fechar a agenda</button>`, (c) => {
      const ini = c.querySelector('[data-ini]'), fim = c.querySelector('[data-fim]'), qual = c.querySelector('[data-qual]');
      let motivo = MOTIVOS[0];
      c.querySelectorAll('[data-motivo]').forEach((b) => b.addEventListener('click', () => {
        c.querySelectorAll('[data-motivo]').forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true'); motivo = b.dataset.motivo;
      }));
      const conflitos = () => {
        const out = [];
        for (let i = 0; i < 14; i++) {
          const s = iso(somaDias(HOJE, i));
          if (s < ini.value || s > fim.value) continue;
          LANCHAS.forEach((l) => {
            if (qual.value && qual.value !== l.id) return;
            const r = (RESERVAS[l.id] || {})[i];
            if (r && r !== 'dono' && r !== 'bloqueio') out.push(`${r} (${l.nome}, ${dd(somaDias(HOJE, i))})`);
          });
        }
        return out;
      };
      const atualiza = () => {
        if (ini.value) fim.min = ini.value;
        if (ini.value && !fim.value) fim.value = ini.value;
        const res = c.querySelector('[data-resumo]'), conf = c.querySelector('[data-conflito]');
        if (!ini.value || !fim.value || fim.value < ini.value) { res.hidden = true; conf.hidden = true; return; }
        const n = Math.round((deIso(fim.value) - deIso(ini.value)) / 864e5) + 1;
        const quais = qual.value ? `na ${lancha(qual.value).nome}` : 'em todas as lanchas';
        res.textContent = `${faixa({ ini: ini.value, fim: fim.value })}: ${n} ${n === 1 ? 'dia fechado' : 'dias fechados'} ${quais}.`;
        res.hidden = false;
        const cs = conflitos();
        conf.hidden = !cs.length;
        if (cs.length) c.querySelector('[data-conflito-txt]').textContent = `${cs.join('; ')}. ${cs.length === 1 ? 'Esse passeio continua marcado' : 'Esses passeios continuam marcados'}. Se for preciso, fale com o cliente pelo WhatsApp.`;
      };
      [ini, fim, qual].forEach((x) => x.addEventListener('change', atualiza));
      c.querySelector('[data-salvar]').addEventListener('click', () => {
        const erro = c.querySelector('[data-erro]');
        if (!ini.value || !fim.value) { erro.textContent = 'Escolha o primeiro e o último dia.'; erro.hidden = false; return; }
        if (fim.value < ini.value) { erro.textContent = 'O último dia precisa ser depois do primeiro.'; erro.hidden = false; return; }
        const p = { ini: ini.value, fim: fim.value, motivo, lancha: qual.value || null };
        PERIODOS = [...PERIODOS, p].sort((a, b) => a.ini.localeCompare(b.ini));
        fechaGaveta(); telaAgenda(); avisa(`Agenda fechada: ${faixa(p).toLowerCase()}.`);
      });
    });
  }

  function abreDia(id, i) {
    const l = lancha(id);
    const d = somaDias(HOJE, Number(i));
    const r = (RESERVAS[id] || {})[i];
    const titulo = `${l.nome}, ${DIAS[d.getDay()]} ${dd(d)}`;
    const p = !r && periodoDe(id, d);
    if (p) {
      abreGaveta(titulo, `<div class="estado estado--sem">Agenda fechada. ${esc(faixa(p))}, ${esc(p.motivo.toLowerCase())}, ${p.lancha ? 'só nesta lancha' : 'todas as lanchas'}.</div>
        <button class="botao botao--leve botao--cheio" type="button" data-reabrir-p>Reabrir este período</button>`, (c) => {
        c.querySelector('[data-reabrir-p]').addEventListener('click', () => { PERIODOS = PERIODOS.filter((x) => x !== p); fechaGaveta(); telaAgenda(); avisa('Período reaberto.'); });
      });
      return;
    }
    if (!r) {
      abreGaveta(titulo, `
        <div class="estado estado--sem">Este dia está livre.</div>
        <div class="escolhas">
          <button class="escolha" type="button" data-acao="marcar"><span class="linha__icone"><svg><use href="#p-agenda"/></svg></span><span><b>Marcar um passeio</b><span>Escolha o cliente e o dia fica reservado.</span></span></button>
          <button class="escolha" type="button" data-acao="bloquear"><span class="linha__icone"><svg><use href="#p-lancha"/></svg></span><span><b>Bloquear para manutenção</b><span>O site mostra o dia como ocupado.</span></span></button>
          <button class="escolha" type="button" data-acao="periodo"><span class="linha__icone"><svg><use href="#p-relogio"/></svg></span><span><b>Fechar a agenda de vários dias</b><span>Férias, feriado ou empresa fechada.</span></span></button>
        </div>`, (c) => {
        c.querySelector('[data-acao="periodo"]').addEventListener('click', () => { fecharPeriodo(); const x = document.querySelector('#gaveta [data-ini]'); x.value = iso(d); x.dispatchEvent(new Event('change')); });
        c.querySelector('[data-acao="marcar"]').addEventListener('click', () => { fechaGaveta(); avisa('No painel de verdade, aqui você escolhe o cliente.'); });
        c.querySelector('[data-acao="bloquear"]').addEventListener('click', () => { RESERVAS[id][i] = 'bloqueio'; fechaGaveta(); telaAgenda(); avisa('Dia bloqueado para manutenção.'); });
      });
      return;
    }
    const txt = r === 'dono' ? 'Ocupada na agenda do dono da lancha. Esse dia vem sozinho da agenda dele.'
      : r === 'bloqueio' ? 'Bloqueada para manutenção.' : `Reservada para ${r}.`;
    abreGaveta(titulo, `<div class="estado">${esc(txt)}</div>
      ${r === 'bloqueio' ? '<button class="botao botao--leve botao--cheio" type="button" data-liberar>Liberar o dia</button>' : ''}`, (c) => {
      const b = c.querySelector('[data-liberar]');
      if (b) b.addEventListener('click', () => { delete RESERVAS[id][i]; fechaGaveta(); telaAgenda(); avisa('Dia liberado.'); });
    });
  }

  /* ================= CLIENTES (funil) ================= */
  let etapaAtual = 'novos';
  function telaClientes() {
    const abas = ETAPAS.map((e) => `<button class="aba" type="button" role="tab" aria-selected="${e.id === etapaAtual}" data-etapa="${e.id}">${e.nome}<b>${CLIENTES.filter((c) => c.etapa === e.id).length}</b></button>`).join('');
    const et = ETAPAS.find((e) => e.id === etapaAtual);
    const lista = CLIENTES.filter((c) => c.etapa === etapaAtual).map((c) => {
      const l = c.lancha ? lancha(c.lancha) : null;
      const valor = c.fechado ? R(c.fechado) : c.orcado ? 'Orçado ' + R(c.orcado) : '';
      return `<li><button class="linha" type="button" data-cliente="${c.id}">
        <span class="avatar">${esc(c.nome[0])}</span>
        <span class="linha__corpo"><b>${esc(c.nome)}</b><span>${esc(c.data)} · ${c.pessoas} pessoas · ${esc(l ? l.nome : c.roteiro)}${valor ? ' · ' + valor : ''}${c.motivo ? ' · ' + esc(c.motivo) : ''}</span></span>
        <svg><use href="#p-seta"/></svg></button></li>`;
    }).join('') || '<li class="cartao">Ninguém nesta etapa agora.</li>';
    tela.innerHTML = `
      <header class="cab"><div><h1>Clientes</h1><p>Cada pessoa que chamou no WhatsApp, do primeiro oi até o passeio.</p></div></header>
      <div class="abas" role="tablist" aria-label="Etapas">${abas}</div>
      <p class="ajuda">${esc(et.ajuda)}</p>
      <ul class="lista">${lista}</ul>`;
  }

  function abreCliente(id) {
    const c = CLIENTES.find((x) => x.id === Number(id));
    const l = c.lancha ? lancha(c.lancha) : null;
    const n = ETAPAS.findIndex((e) => e.id === c.etapa);
    const prox = ETAPAS[Math.min(n + 1, 3)];
    const fechado = c.fechado || 0;
    const custos = fechado ? Math.round(fechado * 0.28) : 0;
    abreGaveta(c.nome, `
      <div class="secao-g">
        <div class="etapas" aria-hidden="true">${ETAPAS.slice(0, 4).map((e, i) => `<span class="${i <= n && c.etapa !== 'perdidos' ? 'on' : ''}"></span>`).join('')}<span class="${c.etapa === 'perdidos' ? 'on' : ''}" style="${c.etapa === 'perdidos' ? 'background:var(--perigo)' : ''}"></span></div>
        <p style="margin:0;color:var(--suave)">Etapa: <b style="color:var(--tinta)">${esc(ETAPAS[n].nome)}</b> · veio de ${esc(c.origem)}</p>
      </div>
      <div class="acoes secao-g">
        <a class="botao botao--wa" href="#" data-prototipo><svg><use href="#p-wa"/></svg>Abrir conversa</a>
        ${c.etapa !== 'fechados' && c.etapa !== 'perdidos' ? `<button class="botao botao--principal" type="button" data-mover="${c.id}">Passar para ${esc(prox.nome)}</button>` : ''}
      </div>
      <div class="secao-g"><h3>O passeio</h3><div class="cartao"><dl class="dados" style="display:grid;gap:8px">
        <div><dt>Data:</dt><dd>${esc(c.data)}</dd></div>
        <div><dt>Pessoas:</dt><dd>${c.pessoas}${l && c.pessoas > l.pax ? ` <span class="selo selo--alerta">a lancha leva ${l.pax}</span>` : ''}</dd></div>
        <div><dt>Roteiro:</dt><dd>${esc(c.roteiro)}</dd></div>
        <div><dt>Lancha:</dt><dd>${l ? esc(l.nome) : 'ainda não escolhida'}</dd></div>
      </dl></div></div>
      ${c.orcado ? `<div class="secao-g"><h3>Valores</h3><div class="numeros">
        <div class="numero"><span>Orçado</span><b>${R(c.orcado)}</b></div>
        ${fechado ? `<div class="numero"><span>Fechado</span><b>${R(fechado)}</b></div>
        <div class="numero"><span>Sinal recebido</span><b>${R(c.sinal)}</b><small class="sobe">Pix em ${esc(c.data === '17/11' ? '10/11' : '12/11')}</small></div>
        <div class="numero"><span>Falta receber no dia</span><b>${R(fechado - c.sinal)}</b></div>
        <div class="numero"><span>Custos do passeio</span><b>${R(custos)}</b><small>combustível, marinheiro, gelo</small></div>
        <div class="numero"><span>Sobra deste passeio</span><b>${R(fechado - custos)}</b></div>` : ''}
      </div></div>` : ''}
      ${c.etapa === 'fechados' ? `<div class="secao-g"><h3>Antes do passeio</h3><div class="escolhas">
        <button class="escolha" type="button" data-prototipo><span class="linha__icone"><svg><use href="#p-link"/></svg></span><span><b>Mandar a lista de passageiros</b><span>O cliente preenche nome e documento de cada pessoa por um link.</span></span></button>
        <button class="escolha" type="button" data-prototipo><span class="linha__icone"><svg><use href="#p-ok"/></svg></span><span><b>Gerar o contrato</b><span>Sai preenchido com os dados desta conversa.</span></span></button>
      </div></div>` : ''}
      <div class="secao-g"><h3>Conversa</h3><div class="conversa">
        <div class="msg">${esc(c.msg)}<small>${esc(c.quando)}</small></div>
        ${c.etapa !== 'novos' ? '<div class="msg msg--robo">Oi! Aqui é da Barra Boat. Para qual data e quantas pessoas?<small>robô</small></div><div class="msg msg--nos">Tenho a lancha certa para vocês. Já te mando os valores.<small>você</small></div>' : ''}
      </div></div>`, (corpo) => {
      const m = corpo.querySelector('[data-mover]');
      if (m) m.addEventListener('click', () => { c.etapa = prox.id; fechaGaveta(); etapaAtual = prox.id; rota(); avisa(`${c.nome} passou para ${prox.nome}.`); });
    });
  }

  /* ================= DINHEIRO: resumo e despesas ================= */
  let abaDinheiro = 'resumo';
  const totalDespesas = () => DESPESAS.reduce((s, d) => s + d.valor, 0);

  function telaDinheiro() {
    const abas = `<div class="abas" role="tablist" aria-label="Dinheiro">
      <button class="aba" type="button" role="tab" aria-selected="${abaDinheiro === 'resumo'}" data-aba-d="resumo">Resumo do mês</button>
      <button class="aba" type="button" role="tab" aria-selected="${abaDinheiro === 'despesas'}" data-aba-d="despesas">Despesas<b>${DESPESAS.length}</b></button></div>`;
    tela.innerHTML = `<header class="cab"><div><h1>Dinheiro</h1><p>Novembro de 2026</p></div>
      <div class="acoes"><button class="botao botao--principal" type="button" data-despesa><svg><use href="#p-mais-um"/></svg>Anotar despesa</button></div></header>
      ${abas}<div id="dinheiro-corpo"></div>`;
    if (abaDinheiro === 'resumo') resumo(); else despesas();
  }

  function resumo() {
    const bruto = 38400, vendas = 13, orcamentos = 31, meta = 60000;
    const custosPasseio = 9200, repasses = 6100, comissoes = 1150;
    const desp = totalDespesas();
    const liquido = bruto - custosPasseio - repasses - comissoes - desp;
    const tmBruto = Math.round(bruto / vendas), tmLiq = Math.round(liquido / vendas), tmOrc = 3310;
    const desconto = Math.round((1 - tmBruto / tmOrc) * 100);
    const max = Math.max(...FAT_2025, ...FAT_2026.filter(Boolean));
    const colunas = FAT_2026.map((v, i) => `<div class="colunas__mes ${i === 10 ? 'is-atual' : ''}">
      <span class="coluna coluna--b" tabindex="0" style="height:${FAT_2025[i] / max * 100}%" data-dica="<b>${MESES_LONGOS[i]} de 2025</b><br>${R(FAT_2025[i])}" aria-label="${MESES_LONGOS[i]} de 2025: ${R(FAT_2025[i])}"></span>
      ${v ? `<span class="coluna coluna--a" tabindex="0" style="height:${v / max * 100}%" data-dica="<b>${MESES_LONGOS[i]} de 2026</b><br>${R(v)}" aria-label="${MESES_LONGOS[i]} de 2026: ${R(v)}"></span>` : ''}
    </div>`).join('');
    const tabela = FAT_2026.map((v, i) => `<tr><td>${MESES_LONGOS[i]}</td><td>${v ? R(v) : 'ainda não'}</td><td>${R(FAT_2025[i])}</td></tr>`).join('');

    const porCat = {};
    DESPESAS.forEach((d) => { porCat[d.cat] = (porCat[d.cat] || 0) + d.valor; });
    const cats = Object.entries(porCat).sort((a, b) => b[1] - a[1]);
    const maiorCat = cats[0];
    const barrasCat = barras(cats.map(([n, v]) => [n, v, R(v)]));

    const ocup = [['Phantom 36', 74], ['Phantom 30 BB', 68], ['Phantom 36 C', 61], ['Cabrasmar 37', 52], ['Phantom 30 C', 47], ['Phantom 29 G', 33], ['My Nega 30', 21], ['HD 26 Lulu', 14]];
    const origem = [['Google (anúncio)', 41], ['Instagram', 23], ['Google (sem anúncio)', 17], ['Indicação', 12], ['TikTok', 6], ['Parceiros', 5]];

    $('#dinheiro-corpo').innerHTML = `
      <div class="numeros">
        <div class="numero"><span>Entrou (bruto)</span><b>${R(bruto)}</b><small class="sobe">22% a mais que novembro de 2025</small></div>
        <div class="numero"><span>Sobrou (líquido)</span><b>${R(liquido)}</b><small>depois de custos, repasses, comissões e despesas</small></div>
        <div class="numero"><span>Passeios vendidos</span><b>${vendas}</b><small>de ${orcamentos} orçamentos enviados</small></div>
      </div>
      <div class="cartao bloco"><b style="color:var(--tinta)">Meta de novembro: ${R(meta)}</b>
        <div class="meta" role="img" aria-label="${Math.round(bruto / meta * 100)}% da meta"><i style="width:${bruto / meta * 100}%"></i></div>
        <span style="color:var(--suave)">${Math.round(bruto / meta * 100)}% da meta. Faltam ${R(meta - bruto)} em 13 dias.</span></div>

      <section class="bloco"><h2>Ticket médio</h2>
        <div class="numeros">
          <div class="numero"><span>Por venda, bruto</span><b>${R(tmBruto)}</b><small>o que o cliente pagou, em média</small></div>
          <div class="numero"><span>Por venda, líquido</span><b>${R(tmLiq)}</b><small>o que sobrou para você, em média</small></div>
          <div class="numero"><span>Por orçamento</span><b>${R(tmOrc)}</b><small>você fecha, em média, ${desconto}% abaixo do orçado</small></div>
        </div>
      </section>

      <section class="bloco grafico" aria-labelledby="g1"><h3 id="g1">Quanto entrou, mês a mês</h3>
        <p class="grafico__frase">Este ano está <b>acima do ano passado em todos os meses</b>. Novembro já passou o total de novembro de 2025.</p>
        <ul class="legenda"><li><i style="background:var(--serie2)"></i>2025</li><li><i style="background:var(--serie1)"></i>2026</li></ul>
        <div class="colunas">${colunas}</div>
        <div class="colunas__rotulos">${MESES.map((m) => `<span>${m}</span>`).join('')}</div>
        <details class="tabela"><summary>Ver os números em tabela</summary><table><thead><tr><th>Mês</th><th>2026</th><th>2025</th></tr></thead><tbody>${tabela}</tbody></table></details>
      </section>

      <div class="grade-2 bloco">
        <section class="grafico" aria-labelledby="g2"><h3 id="g2">Para onde foi o dinheiro</h3>
          <p class="grafico__frase">O maior gasto do mês foi <b>${esc(maiorCat[0].toLowerCase())}</b>: ${R(maiorCat[1])} de ${R(desp)} em despesas.</p>${barrasCat}</section>
        <section class="grafico" aria-labelledby="g3"><h3 id="g3">Lanchas mais ocupadas</h3>
          <p class="grafico__frase">A <b>Phantom 36</b> saiu em 74% dos dias. A HD 26 Lulu ficou parada na maior parte do mês.</p>${barras(ocup.map(([n, v]) => [n, v, v + '% dos dias']), 100)}</section>
      </div>

      <section class="bloco grafico" aria-labelledby="g4"><h3 id="g4">De onde vieram os clientes</h3>
        <p class="grafico__frase">O <b>anúncio do Google</b> trouxe 41% das pessoas. Cada cliente que fechou por anúncio custou ${R(212)}.</p>${barras(origem.map(([n, v]) => [n, v, v + '%']), 100)}</section>`;
  }

  function barras(itens, teto) {
    const max = teto || Math.max(...itens.map((i) => i[1]));
    return `<ul class="barras">${itens.map(([n, v, rot]) => `<li><span class="barras__nome" title="${esc(n)}">${esc(n)}</span>
      <span class="barras__trilho"><span class="barras__barra" style="width:${Math.max(v / max * 78, 1)}%" data-dica="<b>${esc(n)}</b><br>${esc(rot)}"></span><span class="barras__valor">${esc(rot)}</span></span></li>`).join('')}</ul>`;
  }

  function despesas() {
    const porDia = {};
    DESPESAS.slice().sort((a, b) => b.dia - a.dia).forEach((d) => { (porDia[d.dia] = porDia[d.dia] || []).push(d); });
    const html = Object.keys(porDia).sort((a, b) => b - a).map((dia) => `
      <p class="despesa-dia">${Number(dia) === 17 ? 'Hoje' : Number(dia) === 16 ? 'Ontem' : dia + ' de novembro'}</p>
      <ul class="lista">${porDia[dia].map((d) => `<li class="linha"><span class="linha__icone"><svg><use href="#p-dinheiro"/></svg></span>
        <span class="linha__corpo"><b>${esc(d.cat)}</b><span>${esc([d.lancha, d.obs].filter(Boolean).join(' · ') || 'sem observação')}</span></span>
        <b style="color:var(--tinta);white-space:nowrap">${R(d.valor)}</b></li>`).join('')}</ul>`).join('');
    $('#dinheiro-corpo').innerHTML = `
      <div class="numeros"><div class="numero"><span>Gasto em novembro</span><b>${R(totalDespesas())}</b><small>${DESPESAS.length} anotações</small></div>
      <div class="numero"><span>Despesas fixas do mês</span><b>${R(2490)}</b><small>marina e seguro, lançadas sozinhas</small></div></div>
      ${html}`;
  }

  function anotarDespesa() {
    let cat = null;
    abreGaveta('Anotar despesa', `
      <label class="campo"><span>Quanto foi?</span><input class="valor-grande" type="text" inputmode="decimal" placeholder="R$ 0" data-valor autocomplete="off"></label>
      <div class="campo"><span>Com o quê?</span><div class="chips">${CATEGORIAS.map((c) => `<button class="chip" type="button" aria-pressed="false" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
      <label class="campo"><span>Quando?</span><input type="date" value="2026-11-17" data-data></label>
      <label class="campo"><span>Foi de alguma lancha? <small style="font-weight:400;color:var(--suave)">(se quiser)</small></span><select data-lancha><option value="">Não, foi geral</option>${LANCHAS.map((l) => `<option>${esc(l.nome)}</option>`).join('')}</select></label>
      <label class="campo"><span>Observação <small style="font-weight:400;color:var(--suave)">(se quiser)</small></span><input type="text" data-obs placeholder="Ex.: Posto da Barra"></label>
      <button class="botao botao--leve botao--cheio" type="button" data-prototipo style="margin-bottom:12px"><svg><use href="#p-foto"/></svg>Tirar foto do recibo</button>
      <p class="selo selo--alerta" data-erro hidden style="margin:0 0 12px">Escreva o valor e escolha com o quê.</p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Salvar despesa</button>`, (c) => {
      c.querySelector('[data-valor]').focus();
      c.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => {
        c.querySelectorAll('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true'); cat = b.dataset.cat;
      }));
      c.querySelector('[data-salvar]').addEventListener('click', () => {
        const v = Number(c.querySelector('[data-valor]').value.replace(/[^\d,]/g, '').replace(',', '.'));
        if (!v || !cat) { c.querySelector('[data-erro]').hidden = false; return; }
        const dia = Number((c.querySelector('[data-data]').value || '2026-11-17').slice(8, 10));
        DESPESAS.unshift({ dia, cat, valor: v, lancha: c.querySelector('[data-lancha]').value, obs: c.querySelector('[data-obs]').value });
        fechaGaveta(); rota(); avisa(`Anotado: ${cat}, ${R(v)}.`);
      });
    });
  }

  /* ================= LANCHAS ================= */
  function telaLanchas() {
    tela.innerHTML = `<a class="voltar" href="#mais"><svg><use href="#p-volta"/></svg>Mais</a>
      <header class="cab"><div><h1>Lanchas</h1><p>${LANCHAS.length} lanchas no site. Toque numa para mudar fotos, dados ou a agenda do dono.</p></div>
      <button class="botao botao--principal" type="button" data-prototipo><svg><use href="#p-mais-um"/></svg>Cadastrar lancha</button></header>
      <div class="lanchas">${LANCHAS.map((l) => `<a class="lancha-c" href="#lancha/${l.id}">
        <img src="../assets/img/lanchas/${l.id}.webp" alt="" loading="lazy">
        <div><b>${esc(l.nome)}</b><span>${l.pax} pessoas · ${esc(l.dono)}</span>
        ${l.agenda ? `<span class="selo selo--bom"><svg><use href="#p-ok"/></svg>Agenda ${l.agenda === 'manual' ? 'no painel' : 'conectada'}</span>` : '<span class="selo selo--alerta">Agenda do dono não conectada</span>'}</div></a>`).join('')}</div>`;
  }

  function telaLancha(id) {
    const l = lancha(id);
    if (!l) { location.hash = '#lanchas'; return; }
    const proprio = l.dono === 'Própria';
    const estado = l.agenda === 'google' ? `<div class="estado"><svg><use href="#p-ok"/></svg>Conectada ao Google Agenda do ${esc(l.dono.split(' ')[0])}. ${l.ocupados} dias ocupados nos próximos 90 dias. Atualizada há 8 min.</div>`
      : l.agenda === 'planilha' ? `<div class="estado"><svg><use href="#p-ok"/></svg>Conectada à planilha do ${esc(l.dono.split(' ')[0])}. ${l.ocupados} dias ocupados nos próximos 90 dias.</div>`
      : l.agenda === 'manual' ? '<div class="estado"><svg><use href="#p-ok"/></svg>Lancha sua: a agenda é a deste painel.</div>'
      : '<div class="estado estado--sem">Ainda não conectada. Enquanto isso, os dias ocupados do dono não aparecem no site.</div>';
    tela.innerHTML = `<a class="voltar" href="#lanchas"><svg><use href="#p-volta"/></svg>Lanchas</a>
      <header class="cab"><div><h1>${esc(l.nome)}</h1><p>${l.pax} pessoas · ${l.pes} pés · ${esc(l.dono)}</p></div>
        <a class="botao botao--leve botao--pequeno" href="../lanchas/${l.id}/" target="_blank" rel="noopener">Ver no site</a></header>
      <div class="lancha-topo">
        <section class="cartao"><h2 style="font-size:1.1rem;margin-bottom:12px">Fotos</h2>
          <div class="fotos">${[1, 2, 3, 4].map((n) => `<img src="../assets/img/lanchas/${l.id}/0${n}-p.webp" alt="" loading="lazy" onerror="this.remove()">`).join('')}</div>
          <button class="botao botao--leve botao--cheio" type="button" data-prototipo style="margin-top:14px"><svg><use href="#p-foto"/></svg>Adicionar fotos</button>
          <p style="margin:10px 0 0;font-size:.9rem;color:var(--suave)">Pode mandar a foto do jeito que estiver. O painel melhora, recorta e deixa leve sozinho.</p>
        </section>
        <section class="cartao agenda-dono"><h3><svg><use href="#p-agenda"/></svg>${proprio ? 'Agenda' : 'Agenda do dono'}</h3>
          ${estado}
          ${proprio ? '<p style="margin:0;color:var(--suave)">Os passeios que você marca na Agenda já aparecem no site.</p>'
            : `<div class="acoes"><button class="botao ${l.agenda ? 'botao--leve' : 'botao--principal'} botao--cheio" type="button" data-conectar="${l.id}">${l.agenda ? 'Trocar a agenda conectada' : 'Conectar agenda do dono'}</button>
               <button class="botao botao--wa botao--cheio" type="button" data-instrucoes="${l.id}"><svg><use href="#p-wa"/></svg>Mandar instruções ao parceiro</button></div>`}
        </section>
      </div>
      <section class="bloco cartao"><h2 style="font-size:1.1rem;margin-bottom:14px">Dados que aparecem no site</h2>
        <div class="grade-2">
          <label class="campo"><span>Nome</span><input value="${esc(l.nome)}"></label>
          <label class="campo"><span>Quantas pessoas leva</span><input inputmode="numeric" value="${l.pax}"></label>
          <label class="campo"><span>Tamanho (pés)</span><input inputmode="numeric" value="${l.pes}"></label>
          <label class="campo"><span>Dono</span><select><option>${esc(l.dono)}</option></select></label>
        </div>
        <label class="campo"><span>Mostrar no site</span><select><option>Sim, aparece no site</option><option>Não, esconder por enquanto</option></select></label>
        <button class="botao botao--principal" type="button" data-salvar-lancha>Salvar</button>
      </section>`;
  }

  function conectarAgenda(id) {
    const l = lancha(id);
    abreGaveta('Conectar agenda do dono', `
      <p style="margin-top:0">Como o ${esc(l.dono.split(' ')[0])} anota os dias ocupados da ${esc(l.nome)}?</p>
      <div class="escolhas">
        <button class="escolha" type="button" data-tipo="google"><span class="linha__icone"><svg><use href="#p-agenda"/></svg></span><span><b>No Google Agenda</b><span>O mais comum. Ele te manda um link e você cola aqui.</span></span></button>
        <button class="escolha" type="button" data-tipo="planilha"><span class="linha__icone"><svg><use href="#p-mais"/></svg></span><span><b>Numa planilha do Google</b><span>Ele publica a planilha e te manda o link.</span></span></button>
        <button class="escolha" type="button" data-tipo="manual"><span class="linha__icone"><svg><use href="#p-lancha"/></svg></span><span><b>Ele me avisa pelo WhatsApp</b><span>Você marca os dias ocupados na Agenda do painel.</span></span></button>
      </div>`, (c) => {
      c.querySelectorAll('[data-tipo]').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.tipo === 'manual') { l.agenda = 'manual'; fechaGaveta(); rota(); avisa('Pronto. Marque os dias do dono na Agenda.'); return; }
        colarLink(l, b.dataset.tipo);
      }));
    });
  }

  function colarLink(l, tipo) {
    const google = tipo === 'google';
    abreGaveta(google ? 'Colar o link do Google Agenda' : 'Colar o link da planilha', `
      <a class="video-ajuda" href="#" data-prototipo><span><svg><use href="#p-play"/></svg></span><span><b>Vídeo de 1 minuto</b><small>Mostra onde o parceiro acha esse link. Você pode mandar para ele.</small></span></a>
      <ol class="passos">${google
        ? '<li>O parceiro abre o Google Agenda no computador e vai em Configurações.</li><li>Clica no nome da agenda da lancha, em "Integrar agenda".</li><li>Copia o "Endereço secreto no formato iCal" e te manda pelo WhatsApp.</li>'
        : '<li>O parceiro abre a planilha e vai em Arquivo, Compartilhar, Publicar na Web.</li><li>Escolhe "Valores separados por vírgula (.csv)" e clica em Publicar.</li><li>Copia o link e te manda pelo WhatsApp.</li>'}</ol>
      <label class="campo"><span>Cole aqui o link que ele mandou</span><input type="url" data-link placeholder="${google ? 'https://calendar.google.com/calendar/ical/...' : 'https://docs.google.com/spreadsheets/...'}"></label>
      <div data-resultado></div>
      <button class="botao botao--principal botao--cheio" type="button" data-testar>Conectar</button>
      <button class="botao botao--wa botao--cheio" type="button" data-instrucoes="${l.id}" style="margin-top:10px"><svg><use href="#p-wa"/></svg>Mandar estas instruções ao parceiro</button>`, (c) => {
      c.querySelector('[data-testar]').addEventListener('click', () => {
        const v = c.querySelector('[data-link]').value.trim();
        const res = c.querySelector('[data-resultado]');
        const ok = google ? /calendar\.google\.com\/calendar\/ical\/.+\.ics/.test(v) || v.endsWith('.ics') : /docs\.google\.com\/spreadsheets/.test(v);
        if (!ok) {
          res.innerHTML = `<div class="alerta" style="margin-bottom:16px"><div><b>Esse link não parece o certo.</b><p style="margin:2px 0 0">${google ? 'O link certo começa com https://calendar.google.com/calendar/ical/ e termina com .ics. Peça de novo ao parceiro, mostrando o vídeo.' : 'O link certo começa com https://docs.google.com/spreadsheets/. Peça de novo ao parceiro.'}</p></div></div>`;
          return;
        }
        l.agenda = tipo; l.ocupados = 11;
        res.innerHTML = '<div class="resultado"><svg><use href="#p-ok"/></svg><div><b>Deu certo!</b><br>Encontramos 11 dias ocupados nos próximos 90 dias. A agenda se atualiza sozinha a cada 15 minutos.</div></div>';
        c.querySelector('[data-testar]').textContent = 'Concluir';
        c.querySelector('[data-testar]').addEventListener('click', () => { fechaGaveta(); rota(); avisa('Agenda do dono conectada.'); }, { once: true });
      });
    });
  }

  function instrucoes(id) {
    const l = lancha(id);
    const txt = `Oi, ${l.dono.split(' ')[0]}! Para a agenda da ${l.nome} aparecer no site da Barra Boat, preciso do link da sua agenda. É rapidinho: abra o Google Agenda no computador, vá em Configurações, clique na agenda da lancha, depois em "Integrar agenda", e copie o "Endereço secreto no formato iCal". Me manda aqui. Vídeo mostrando: barraboatfloripa.com.br/parceiro`;
    abreGaveta('Mensagem para o parceiro', `
      <p style="margin-top:0">Esta mensagem vai pronta no WhatsApp. Você pode mudar antes de enviar.</p>
      <div class="conversa"><div class="msg msg--nos">${esc(txt)}</div></div>
      <a class="botao botao--wa botao--cheio" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener" style="margin-top:16px"><svg><use href="#p-wa"/></svg>Abrir no WhatsApp</a>`);
  }

  /* ================= MAIS ================= */
  function telaMais() {
    const itens = [
      ['#lanchas', 'p-lancha', 'Lanchas', 'Fotos, dados e agenda de cada lancha'],
      ['', 'p-agenda', 'Roteiros', 'Campeche, Costa da Lagoa e as paradas'],
      ['', 'p-clientes', 'Marinheiros', 'Quem vai em cada passeio'],
      ['', 'p-dinheiro', 'Parceiros e comissões', 'Quem vende e quanto tem a receber'],
      ['', 'p-wa', 'Robô do WhatsApp', 'O que ele responde e quando fica quieto'],
      ['', 'p-wa', 'Mensagens para muita gente', 'Avisar a base de clientes de uma vez'],
      ['', 'p-hoje', 'Textos do site', 'Perguntas frequentes, avaliações e vídeos'],
      ['', 'p-clientes', 'Quem acessa o painel', 'Você, a equipe, parceiros e marinheiros'],
    ];
    tela.innerHTML = `<header class="cab"><div><h1>Mais</h1><p>O que você mexe de vez em quando.</p></div></header>
      <ul class="lista">${itens.map(([h, i, t, s]) => `<li><${h ? `a href="${h}"` : 'button type="button" data-prototipo'} class="linha">
        <span class="linha__icone"><svg><use href="#${i}"/></svg></span><span class="linha__corpo"><b>${t}</b><span>${s}</span></span><svg><use href="#p-seta"/></svg></${h ? 'a' : 'button'}></li>`).join('')}</ul>`;
  }

  /* ================= rotas e cliques ================= */
  function rota() {
    const h = (location.hash || '#hoje').slice(1);
    const [base, arg] = h.split('/');
    const nav = base === 'lanchas' || base === 'lancha' ? 'mais' : base;
    document.querySelectorAll('[data-nav]').forEach((a) => { if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    ({ hoje: telaHoje, agenda: telaAgenda, clientes: telaClientes, dinheiro: telaDinheiro, mais: telaMais, lanchas: telaLanchas, lancha: () => telaLancha(arg) }[base] || telaHoje)();
  }
  window.addEventListener('hashchange', () => { rota(); window.scrollTo(0, 0); tela.focus({ preventScroll: true }); });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-cliente],[data-despesa],[data-dia],[data-etapa],[data-aba-d],[data-conectar],[data-instrucoes],[data-prototipo],[data-recebi],[data-avisar-clima],[data-salvar-lancha]');
    if (!t) return;
    const d = t.dataset;
    if (d.cliente) abreCliente(d.cliente);
    else if ('despesa' in d) anotarDespesa();
    else if (d.dia) abreDia(...d.dia.split('|'));
    else if (d.etapa) { etapaAtual = d.etapa; telaClientes(); }
    else if (d.abaD) { abaDinheiro = d.abaD; telaDinheiro(); }
    else if (d.conectar) conectarAgenda(d.conectar);
    else if (d.instrucoes) instrucoes(d.instrucoes);
    else if (d.recebi) { avisa('Anotado: restante recebido.'); t.disabled = true; t.textContent = 'Recebido'; }
    else if ('avisarClima' in d) avisa('No painel de verdade, abre o WhatsApp com a mensagem pronta.');
    else if ('salvarLancha' in d) avisa('Lancha salva.');
    else if ('prototipo' in d) { e.preventDefault(); avisa('Esta parte fica pronta na próxima etapa.'); }
  });

  rota();
})();
