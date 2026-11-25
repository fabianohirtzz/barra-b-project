/* Painel Barra Boat | ligado ao Supabase (projeto compartilhado do HD360, tabelas bb_).
   Quem protege os dados é o banco: cada tabela confere em bb_equipe quem está logado e
   com qual papel. Esta tela só mostra e grava; nunca confia em si mesma para permissão.
   O protótipo aprovado em 17/11 continua em prototipo.html (mesmo jeito, dados de exemplo). */
(function () {
  'use strict';

  const CFG = window.BB_CONFIG || {};
  const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

  /* ================= datas, números e textos ================= */
  const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const deIso = (s) => { const [a, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(a, m - 1, d); };
  const somaDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const hoje = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const dd = (d) => pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
  const ddIso = (s) => (s ? dd(deIso(s)) : '');
  const diaLongo = (d) => `${d.getDate()} de ${MESES_LONGOS[d.getMonth()]}`;
  const faixa = (ini, fim) => {
    const a = deIso(ini), b = deIso(fim);
    if (ini === fim) return `Dia ${diaLongo(a)}`;
    return a.getMonth() === b.getMonth() ? `De ${a.getDate()} a ${diaLongo(b)}` : `De ${diaLongo(a)} a ${diaLongo(b)}`;
  };
  const hora = (t) => { if (!t) return ''; const [h, m] = t.split(':'); return Number(h) + 'h' + (m !== '00' ? m : ''); };
  const R = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  // nos campos: mostra centavos quando houver, para salvar de volta sem arredondar
  const Rc = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 2 });
  // "R$ 1.250,50" -> 1250.5
  const num = (s) => Number(String(s || '').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || 0;
  const esc = (s) => (s == null ? '' : String(s)).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Telefone sempre em E.164: a mesma pessoa com dois formatos vira dois contatos (lição da PO).
  const fone = (s) => { let d = String(s || '').replace(/\D/g, ''); if (!d) return null; if (d.length === 10 || d.length === 11) d = '55' + d; return '+' + d; };
  const foneTela = (e) => {
    const d = String(e || '').replace(/\D/g, '');
    if (d.startsWith('55') && d.length >= 12) { const n = d.slice(4); return `(${d.slice(2, 4)}) ${n.length === 9 ? n.slice(0, 5) + '-' + n.slice(5) : n.slice(0, 4) + '-' + n.slice(4)}`; }
    return e || '';
  };
  const primeiroNome = (s) => String(s || '').trim().split(/\s+/)[0] || '';
  const quando = (ts) => {
    const min = Math.round((Date.now() - new Date(ts)) / 6e4);
    if (min < 60) return `há ${Math.max(min, 1)} min`;
    if (min < 1440) return `há ${Math.round(min / 60)} h`;
    const dias = Math.round(min / 1440);
    return dias === 1 ? 'ontem' : `há ${dias} dias`;
  };

  const ETAPAS = [
    { id: 'novos', nome: 'Novos', ajuda: 'Pessoas que mandaram mensagem e ainda não foram atendidas.' },
    { id: 'conversando', nome: 'Conversando', ajuda: 'Já disseram a data e quantas pessoas vão.' },
    { id: 'orcamento', nome: 'Orçamento enviado', ajuda: 'Você já mandou o valor. Falta a resposta.' },
    { id: 'fechados', nome: 'Fechados', ajuda: 'Pagaram o sinal. O passeio está na agenda.' },
    { id: 'perdidos', nome: 'Não fecharam', ajuda: 'Desistiram ou fecharam com outra empresa. Fica anotado o motivo.' },
  ];
  const ORIGENS = [
    ['google_ads', 'Google (anúncio)'], ['google', 'Google (sem anúncio)'], ['instagram', 'Instagram'],
    ['tiktok', 'TikTok'], ['indicacao', 'Indicação'], ['parceiro', 'Parceiro'], ['direto', 'Outro'],
  ];
  const nomeOrigem = (o) => (ORIGENS.find((x) => x[0] === o) || [null, 'Não informado'])[1];
  const MOTIVOS_PERDA = ['Achou caro', 'Fechou com outra empresa', 'Mudou a data', 'Grupo maior que a lancha', 'Parou de responder', 'Outro'];
  const MOTIVOS_FECHAR = ['Empresa fechada', 'Férias', 'Feriado', 'Manutenção', 'Outro'];
  const CATEGORIAS = ['Combustível', 'Marinheiro', 'Gelo, carvão e frutas', 'Manutenção', 'Marina e vaga', 'Seguro', 'Documentação', 'Anúncios', 'Repasse a parceiro', 'Comissão', 'Outros'];
  const FORMAS = [['pix', 'Pix'], ['dinheiro', 'Dinheiro'], ['cartao', 'Cartão'], ['transferencia', 'Transferência']];
  const CORES = ['#1A6FA8', '#C97A2A', '#5B8C3A', '#8A5DB0', '#B04A5A', '#3A8C8C'];

  /* ================= estado (o que veio do banco) ================= */
  const S = { user: null, papel: null, nome: '', lanchas: [], parceiros: [], marinheiros: [], roteiros: [], leads: [], receb: [], passeios: [], bloqueios: [], dono: [], despesas: [], metas: {}, clima: [], vende: [] };

  /* ================= alerta de clima (item 38) =================
     A previsão chega pronta em bb_clima (um registro por dia, gravado pelo servidor).
     Passou de um destes limites, o dia vira alerta na tela Hoje. */
  const CLIMA = { vento: 30, rajada: 45, chuva: 5, chuvaProb: 60 };
  const RUMOS = ['norte', 'nordeste', 'leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste'];
  const rumo = (g) => (g == null ? '' : RUMOS[Math.round(Number(g) / 45) % 8]);
  function climaRuim(c) {
    const vento = Number(c.vento_kmh) >= CLIMA.vento || Number(c.rajada_kmh) >= CLIMA.rajada;
    const chuva = Number(c.chuva_mm) >= CLIMA.chuva && (c.chuva_prob == null || Number(c.chuva_prob) >= CLIMA.chuvaProb);
    if (!vento && !chuva) return null;
    const partes = [];
    if (vento) partes.push(`vento ${rumo(c.direcao_graus)} forte (${Math.round(c.vento_kmh)} km/h${c.rajada_kmh ? `, rajadas de ${Math.round(c.rajada_kmh)}` : ''})`.replace('  ', ' '));
    if (chuva) partes.push(`chuva (${String(Number(c.chuva_mm)).replace('.', ',')} mm)`);
    return { vento, chuva, texto: partes.join(' e ') };
  }
  const dona = () => S.papel === 'dona';
  const porId = (lista, id) => (id ? lista.find((x) => x.id === id) : null);
  const lancha = (id) => porId(S.lanchas, id);
  const lead = (id) => porId(S.leads, id);
  const roteiro = (id) => porId(S.roteiros, id);
  const marinheiro = (id) => porId(S.marinheiros, id);
  const parceiro = (id) => porId(S.parceiros, id);
  const recebido = (id) => S.receb.filter((r) => r.lead_id === id).reduce((s, r) => s + Number(r.valor), 0);
  // "Falta receber" é sempre calculado: valor fechado menos o que entrou (nunca um saldo copiado).
  const falta = (l) => Math.max(Number(l.valor_fechado) - recebido(l.id), 0);
  const passeioDoLead = (id) => S.passeios.find((p) => p.lead_id === id);
  // Mês da venda = dia do passeio; sem passeio, a data pedida; sem ela, o dia em que fechou.
  const diaVenda = (l) => { const p = passeioDoLead(l.id); return p ? p.dia : (l.data_desejada || String(l.fechado_at || '').slice(0, 10)); };
  const corLancha = (l) => l.cor || (l.parceiro_id ? CORES[Math.max(S.parceiros.findIndex((p) => p.id === l.parceiro_id), 0) % CORES.length] : '#083359');
  const donoNome = (l) => (l.parceiro_id ? ((parceiro(l.parceiro_id) || {}).nome || 'Parceiro') : 'Própria');
  const lanchasAtivas = () => S.lanchas.filter((l) => l.ativo);
  // Dados fictícios da apresentação (supabase/demo): somem no lançamento. O selo avisa para não
  // cadastrar nada de verdade em cima deles.
  const exemplo = (x) => !!x && (String(x.id || '').startsWith('de300000-') || x.origem_import === 'demo');
  const seloExemplo = (x) => (exemplo(x) ? ' <span class="selo selo--neutro selo--exemplo" title="Dado de exemplo: será apagado antes do lançamento">exemplo</span>' : '');
  const digitos = (t) => String(t || '').replace(/\D/g, '');
  const linkWa = (tel, txt) => `https://wa.me/${digitos(tel)}${txt ? '?text=' + encodeURIComponent(txt) : ''}`;

  async function todos(monta) {
    let out = [];
    for (let de = 0; ; de += 1000) {
      const { data, error } = await monta().range(de, de + 999);
      if (error) throw error;
      out = out.concat(data || []);
      if (!data || data.length < 1000) return out;
    }
  }
  const um = (q) => q.then(({ data, error }) => { if (error) throw error; return data || []; });

  async function carrega() {
    if (restrito()) return carregaRestrito();
    const anoPassado = `${hoje().getFullYear() - 1}-01-01`;
    const recente = iso(somaDias(hoje(), -60));
    const [lanchas, parceiros, marinheiros, roteiros, leads, receb, passeios, bloqueios, dono] = await Promise.all([
      um(sb.from('bb_lanchas').select('id,slug,nome,pes,passageiros,regiao,descricao,itens,capa_url,fotos,parceiro_id,cor,ativo,ordem,agenda_palavra,embarque_local,embarque_maps,embarque_hora,marinheiro_id').order('ordem').order('nome')),
      um(sb.from('bb_parceiros').select('*').order('nome')),
      um(sb.from('bb_marinheiros').select('*').order('nome')),
      um(sb.from('bb_roteiros').select('id,slug,nome,ativo').order('ordem')),
      todos(() => sb.from('bb_leads').select('id,created_at,updated_at,nome,wa_id,email,idioma,mensagem,data_desejada,data_texto,pessoas,roteiro_id,lancha_id,etapa,motivo_perda,valor_orcado,valor_fechado,custos_passeio,orcamento_at,fechado_at,perdido_at,notas,origem,origem_manual,origem_import,parceiro_id').order('created_at', { ascending: false })),
      todos(() => sb.from('bb_recebimentos').select('*').order('recebido_em').order('id')),
      todos(() => sb.from('bb_passeios').select('*').neq('status', 'cancelado').gte('dia', anoPassado).order('dia').order('id')),
      um(sb.from('bb_bloqueios').select('*').gte('fim', recente).order('inicio')),
      todos(() => sb.from('bb_agenda_dono').select('lancha_id,dia,origem').gte('dia', recente).order('dia')),
    ]);
    Object.assign(S, { lanchas, parceiros, marinheiros, roteiros, leads, receb, passeios, bloqueios, dono });
    S.vende = await um(sb.from('bb_parceiro_lanchas').select('parceiro_id,lancha_id')).catch(() => []);
    // locais de embarque cadastrados e mensagens editadas: se a tabela ainda não existir, segue com o padrão
    S.embarques = await um(sb.from('bb_embarques').select('*').order('ordem').order('nome')).catch(() => []);
    S.msgs = Object.fromEntries((await um(sb.from('bb_wa_textos').select('chave,idioma,texto').like('chave', 'passeio_%')).catch(() => []))
      .map((x) => [x.chave.replace(/^passeio_/, '') + '_' + x.idioma, x.texto]));
    // A previsão é um extra: se a tabela ainda não existir ou a leitura falhar, o painel segue sem o alerta.
    S.clima = await um(sb.from('bb_clima').select('*').gte('dia', iso(hoje())).lte('dia', iso(somaDias(hoje(), 3))).order('dia')).catch(() => []);
    if (dona()) {
      const [despesas, metas] = await Promise.all([
        todos(() => sb.from('bb_despesas').select('*').gte('dia', anoPassado).order('dia', { ascending: false }).order('id')),
        um(sb.from('bb_metas').select('*')),
      ]);
      S.despesas = despesas;
      S.metas = Object.fromEntries(metas.map((m) => [m.mes.slice(0, 7), Number(m.valor)]));
    }
  }

  /* ================= utilidades de tela ================= */
  const $ = (s, c = document) => c.querySelector(s);
  const tela = $('#tela');
  const gaveta = $('#gaveta');
  let ultimoFoco = null;

  function abreGaveta(titulo, html, aoAbrir) {
    if (gaveta.hidden) ultimoFoco = document.activeElement;
    $('#gaveta-titulo').textContent = titulo;
    $('#gaveta-corpo').innerHTML = html;
    $('#gaveta-corpo').scrollTop = 0;
    gaveta.hidden = false;
    document.body.style.overflow = 'hidden';
    $('[data-fechar].botao-icone', gaveta).focus();
    if (aoAbrir) aoAbrir($('#gaveta-corpo'));
  }
  function fechaGaveta() {
    gaveta.hidden = true;
    document.body.style.overflow = '';
    if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus();
  }
  gaveta.addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) fechaGaveta(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !gaveta.hidden) fechaGaveta(); });

  let tAviso;
  function avisa(txt, erro) {
    const a = $('#aviso');
    a.className = 'aviso' + (erro ? ' aviso--erro' : '');
    a.innerHTML = (erro ? '' : '<svg><use href="#p-ok"/></svg>') + esc(txt);
    a.hidden = false;
    clearTimeout(tAviso);
    tAviso = setTimeout(() => { a.hidden = true; }, erro ? 6000 : 2800);
  }

  function msgErro(e) {
    if (!e) return 'Não deu certo. Tente de novo.';
    if (e.code === '23505') return /passeios/.test(e.message || '') ? 'Essa lancha já tem passeio neste dia.' : 'Isso já está cadastrado.';
    if (e.code === '23503') return 'Não dá para apagar: tem passeios ou valores ligados a este cadastro.';
    if (e.code === 'P0001') return e.message; // mensagens do banco já vêm em português (ex.: agenda fechada)
    if (e.code === '42501' || /row-level security/i.test(e.message || '')) return 'Seu acesso não permite essa alteração.';
    if (/JWT|token/i.test(e.message || '')) return 'Sua sessão expirou. Entre de novo.';
    return 'Não deu certo salvar. Confira a internet e tente de novo.';
  }
  // Grava e devolve os dados (ou true). Em erro, mostra a mensagem e devolve null.
  async function grava(q) {
    const { data, error } = await q;
    if (error) { console.error(error); avisa(msgErro(error), true); return null; }
    return data == null ? true : data;
  }
  // Botão que grava: trava enquanto salva (clique duplo não cria dois registros).
  function aoSalvar(botao, fn) {
    botao.addEventListener('click', async () => {
      if (botao.disabled) return;
      const txt = botao.innerHTML;
      botao.disabled = true; botao.textContent = 'Salvando';
      try { await fn(); } finally { if (document.contains(botao)) { botao.disabled = false; botao.innerHTML = txt; } }
    });
  }
  // Ação que apaga: primeiro toque pede confirmação no próprio botão.
  function confirmaNoBotao(botao, pergunta, fn) {
    let armado = false;
    botao.addEventListener('click', () => {
      if (!armado) { armado = true; botao.dataset.txt = botao.textContent; botao.textContent = pergunta; botao.classList.add('botao--perigo'); setTimeout(() => { if (document.contains(botao) && armado) { armado = false; botao.textContent = botao.dataset.txt; botao.classList.remove('botao--perigo'); } }, 4000); return; }
      armado = false; fn();
    });
  }
  function chips(c, sel, cb) {
    c.querySelectorAll(sel).forEach((b) => b.addEventListener('click', () => {
      c.querySelectorAll(sel).forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true'); cb(b);
    }));
  }
  const erroCampo = (c, txt) => { const e = c.querySelector('[data-erro]'); e.textContent = txt; e.hidden = !txt; return false; };

  async function atualiza() {
    try { await carrega(); } catch (e) { console.error(e); avisa(msgErro(e), true); }
    rota();
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

  const opcoes = (lista, sel, rotulo, vazio) => (vazio != null ? `<option value="">${esc(vazio)}</option>` : '') +
    lista.map((x) => `<option value="${x.id}"${x.id === sel ? ' selected' : ''}>${esc(rotulo(x))}</option>`).join('');
  const vazio = (txt) => `<li class="cartao vazio">${esc(txt)}</li>`;

  /* ================= mensagens prontas do passeio =================
     Para o dono da lancha (parceiro) e para o marinheiro, pelo WhatsApp da Michele.
     Abre a conversa com o texto pronto; ela confere e envia. */
  const diaDoPasseio = (p) => { const d = deIso(p.dia); return `${DIAS_LONGOS[d.getDay()].toLowerCase()}, ${dd(d)}`; };
  // Onde embarca: o que foi combinado no passeio; sem isso, o de sempre da lancha; sem isso, o canal da Barra.
  const EMBARQUE_SEDE = { local: 'Canal da Barra da Lagoa, Rod. Jorn. Manoel de Menezes, 3007', maps: 'https://maps.app.goo.gl/BpSAjwD4joPXAXKb7' };
  const textoEmb = (e) => (e.endereco ? `${e.nome}, ${e.endereco}` : e.nome);
  const embarquesAtivos = () => (S.embarques || []).filter((e) => e.ativo !== false);
  // O ponto de sempre: o primeiro local cadastrado; sem cadastro, a sede no canal da Barra.
  const embPadrao = () => { const e = embarquesAtivos()[0]; return e ? { local: textoEmb(e), maps: e.maps || '' } : EMBARQUE_SEDE; };
  function embarqueDe(p) {
    const l = lancha(p.lancha_id) || {};
    if (p.embarque_local) return { local: p.embarque_local, maps: p.embarque_maps || '' };
    if (l.embarque_local) return { local: l.embarque_local, maps: l.embarque_maps || '' };
    return embPadrao();
  }
  /* Lista dos locais cadastrados acima dos campos de texto do embarque: escolher um preenche o
     local e o mapa; escrever à mão vira "Outro lugar". */
  function listaEmbarque(local, rotulo) {
    const lista = embarquesAtivos();
    if (!lista.length) return '';
    const sel = lista.find((e) => textoEmb(e) === local);
    return `<label class="campo"><span>${esc(rotulo || 'Local de embarque')}</span><select data-emb-lista>
      ${lista.map((e) => `<option value="${e.id}"${sel && sel.id === e.id ? ' selected' : ''}>${esc(e.nome)}</option>`).join('')}
      <option value=""${!sel && local ? ' selected' : ''}>Outro lugar (escrever abaixo)</option>
      ${!local ? '<option value="-" selected>Nenhum</option>' : ''}</select>
      <small class="caixas__ajuda">Falta um ponto na lista? Cadastre em Locais de embarque.</small></label>`;
  }
  function ligaListaEmbarque(c, campoLocal, campoMaps) {
    const sel = c.querySelector('[data-emb-lista]');
    if (!sel) return;
    sel.addEventListener('change', () => {
      const e = (S.embarques || []).find((x) => x.id === sel.value);
      if (e) { campoLocal.value = textoEmb(e); campoMaps.value = e.maps || ''; }
      else if (sel.value === '-') { campoLocal.value = ''; campoMaps.value = ''; }
      else campoLocal.focus();
      campoLocal.dispatchEvent(new Event('lista'));
    });
    const volta = () => { const e = embarquesAtivos().find((x) => textoEmb(x) === campoLocal.value.trim()); sel.value = e ? e.id : ''; };
    campoLocal.addEventListener('input', () => {
      // escreveu outro lugar à mão: o mapa que veio do local cadastrado não serve mais
      const antes = (S.embarques || []).find((x) => x.id === sel.value);
      volta();
      if (antes && !sel.value && campoMaps.value === (antes.maps || '')) campoMaps.value = '';
    });
    campoLocal.addEventListener('preenchido', volta);
  }
  const linkEmbarque = (p) => { const e = embarqueDe(p); return e.maps ? `<a href="${esc(e.maps)}" target="_blank" rel="noopener">${esc(e.local)}</a>` : esc(e.local); };
  const nomeRoteiro = (p) => (p.personalizado ? 'Personalizado' : (roteiro(p.roteiro_id) || {}).nome || 'a combinar');
  /* Mensagens do passeio: modelos com {campos}, editáveis em WhatsApp > Mensagens do passeio
     (guardados em bb_wa_textos, chave passeio_<para>, idioma). Linha com um campo vazio não vai
     na mensagem (ex.: sem marinheiro definido, some a linha "Marinheiro: ..."). */
  const MSG_PADRAO = {
    cliente_pt: `Olá, {nome}! Seguem os dados do seu passeio com a Barra Boat Floripa:

Dia: {dia}
Embarque: {hora}
Local de embarque: {local}
Mapa: {mapa}
Lancha: {lancha}
Roteiro: {roteiro}
Pessoas: {pessoas}
Marinheiro: {marinheiro}
O que combinamos: {pedido}
Deslocamento até o local de embarque: {deslocamento}
Valor do passeio: {pagamento}

Chegue 15 minutos antes. Qualquer dúvida, é só chamar aqui.`,
    cliente_es: `¡Hola, {nome}! Estos son los datos de tu paseo con Barra Boat Floripa:

Fecha: {dia}
Embarque: {hora}
Lugar de embarque: {local}
Mapa: {mapa}
Lancha: {lancha}
Recorrido: {roteiro}
Personas: {pessoas}
Marinero: {marinheiro}
Lo que combinamos: {pedido}
Traslado hasta el lugar de embarque: {deslocamento}
Valor del paseo: {pagamento}

Llega 15 minutos antes. Cualquier duda, escríbenos aquí.`,
    marinheiro_pt: `Oi, {nome}! Passeio na {lancha}:

Dia: {dia}
Saída: {hora}
Embarque: {local}
Mapa: {mapa}
Roteiro: {roteiro}
Pessoas: {pessoas}
Cliente: {cliente}
Pedido do cliente: {pedido}
Deslocamento: {deslocamento}
Observação: {obs}`,
    parceiro_pt: `Oi, {nome}! Reserva da {lancha} pela Barra Boat Floripa:

Dia: {dia}
Saída: {hora}
Embarque: {local}
Mapa: {mapa}
Roteiro: {roteiro}
Pessoas: {pessoas}
Cliente: {cliente}
Marinheiro: {marinheiro}
Pedido do cliente: {pedido}
Deslocamento: {deslocamento}
Observação: {obs}`,
    vendedor_pt: `Oi, {nome}! Está confirmado o passeio do seu cliente com a Barra Boat Floripa:

Cliente: {cliente}
Dia: {dia}
Embarque: {hora}
Local de embarque: {local}
Mapa: {mapa}
Lancha: {lancha}
Roteiro: {roteiro}
Pessoas: {pessoas}
Marinheiro: {marinheiro}
Pedido do cliente: {pedido}

Peça para o grupo chegar 15 minutos antes. Qualquer mudança, é só avisar aqui.`,
  };
  const MSG_INFO = [
    ['cliente_pt', 'Para o cliente', 'Português. Vai pelo botão "Mandar ao cliente". Nunca leva o telefone do marinheiro.'],
    ['cliente_es', 'Para o cliente que fala espanhol', 'Usada quando o idioma do cliente é espanhol.'],
    ['marinheiro_pt', 'Para o marinheiro', 'Leva só o nome do cliente, sem o telefone.'],
    ['parceiro_pt', 'Para o parceiro dono da lancha', 'Quando o passeio é numa lancha de parceiro. Leva só o nome do cliente.'],
    ['vendedor_pt', 'Para o parceiro que vendeu', 'Quando o passeio foi marcado como "Cliente de parceiro".'],
  ];
  const MSG_CAMPOS = {
    nome: 'primeiro nome de quem recebe', dia: 'dia do passeio', hora: 'horário de embarque', local: 'local de embarque', mapa: 'link do Google Maps',
    lancha: 'nome da lancha', roteiro: 'roteiro', pessoas: 'número de pessoas', marinheiro: 'nome do marinheiro', cliente: 'nome do cliente',
    pedido: 'o que o cliente pediu (personalizado)', deslocamento: 'deslocamento (valor para o cliente; aviso para a equipe)', pagamento: 'valor e quanto falta pagar', obs: 'observação do passeio',
  };
  const modeloMsg = (k) => (S.msgs && S.msgs[k]) || MSG_PADRAO[k];
  function montaMsg(modelo, v) {
    let t = String(modelo);
    if (!v.nome) t = t.replace(/,?\s*\{nome\}/g, '');   // "Olá, {nome}!" sem nome vira "Olá!"
    return t.split('\n').filter((linha) => {
      const campos = linha.match(/\{(\w+)\}/g) || [];
      return campos.every((c) => { const k = c.slice(1, -1); return !(k in v) || (v[k] != null && String(v[k]) !== ''); });
    }).map((linha) => linha.replace(/\{(\w+)\}/g, (c, k) => (k in v ? String(v[k]) : c)))
      .join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  // Para quem vai a mensagem: 'cliente', 'marinheiro', 'parceiro' (dono da lancha) ou 'vendedor'.
  function textoPasseio(p, para) {
    const l = lancha(p.lancha_id) || { nome: 'lancha' }, c = lead(p.lead_id), m = marinheiro(p.marinheiro_id);
    const es = para === 'cliente' && c && c.idioma === 'es';
    const emb = embarqueDe(p);
    const valor = c ? Number(c.valor_fechado) || 0 : 0, falta_ = c && valor ? falta(c) : 0;
    const quem = para === 'cliente' ? c : para === 'marinheiro' ? m : para === 'parceiro' ? parceiro(l.parceiro_id) : parceiro(c && c.parceiro_id);
    const d = deIso(p.dia);
    const v = {
      nome: quem && quem.nome ? primeiroNome(quem.nome) : '',
      dia: es ? `${['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][d.getDay()]}, ${ddIso(p.dia)}` : diaDoPasseio(p),
      hora: p.hora_saida ? hora(p.hora_saida) : (es ? 'a combinar' : 'a combinar'),
      local: emb.local, mapa: emb.maps || '', lancha: l.nome,
      roteiro: p.personalizado ? (es ? 'personalizado' : 'Personalizado') : nomeRoteiro(p),
      pessoas: p.pessoas || (c && c.pessoas) || '',
      marinheiro: m ? m.nome : '', cliente: c && c.nome ? c.nome : '',
      pedido: p.personalizado && p.pedido ? p.pedido : '',
      deslocamento: !p.deslocamento ? '' : para === 'cliente' ? (Number(p.deslocamento_valor) ? R(p.deslocamento_valor) : '') : 'buscar o grupo no local de embarque acima',
      pagamento: valor ? `${R(valor)}${falta_ ? (es ? `, falta pagar ${R(falta_)}` : `, falta pagar ${R(falta_)}`) : (es ? ', pagado' : ', pago')}` : '',
      obs: p.obs || '',
    };
    return montaMsg(modeloMsg(para === 'cliente' ? (es ? 'cliente_es' : 'cliente_pt') : para + '_pt'), v);
  }
  // Botões de envio (só aparecem quando há para quem mandar).
  function botoesEnvio(p, pequeno) {
    const l = lancha(p.lancha_id) || {}, dono = parceiro(l.parceiro_id), m = marinheiro(p.marinheiro_id), c = lead(p.lead_id);
    const vend = c && c.parceiro_id && (!dono || c.parceiro_id !== dono.id) ? parceiro(c.parceiro_id) : null;
    const cls = `botao botao--wa${pequeno ? ' botao--pequeno' : ''}`;
    const bt = (tel, para, rot) => (tel ? `<a class="${cls}" href="${linkWa(tel, textoPasseio(p, para))}" target="_blank" rel="noopener"><svg><use href="#p-wa"/></svg>${rot}</a>` : '');
    return [
      c && c.wa_id ? bt(c.wa_id, 'cliente', 'Mandar ao cliente') : '',
      m ? bt(m.telefone, 'marinheiro', 'Mandar ao marinheiro') : '',
      dono ? bt(dono.telefone, 'parceiro', vend ? 'Mandar ao dono da lancha' : 'Mandar ao parceiro') : '',
      vend ? bt(vend.telefone, 'vendedor', 'Mandar ao parceiro que vendeu') : '',
    ].join('');
  }

  /* ================= LOCAIS DE EMBARQUE =================
     Os pontos de onde os passeios saem. Ao marcar um passeio (e no cadastro da lancha) a equipe
     escolhe da lista e o link do mapa vem junto. O primeiro da lista é o ponto de sempre. */
  function telaEmbarques() {
    const lista = S.embarques || [];
    tela.innerHTML = `<header class="cab"><div><h1>Locais de embarque</h1><p>Cadastre aos poucos os pontos de onde os passeios saem. Ao marcar um passeio, é só escolher da lista: o endereço e o mapa vêm junto.</p></div>
        <button class="botao botao--principal" type="button" data-novo-emb><svg><use href="#p-mais-um"/></svg>Cadastrar local</button></header>
      <ul class="lista">${lista.map((e, i) => `<li><button class="linha${e.ativo === false ? ' is-desligada' : ''}" type="button" data-emb="${e.id}"><span class="linha__icone"><svg><use href="#p-pino"/></svg></span>
        <span class="linha__corpo"><b>${esc(e.nome)}${i === 0 && e.ativo !== false ? ' <span class="selo selo--bom">ponto de sempre</span>' : ''}${e.ativo === false ? ' <span class="selo selo--neutro">fora da lista</span>' : ''}</b>
        <span>${esc([e.endereco, e.maps ? 'com mapa' : 'sem link do mapa'].filter(Boolean).join(' · '))}</span></span><svg><use href="#p-seta"/></svg></button></li>`).join('')
        || vazio('Nenhum local cadastrado ainda. Cadastre a sede primeiro: ela vira o ponto de sempre.')}</ul>
      ${lista.length > 1 ? '<p class="ajuda" style="margin-top:12px">O primeiro da lista é o ponto de sempre: vale para as lanchas sem embarque próprio. Para mudar, abra um local e use "Virar o ponto de sempre".</p>' : ''}`;
    tela.querySelector('[data-novo-emb]').addEventListener('click', () => editaEmbarque(null));
    tela.querySelectorAll('[data-emb]').forEach((b) => b.addEventListener('click', () => editaEmbarque(S.embarques.find((x) => x.id === b.dataset.emb))));
  }

  function editaEmbarque(e) {
    const novo = !e;
    e = e || {};
    abreGaveta(novo ? 'Cadastrar local de embarque' : e.nome, `
      <label class="campo"><span>Nome do local</span><input data-e="nome" value="${esc(e.nome || '')}" placeholder="Ex.: Trapiche da Lagoa da Conceição"></label>
      <label class="campo"><span>Endereço <small style="font-weight:400;color:var(--suave)">(opcional)</small></span><input data-e="endereco" value="${esc(e.endereco || '')}" placeholder="Rua, número, bairro"></label>
      <label class="campo"><span>Link do Google Maps <small style="font-weight:400;color:var(--suave)">(opcional)</small></span><input data-e="maps" type="url" value="${esc(e.maps || '')}" placeholder="https://maps.app.goo.gl/...">
        <small class="caixas__ajuda">No Google Maps, abra o lugar, toque em "Compartilhar" e copie o link.</small></label>
      <label class="campo"><span>Observação para a equipe <small style="font-weight:400;color:var(--suave)">(opcional, não vai na mensagem)</small></span><textarea data-e="obs" rows="2">${esc(e.obs || '')}</textarea></label>
      ${novo ? '' : `<label class="campo"><span>Aparece na lista</span><select data-e="ativo"><option value="1"${e.ativo !== false ? ' selected' : ''}>Sim</option><option value="0"${e.ativo === false ? ' selected' : ''}>Não, tirar da lista</option></select></label>`}
      <p class="erro" data-erro hidden></p>
      <div class="acoes"><button class="botao botao--principal" type="button" data-salvar>${novo ? 'Cadastrar local' : 'Salvar'}</button>
        ${!novo && S.embarques[0] && S.embarques[0].id !== e.id ? '<button class="botao botao--leve" type="button" data-primeiro>Virar o ponto de sempre</button>' : ''}</div>
      ${novo ? '' : '<section class="bloco"><button class="botao botao--perigo-leve" type="button" data-apagar-e>Apagar este local</button><p class="ajuda">Os passeios já marcados guardam o endereço e não mudam.</p></section>'}`, (g) => {
      const v = (k) => g.querySelector(`[data-e="${k}"]`);
      v('nome').focus();
      aoSalvar(g.querySelector('[data-salvar]'), async () => {
        const nome = v('nome').value.trim(), maps = v('maps').value.trim();
        if (!nome) return erroCampo(g, 'Escreva o nome do local.');
        if (maps && !/^https?:\/\//.test(maps)) return erroCampo(g, 'O link do mapa precisa começar com https://. Copie pelo botão "Compartilhar" do Google Maps.');
        const dados = { nome, endereco: v('endereco').value.trim() || null, maps: maps || null, obs: v('obs').value.trim() || null };
        if (!novo) dados.ativo = v('ativo').value === '1';
        else dados.ordem = Math.max(-1, ...S.embarques.map((x) => x.ordem || 0)) + 1;
        const ok = await grava(novo ? sb.from('bb_embarques').insert(dados) : sb.from('bb_embarques').update(dados).eq('id', e.id));
        if (!ok) return;
        fechaGaveta(); await atualiza(); avisa(novo ? 'Local cadastrado. Já aparece ao marcar passeio.' : 'Local salvo.');
      });
      const bPrim = g.querySelector('[data-primeiro]');
      if (bPrim) aoSalvar(bPrim, async () => {
        const ordem = [e].concat(S.embarques.filter((x) => x.id !== e.id));
        for (let i = 0; i < ordem.length; i++) if (!(await grava(sb.from('bb_embarques').update({ ordem: i }).eq('id', ordem[i].id)))) return;
        fechaGaveta(); await atualiza(); avisa(`${e.nome} virou o ponto de sempre.`);
      });
      const bAp = g.querySelector('[data-apagar-e]');
      if (bAp) confirmaNoBotao(bAp, 'Toque de novo para apagar', async () => {
        if (!(await grava(sb.from('bb_embarques').delete().eq('id', e.id)))) return;
        fechaGaveta(); await atualiza(); avisa('Local apagado.');
      });
    });
  }

  /* ================= MENSAGENS DO PASSEIO =================
     Os textos que os botões "Mandar ao cliente / marinheiro / parceiro" abrem no WhatsApp.
     Cada um tem {campos}; a prévia usa o próximo passeio marcado. */
  function telaMensagens() {
    const hj = iso(hoje());
    const ex = S.passeios.find((p) => p.dia >= hj && lancha(p.lancha_id)) || S.passeios[S.passeios.length - 1];
    tela.innerHTML = `<header class="cab"><div><h1>Mensagens do passeio</h1><p>O texto que abre no WhatsApp quando você toca em "Mandar ao cliente", "Mandar ao marinheiro" ou "Mandar ao parceiro". Você confere e envia.</p></div></header>
      <section class="cartao bloco"><h2 style="font-size:1.05rem;margin-bottom:8px">Como funciona</h2>
        <p style="margin:0 0 8px;color:var(--suave)">As palavras entre chaves, como <b>{dia}</b> e <b>{lancha}</b>, são trocadas pelos dados do passeio. Se um dado estiver vazio (por exemplo, sem marinheiro definido), a linha inteira sai da mensagem.</p>
        <div class="msg-campos">${Object.entries(MSG_CAMPOS).map(([k, d]) => `<span><code>{${k}}</code> ${esc(d)}</span>`).join('')}</div></section>
      ${MSG_INFO.map(([k, nome, ajuda]) => `<section class="cartao bloco msg-ed" data-msg="${k}">
        <h2 style="font-size:1.1rem;margin-bottom:4px">${esc(nome)}${S.msgs && S.msgs[k] ? ' <span class="selo selo--bom">editada</span>' : ''}</h2>
        <p class="ajuda" style="margin-top:0">${esc(ajuda)}</p>
        <div class="msg-ed__grade">
          <label class="campo"><span class="sr">Texto da mensagem</span><textarea data-texto rows="14">${esc(modeloMsg(k))}</textarea></label>
          <div class="msg-ed__previa"><b>Como fica${ex ? ` (passeio de ${ddIso(ex.dia)})` : ''}</b><pre data-previa></pre></div>
        </div>
        <div class="acoes"><button class="botao botao--principal" type="button" data-salvar-msg>Salvar</button>
          <button class="botao botao--leve" type="button" data-padrao${S.msgs && S.msgs[k] ? '' : ' hidden'}>Voltar ao texto padrão</button></div>
      </section>`).join('')}`;
    const para = (k) => (k.startsWith('cliente') ? 'cliente' : k.replace(/_pt$/, ''));
    tela.querySelectorAll('[data-msg]').forEach((sec) => {
      const k = sec.dataset.msg, ta = sec.querySelector('[data-texto]'), pre = sec.querySelector('[data-previa]');
      const previa = () => {
        if (!ex) { pre.textContent = 'Marque um passeio para ver a prévia.'; return; }
        const guarda = S.msgs[k]; S.msgs[k] = ta.value;
        const c = lead(ex.lead_id), idiomaOrig = c && c.idioma;
        if (c && k.startsWith('cliente')) c.idioma = k === 'cliente_es' ? 'es' : 'pt';
        pre.textContent = textoPasseio(ex, para(k));
        if (c) c.idioma = idiomaOrig;
        if (guarda == null) delete S.msgs[k]; else S.msgs[k] = guarda;
      };
      ta.addEventListener('input', previa); previa();
      const grava_ = async (texto) => {
        const q = texto == null ? sb.from('bb_wa_textos').delete().eq('chave', 'passeio_' + k.replace(/_(pt|es)$/, '')).eq('idioma', k.slice(-2))
          : sb.from('bb_wa_textos').upsert({ chave: 'passeio_' + k.replace(/_(pt|es)$/, ''), idioma: k.slice(-2), texto }, { onConflict: 'chave,idioma' });
        if (!(await grava(q))) return;
        await atualiza(); avisa(texto == null ? 'Voltou ao texto padrão.' : 'Mensagem salva. Os próximos envios já usam este texto.');
      };
      aoSalvar(sec.querySelector('[data-salvar-msg]'), async () => {
        const t = ta.value.trim();
        if (!t) { avisa('A mensagem não pode ficar vazia. Para desfazer, use "Voltar ao texto padrão".', true); return; }
        const soltas = (t.match(/\{(\w+)\}/g) || []).filter((c) => !(c.slice(1, -1) in MSG_CAMPOS));
        if (soltas.length) { avisa(`Não conheço ${soltas.join(', ')}. Confira se o nome do campo está igual ao da lista.`, true); return; }
        await grava_(t === MSG_PADRAO[k] ? null : t);
      });
      confirmaNoBotao(sec.querySelector('[data-padrao]'), 'Toque de novo para voltar', () => grava_(null));
    });
  }

  /* ================= HOJE ================= */
  // Um aviso por dia de tempo ruim que tenha passeio marcado (hoje e os próximos 3 dias),
  // com a mensagem pronta para cada cliente no idioma dele.
  function alertasClima(h) {
    return S.clima.map((c) => {
      const ruim = climaRuim(c);
      if (!ruim) return '';
      const ps = S.passeios.filter((p) => p.dia === c.dia);
      if (!ps.length) return '';
      const dif = Math.round((deIso(c.dia) - h) / 864e5);
      const rotulo = dif === 0 ? 'Hoje' : dif === 1 ? 'Amanhã' : DIAS_LONGOS[deIso(c.dia).getDay()];
      const itens = ps.map((p) => {
        const l = lancha(p.lancha_id) || { nome: 'Lancha' }, cl = lead(p.lead_id);
        const n = primeiroNome(cl && cl.nome), digitos = String((cl && cl.wa_id) || '').replace(/\D/g, '');
        const motivo = ruim.vento && ruim.chuva ? 'vento forte e chuva' : ruim.vento ? 'vento forte' : 'chuva';
        const txt = cl && cl.idioma === 'es'
          ? `¡Hola${n ? ', ' + n : ''}! Te escribimos de Barra Boat Floripa. El pronóstico para el ${ddIso(c.dia)} indica ${ruim.vento && ruim.chuva ? 'viento fuerte y lluvia' : ruim.vento ? 'viento fuerte' : 'lluvia'} en la Barra da Lagoa. Lo estamos siguiendo de cerca: si se confirma, cambiamos la fecha sin costo. ¿Qué otro día les vendría bien?`
          : `Olá${n ? ', ' + n : ''}! Aqui é da Barra Boat Floripa. A previsão para ${ddIso(c.dia)} indica ${motivo} na Barra da Lagoa. Estamos acompanhando: se o tempo se confirmar, remarcamos o passeio sem custo. Qual outra data fica boa para vocês?`;
        return `<li><span><b>${esc(l.nome)}</b>${p.hora_saida ? ', ' + hora(p.hora_saida) : ''}${cl ? ` · ${esc(cl.nome || 'Sem nome')}` : ''}</span>
          ${digitos ? `<a class="botao botao--leve botao--pequeno" href="https://wa.me/${digitos}?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener"><svg><use href="#p-wa"/></svg>Avisar pelo WhatsApp</a>` : ''}</li>`;
      }).join('');
      return `<div class="alerta bloco" role="note"><svg><use href="#p-vento"/></svg><div>
        <b>${rotulo}, ${ddIso(c.dia)}: ${esc(ruim.texto)}.</b>
        <p>${ps.length === 1 ? 'Tem 1 passeio marcado' : `Tem ${ps.length} passeios marcados`} nesse dia. Vale avisar ${ps.length === 1 ? 'o cliente' : 'os clientes'} e oferecer outra data.${c.fonte === 'demo' ? ' <i>(previsão de exemplo)</i>' : ''}</p>
        <ul class="alerta__lista">${itens}</ul>
      </div></div>`;
    }).join('');
  }

  // Previsão do Windguru (spot "Barra Boat Floripa", o que a Michele já acompanha).
  // Widget oficial: o script põe um iframe logo depois do elemento com o id `uid`.
  // A tela é redesenhada inteira, então o widget é montado de novo a cada vez.
  const WINDGURU = 1083158;
  function montaWindguru() {
    const lugar = tela.querySelector('[data-windguru]');
    if (!lugar) return;
    const uid = `wg_fwdg_${WINDGURU}_100_${Date.now()}`;
    lugar.id = uid;
    const s = document.createElement('script');
    s.src = 'https://www.windguru.cz/js/widget.php?' + [`s=${WINDGURU}`, 'm=100', `uid=${uid}`, 'wj=kmh', 'tj=c', 'waj=m', 'tij=cm',
      'odh=6', 'doh=20', 'fhours=96', 'hrsm=2', 'vt=forecasts', 'lng=pt', 'idbs=1',
      'p=WINDSPD,GUST,SMER,HTSGW,PERPW,TMPE,CDC,APCP1s,RATING'].join('&');
    s.async = true;
    s.onload = s.onerror = () => s.remove();
    document.head.appendChild(s);
  }

  function telaHoje() {
    const h = hoje(), hs = iso(h), em7 = iso(somaDias(h, 7));
    const ps = S.passeios.filter((p) => p.dia === hs).sort((a, b) => (a.hora_saida || '99').localeCompare(b.hora_saida || '99'));
    const novos = S.leads.filter((l) => l.etapa === 'novos').sort((a, b) => a.created_at.localeCompare(b.created_at));
    const prox = S.passeios.filter((p) => p.dia >= hs && p.dia <= em7 && p.lead_id);
    const fut = S.passeios.filter((p) => p.dia >= hs && p.lead_id);
    const aReceber = prox.reduce((s, p) => { const l = lead(p.lead_id); return s + (l ? falta(l) : 0); }, 0);
    const garantido = fut.reduce((s, p) => { const l = lead(p.lead_id); return s + (l ? Number(l.valor_fechado) : 0); }, 0);
    const mes = iso(h).slice(0, 7);
    const despMes = S.despesas.filter((d) => d.dia.startsWith(mes));
    const hr = new Date().getHours();
    const saudacao = (hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite') + (S.nome ? ', ' + primeiroNome(S.nome) : '');

    const cartoes = ps.map((p) => {
      const l = lancha(p.lancha_id) || { nome: 'Lancha' };
      const c = lead(p.lead_id), r = roteiro(p.roteiro_id), m = marinheiro(p.marinheiro_id);
      const f = c ? falta(c) : 0;
      return `<li class="cartao passeio">
        <div class="passeio__topo">
          <div><div class="passeio__hora">${p.hora_saida ? hora(p.hora_saida) : 'Sem hora'}</div>
          <div class="passeio__lancha"><i class="bolinha" style="background:${corLancha(l)}"></i>${esc(l.nome)}</div></div>
          ${c && Number(c.valor_fechado) > 0 && f === 0 ? '<span class="selo selo--bom"><svg><use href="#p-ok"/></svg>Tudo pago</span>' : ''}
        </div>
        <dl class="dados">
          <div><dt>Cliente</dt><dd>${esc(c ? c.nome || 'Sem nome' : 'Sem cliente')}</dd></div>
          <div><dt>Pessoas</dt><dd>${p.pessoas || (c && c.pessoas) || 'a confirmar'}</dd></div>
          <div><dt>Roteiro</dt><dd>${esc(nomeRoteiro(p))}</dd></div>
          <div><dt>Marinheiro</dt><dd>${esc(m ? m.nome : 'a definir')}</dd></div>
          <div><dt>Embarque</dt><dd>${linkEmbarque(p)}</dd></div>
          ${f > 0 ? `<div><dt>Falta receber</dt><dd>${R(f)}</dd></div>` : ''}
        </dl>
        <div class="acoes">${c ? `<button class="botao botao--leve botao--pequeno" type="button" data-cliente="${c.id}">Abrir</button>` : ''}
        ${f > 0 ? `<button class="botao botao--leve botao--pequeno" type="button" data-receber="${c.id}">Recebi o restante</button>` : ''}
        ${c && c.wa_id ? `<a class="botao botao--leve botao--pequeno" href="${linkWa(c.wa_id, textoPasseio(p, 'cliente'))}" target="_blank" rel="noopener"><svg><use href="#p-wa"/></svg>Mandar ao cliente</a>` : ''}
        ${m ? `<a class="botao botao--leve botao--pequeno" href="${linkWa(m.telefone, textoPasseio(p, 'marinheiro'))}" target="_blank" rel="noopener"><svg><use href="#p-wa"/></svg>Mandar ao marinheiro</a>` : ''}</div>
      </li>`;
    }).join('') || vazio('Nenhum passeio marcado para hoje.');

    // Próximos 3 dias: para ver de longe o que vem (e o tempo, com o alerta de clima acima).
    const proxDias = S.passeios.filter((p) => p.dia > hs && p.dia <= iso(somaDias(h, 3)))
      .sort((a, b) => (a.dia + (a.hora_saida || '99')).localeCompare(b.dia + (b.hora_saida || '99')));
    const proximos = proxDias.map((p) => {
      const l = lancha(p.lancha_id) || { nome: 'Lancha' }, c = lead(p.lead_id);
      const dif = Math.round((deIso(p.dia) - h) / 864e5);
      const rot = dif === 1 ? 'Amanhã' : DIAS_LONGOS[deIso(p.dia).getDay()];
      return `<li><button class="linha" type="button" data-dia="${p.lancha_id}|${p.dia}">
        <span class="linha__icone"><i class="bolinha" style="background:${corLancha(l)}"></i></span>
        <span class="linha__corpo"><b>${rot}, ${ddIso(p.dia)}${p.hora_saida ? ' às ' + hora(p.hora_saida) : ''}${seloExemplo(p)}</b><span>${esc([l.nome, c ? c.nome || 'Sem nome' : '', (p.pessoas || (c && c.pessoas)) ? (p.pessoas || c.pessoas) + ' pessoas' : ''].filter(Boolean).join(' · '))}</span></span>
        <svg><use href="#p-seta"/></svg></button></li>`;
    }).join('') || vazio('Nenhum passeio nos próximos 3 dias.');

    const espera = novos.map((c) => `<li><button class="linha" type="button" data-cliente="${c.id}">
        <span class="avatar">${esc((c.nome || '?')[0].toUpperCase())}</span>
        <span class="linha__corpo"><b>${esc(c.nome || foneTela(c.wa_id) || 'Sem nome')}${seloExemplo(c)}</b><span>${esc(c.mensagem || 'Sem mensagem')}</span></span>
        <span class="selo selo--alerta"><svg><use href="#p-relogio"/></svg>${esc(quando(c.created_at))}</span>
      </button></li>`).join('') || vazio('Ninguém esperando resposta agora.');

    tela.innerHTML = `
      <header class="cab"><div><h1>${esc(saudacao)}</h1><p>${DIAS_LONGOS[h.getDay()]}, ${diaLongo(h)}</p></div>
        <div class="acoes">${dona() ? '<button class="botao botao--principal" type="button" data-despesa><svg><use href="#p-mais-um"/></svg>Anotar despesa</button>' : ''}</div></header>

      ${alertasClima(h)}

      <section class="bloco"><h2>Previsão do Windguru <small>próximos 4 dias, vento em km/h</small></h2>
        <div class="cartao windguru"><div data-windguru></div>
          <a class="windguru__link" href="https://www.windguru.cz/${WINDGURU}" target="_blank" rel="noopener">Abrir no Windguru</a></div></section>

      <section class="bloco"><h2>Passeios de hoje <small>${ps.length} ${ps.length === 1 ? 'passeio' : 'passeios'}</small></h2><ul class="lista">${cartoes}</ul></section>

      <section class="bloco"><h2>Próximos dias <small>${proxDias.length} ${proxDias.length === 1 ? 'passeio' : 'passeios'}</small></h2><ul class="lista">${proximos}</ul></section>

      <section class="bloco"><h2>Esperando sua resposta <small>${novos.length} ${novos.length === 1 ? 'pessoa' : 'pessoas'}</small></h2><ul class="lista">${espera}</ul></section>

      <section class="bloco"><h2>Valores dos próximos dias</h2>
        <div class="numeros">
          <div class="numero"><span>Para receber em 7 dias</span><b>${R(aReceber)}</b><small>${prox.length} ${prox.length === 1 ? 'passeio marcado' : 'passeios marcados'}</small></div>
          <div class="numero"><span>Já garantido daqui para frente</span><b>${R(garantido)}</b><small>${fut.length} ${fut.length === 1 ? 'passeio' : 'passeios'} na agenda</small></div>
          ${dona() ? `<div class="numero"><span>Despesas este mês</span><b>${R(despMes.reduce((s, d) => s + Number(d.valor), 0))}</b><small>${despMes.length} ${despMes.length === 1 ? 'anotação' : 'anotações'}</small></div>` : ''}
        </div>
      </section>`;
    montaWindguru();
  }

  /* ================= AGENDA ================= */
  let agIni = 0; // deslocamento em dias a partir de hoje

  function estadoDia(l, s) {
    const p = S.passeios.find((x) => x.lancha_id === l.id && x.dia === s);
    if (p) return { t: 'passeio', p };
    const noDia = (x) => s >= x.inicio && s <= x.fim && (!x.lancha_id || x.lancha_id === l.id);
    const man = S.bloqueios.find((x) => x.tipo === 'manutencao' && noDia(x));
    if (man) return { t: 'manut', b: man };
    const fec = S.bloqueios.find((x) => x.tipo === 'fechado' && noDia(x));
    if (fec) return { t: 'fechado', b: fec };
    const d = S.dono.find((x) => x.lancha_id === l.id && x.dia === s);
    if (d) return { t: 'dono', d };
    return null;
  }

  function telaAgenda() {
    const base = somaDias(hoje(), agIni);
    const dias = Array.from({ length: 14 }, (_, i) => somaDias(base, i));
    const hs = iso(hoje());
    // o mês em cada coluna: a grade de 14 dias quase sempre atravessa a virada do mês
    const cab = dias.map((d) => `<th scope="col" class="${iso(d) === hs ? 'is-hoje' : ''} ${d.getDay() % 6 === 0 ? 'is-fds' : ''} ${d.getDate() === 1 ? 'is-mes' : ''}">${DIAS[d.getDay()]}<b>${d.getDate()}</b><small>${MESES[d.getMonth()]}</small></th>`).join('');
    const linhas = lanchasAtivas().map((l) => {
      const cel = dias.map((d) => {
        const s = iso(d), e = estadoDia(l, s);
        const q = `${esc(l.nome)}, ${DIAS[d.getDay()]} ${dd(d)}`;
        const bt = (cls, txt, rot) => `<td><button class="dia dia--${cls}" type="button" data-dia="${l.id}|${s}" aria-label="${q}, ${rot}"><span>${txt}</span></button></td>`;
        if (!e) return bt('livre', 'livre', 'livre');
        if (e.t === 'passeio') { const c = lead(e.p.lead_id); const n = c ? primeiroNome(c.nome) || 'Reservada' : 'Reservada'; return bt('reservada', esc(n), 'reservada para ' + esc(n)); }
        if (e.t === 'manut') return bt('bloqueio', 'manut.', 'manutenção');
        if (e.t === 'fechado') return bt('fechado', 'fech.', 'agenda fechada');
        return bt('dono', 'dono', 'ocupada na agenda do dono');
      }).join('');
      return `<tr><th scope="row"><i class="bolinha" style="background:${corLancha(l)}"></i> ${esc(l.nome)}<small>${l.passageiros} pessoas · ${esc(donoNome(l))}</small></th>${cel}</tr>`;
    }).join('');
    const periodos = S.bloqueios.filter((b) => b.tipo === 'fechado' && b.fim >= hs);
    tela.innerHTML = `
      <header class="cab"><div><h1>Agenda</h1><p>De ${dd(dias[0])} a ${dd(dias[13])}, lancha por lancha. Toque num dia para ver ou marcar.</p></div>
        <button class="botao botao--principal" type="button" data-fechar-periodo><svg aria-hidden="true"><use href="#p-agenda"/></svg>Fechar a agenda por um período</button></header>
      ${periodos.length ? `<section class="cartao periodos"><h2>Dias em que a agenda está fechada</h2>
        <ul>${periodos.map((p) => `<li><span><b>${faixa(p.inicio, p.fim)}</b><small>${esc(p.motivo || 'Sem motivo')}, ${p.lancha_id ? esc((lancha(p.lancha_id) || {}).nome || 'uma lancha') : 'todas as lanchas'}</small></span>
          <button class="botao botao--leve botao--pequeno" type="button" data-reabrir="${p.id}">Reabrir</button></li>`).join('')}</ul></section>` : ''}
      <div class="ag-nav">
        <button class="botao botao--leve botao--pequeno" type="button" data-ag="-14"${agIni <= -56 ? ' disabled' : ''}><svg><use href="#p-volta"/></svg>Antes</button>
        ${agIni !== 0 ? '<button class="botao botao--leve botao--pequeno" type="button" data-ag="0">Voltar para hoje</button>' : ''}
        <button class="botao botao--leve botao--pequeno" type="button" data-ag="14">Depois<svg><use href="#p-seta"/></svg></button>
      </div>
      <ul class="agenda-legenda">
        <li><i class="amostra amostra--reservada"></i>Reservada por você</li>
        <li><i class="amostra amostra--dono"></i>Ocupada na agenda do dono</li>
        <li><i class="amostra amostra--bloqueio"></i>Manutenção</li>
        <li><i class="amostra amostra--fechado"></i>Agenda fechada</li>
        <li><i class="amostra amostra--livre"></i>Livre</li>
      </ul>
      ${linhas ? `<div class="agenda-grade"><table><thead><tr><th scope="col" class="sr">Lancha</th>${cab}</tr></thead><tbody>${linhas}</tbody></table></div>`
        : '<p class="cartao vazio">Nenhuma lancha aparecendo no site. Ative uma em Mais, Lanchas.</p>'}
      <p class="ajuda" style="margin-top:14px">O que está aqui aparece no calendário do site como livre ou ocupado. O cliente nunca vê nomes nem valores.</p>`;
    tela.querySelector('[data-fechar-periodo]').addEventListener('click', () => fecharPeriodo());
    tela.querySelectorAll('[data-reabrir]').forEach((b) => b.addEventListener('click', () => reabrir(b.dataset.reabrir)));
  }

  async function reabrir(id) {
    const p = S.bloqueios.find((x) => x.id === id);
    if (!(await grava(sb.from('bb_bloqueios').delete().eq('id', id)))) return;
    fechaGaveta(); await atualiza();
    avisa(p && p.tipo === 'fechado' ? `Agenda reaberta: ${faixa(p.inicio, p.fim).toLowerCase()}.` : 'Dia liberado.');
  }

  function fecharPeriodo(diaInicial) {
    const hs = iso(hoje());
    abreGaveta('Fechar a agenda por um período', `
      <p class="ajuda" style="margin-top:0">Para férias, feriado ou quando a empresa não vai atender. Nesses dias o site mostra tudo ocupado e nenhum passeio novo entra.</p>
      <div class="periodo-datas">
        <label class="campo"><span>Do dia</span><input type="date" data-ini min="${hs}"></label>
        <label class="campo"><span>Até o dia</span><input type="date" data-fim min="${hs}"></label>
      </div>
      <div class="campo"><span>Por quê?</span><div class="chips">${MOTIVOS_FECHAR.map((m, n) => `<button class="chip" type="button" aria-pressed="${n === 0}" data-motivo="${esc(m)}">${esc(m)}</button>`).join('')}</div>
        <small>Só a equipe vê o motivo.</small></div>
      <label class="campo"><span>Quais lanchas?</span><select data-qual><option value="">Todas as lanchas</option>${lanchasAtivas().map((l) => `<option value="${l.id}">Só a ${esc(l.nome)}</option>`).join('')}</select></label>
      <div class="estado estado--sem" data-resumo hidden></div>
      <div class="alerta" data-conflito hidden><span><b>Já tem passeio marcado nesses dias</b><p data-conflito-txt></p></span></div>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Fechar a agenda</button>`, (c) => {
      const ini = c.querySelector('[data-ini]'), fim = c.querySelector('[data-fim]'), qual = c.querySelector('[data-qual]');
      let motivo = MOTIVOS_FECHAR[0];
      chips(c, '[data-motivo]', (b) => { motivo = b.dataset.motivo; });
      const conflitos = () => S.passeios
        .filter((p) => p.dia >= ini.value && p.dia <= fim.value && (!qual.value || p.lancha_id === qual.value))
        .map((p) => { const c2 = lead(p.lead_id); return `${c2 ? c2.nome : 'Passeio'} (${(lancha(p.lancha_id) || {}).nome || 'lancha'}, ${ddIso(p.dia)})`; });
      const atualizaResumo = () => {
        if (ini.value) fim.min = ini.value;
        if (ini.value && (!fim.value || fim.value < ini.value)) fim.value = ini.value;
        const res = c.querySelector('[data-resumo]'), conf = c.querySelector('[data-conflito]');
        if (!ini.value || !fim.value) { res.hidden = true; conf.hidden = true; return; }
        const n = Math.round((deIso(fim.value) - deIso(ini.value)) / 864e5) + 1;
        const quais = qual.value ? `na ${lancha(qual.value).nome}` : 'em todas as lanchas';
        res.textContent = `${faixa(ini.value, fim.value)}: ${n} ${n === 1 ? 'dia fechado' : 'dias fechados'} ${quais}.`;
        res.hidden = false;
        const cs = conflitos();
        conf.hidden = !cs.length;
        if (cs.length) c.querySelector('[data-conflito-txt]').textContent = `${cs.join('; ')}. ${cs.length === 1 ? 'Esse passeio continua marcado' : 'Esses passeios continuam marcados'}. Se for preciso, fale com o cliente pelo WhatsApp.`;
      };
      [ini, fim, qual].forEach((x) => x.addEventListener('change', atualizaResumo));
      if (diaInicial) { ini.value = diaInicial; atualizaResumo(); }
      aoSalvar(c.querySelector('[data-salvar]'), async () => {
        if (!ini.value || !fim.value) return erroCampo(c, 'Escolha o primeiro e o último dia.');
        if (fim.value < ini.value) return erroCampo(c, 'O último dia precisa ser depois do primeiro.');
        erroCampo(c, '');
        const ok = await grava(sb.from('bb_bloqueios').insert({ tipo: 'fechado', inicio: ini.value, fim: fim.value, motivo, lancha_id: qual.value || null }));
        if (!ok) return;
        fechaGaveta(); await atualiza(); avisa(`Agenda fechada: ${faixa(ini.value, fim.value).toLowerCase()}.`);
      });
    });
  }

  function abreDia(id, s) {
    const l = lancha(id); if (!l) return;
    const d = deIso(s);
    const titulo = `${l.nome}, ${DIAS[d.getDay()]} ${dd(d)}`;
    const e = estadoDia(l, s);
    if (!e) {
      const temDono = !!l.parceiro_id;
      abreGaveta(titulo, `
        <div class="estado estado--sem">Este dia está livre.</div>
        <div class="escolhas">
          <button class="escolha" type="button" data-acao="marcar"><span class="linha__icone"><svg><use href="#p-agenda"/></svg></span><span><b>Marcar um passeio</b><span>Escolha o cliente e o dia fica reservado.</span></span></button>
          ${temDono ? '<button class="escolha" type="button" data-acao="dono"><span class="linha__icone"><svg><use href="#p-clientes"/></svg></span><span><b>O dono vai usar a lancha</b><span>Quando ele avisa pelo WhatsApp. O site mostra o dia como ocupado.</span></span></button>' : ''}
          <button class="escolha" type="button" data-acao="bloquear"><span class="linha__icone"><svg><use href="#p-lancha"/></svg></span><span><b>Bloquear para manutenção</b><span>O site mostra o dia como ocupado.</span></span></button>
          <button class="escolha" type="button" data-acao="periodo"><span class="linha__icone"><svg><use href="#p-relogio"/></svg></span><span><b>Fechar a agenda de vários dias</b><span>Férias, feriado ou empresa fechada.</span></span></button>
        </div>`, (c) => {
        c.querySelector('[data-acao="marcar"]').addEventListener('click', () => marcarPasseio({ lancha_id: id, dia: s }));
        c.querySelector('[data-acao="periodo"]').addEventListener('click', () => fecharPeriodo(s));
        aoSalvar(c.querySelector('[data-acao="bloquear"]'), async () => {
          if (!(await grava(sb.from('bb_bloqueios').insert({ tipo: 'manutencao', lancha_id: id, inicio: s, fim: s, motivo: 'Manutenção' })))) return;
          fechaGaveta(); await atualiza(); avisa('Dia bloqueado para manutenção.');
        });
        const bDono = c.querySelector('[data-acao="dono"]');
        if (bDono) aoSalvar(bDono, async () => {
          if (!(await grava(sb.from('bb_agenda_dono').insert({ lancha_id: id, dia: s, origem: 'manual' })))) return;
          fechaGaveta(); await atualiza(); avisa('Dia marcado como do dono.');
        });
      });
      return;
    }
    if (e.t === 'passeio') {
      const p = e.p, c = lead(p.lead_id), m = marinheiro(p.marinheiro_id);
      abreGaveta(titulo, `<div class="cartao"><dl class="dados" style="display:grid;gap:8px">
          <div><dt>Cliente:</dt><dd>${esc(c ? c.nome || 'Sem nome' : 'Sem cliente')}</dd></div>
          <div><dt>Embarque:</dt><dd>${p.hora_saida ? hora(p.hora_saida) : 'hora a combinar'}, ${linkEmbarque(p)}</dd></div>
          <div><dt>Pessoas:</dt><dd>${p.pessoas || 'a confirmar'}</dd></div>
          <div><dt>Roteiro:</dt><dd>${esc(nomeRoteiro(p))}</dd></div>
          ${p.personalizado && p.pedido ? `<div><dt>Pedido:</dt><dd>${esc(p.pedido)}</dd></div>` : ''}
          ${p.deslocamento ? `<div><dt>Deslocamento:</dt><dd>${Number(p.deslocamento_valor) ? R(p.deslocamento_valor) + ', cobrado do cliente' : 'sim, valor não anotado'}</dd></div>` : ''}
          <div><dt>Marinheiro:</dt><dd>${esc(m ? m.nome : 'a definir')}</dd></div>
        </dl>${exemplo(p) ? '<p class="selo selo--neutro" style="white-space:normal;margin:10px 0 0">Passeio de exemplo: será apagado antes do lançamento.</p>' : ''}</div>
        ${botoesEnvio(p) ? `<div class="acoes" style="margin-top:16px">${botoesEnvio(p)}</div>` : ''}
        <div class="acoes" style="margin-top:12px">
          ${c ? `<button class="botao botao--principal" type="button" data-abrir-c="${c.id}">Abrir o cliente</button>` : ''}
          <button class="botao botao--leve" type="button" data-editar>Mudar data, hora, embarque ou marinheiro</button>
          <button class="botao botao--perigo-leve" type="button" data-cancelar>Cancelar este passeio</button>
        </div>`, (g) => {
        const ab = g.querySelector('[data-abrir-c]'); if (ab) ab.addEventListener('click', () => abreCliente(ab.dataset.abrirC));
        g.querySelector('[data-editar]').addEventListener('click', () => editarPasseio(p));
        confirmaNoBotao(g.querySelector('[data-cancelar]'), 'Toque de novo para cancelar', async () => {
          if (!(await grava(sb.from('bb_passeios').update({ status: 'cancelado' }).eq('id', p.id)))) return;
          fechaGaveta(); await atualiza(); avisa('Passeio cancelado. O dia ficou livre.');
        });
      });
      return;
    }
    if (e.t === 'manut' || e.t === 'fechado') {
      const b = e.b;
      const txt = e.t === 'manut' ? `Bloqueada para manutenção${b.inicio !== b.fim ? ': ' + faixa(b.inicio, b.fim).toLowerCase() : ''}.`
        : `Agenda fechada. ${faixa(b.inicio, b.fim)}, ${esc((b.motivo || '').toLowerCase())}, ${b.lancha_id ? 'só nesta lancha' : 'todas as lanchas'}.`;
      abreGaveta(titulo, `<div class="estado estado--sem">${esc(txt)}</div>
        <button class="botao botao--leve botao--cheio" type="button" data-liberar>${e.t === 'manut' ? (b.inicio === b.fim ? 'Liberar o dia' : 'Liberar todo o período') : 'Reabrir este período'}</button>`,
      (g) => aoSalvar(g.querySelector('[data-liberar]'), () => reabrir(b.id)));
      return;
    }
    // dia do dono
    const manual = e.d.origem === 'manual';
    abreGaveta(titulo, `<div class="estado">${manual ? 'O dono vai usar a lancha neste dia (anotado pela equipe).' : 'Ocupada na agenda do dono. Esse dia vem sozinho da agenda dele.'}</div>
      ${manual ? '<button class="botao botao--leve botao--cheio" type="button" data-liberar>Liberar o dia</button>' : ''}`, (g) => {
      const b = g.querySelector('[data-liberar]');
      if (b) aoSalvar(b, async () => {
        if (!(await grava(sb.from('bb_agenda_dono').delete().eq('lancha_id', id).eq('dia', s).eq('origem', 'manual')))) return;
        fechaGaveta(); await atualiza(); avisa('Dia liberado.');
      });
    });
  }

  /* Campos do passeio que valem para marcar e para mudar: roteiro (ou personalizado), embarque,
     deslocamento. O embarque e o marinheiro vêm da lancha como sugestão e podem mudar na hora. */
  function camposPasseio(v) {
    const pers = !!v.personalizado;
    return `
      <div class="grade-2" style="align-items:start">
        <label class="campo"><span>Roteiro</span><select data-roteiro>${opcoes(S.roteiros.filter((x) => x.ativo !== false || x.id === v.roteiro_id), pers ? null : v.roteiro_id, (x) => x.nome, 'A combinar')}<option value="personalizado"${pers ? ' selected' : ''}>Personalizado</option></select></label>
        <label class="campo"><span>Marinheiro</span><select data-marinheiro>${opcoes(S.marinheiros.filter((x) => x.ativo || x.id === v.marinheiro_id), v.marinheiro_id, (x) => x.nome, 'A definir')}</select>
          <small class="caixas__ajuda" data-marinheiro-nota hidden></small></label>
      </div>
      <div data-bloco-pers${pers ? '' : ' hidden'}>
        <label class="campo"><span>O que o cliente quer no passeio</span><textarea data-pedido rows="3" placeholder="Ex.: sair do píer de casa, parar na Praia Mole, voltar ao pôr do sol">${esc(v.pedido || '')}</textarea></label>
        <label class="campo"><span>A lancha vai buscar o grupo em outro lugar?</span><select data-desloc>
          <option value="0"${v.deslocamento ? '' : ' selected'}>Não, embarcam no lugar de sempre</option>
          <option value="1"${v.deslocamento ? ' selected' : ''}>Sim, tem deslocamento</option></select></label>
        <label class="campo" data-bloco-valor${v.deslocamento ? '' : ' hidden'}><span>Valor do deslocamento <small style="font-weight:400;color:var(--suave)">(cobrado do cliente, à parte do passeio)</small></span><input data-desloc-valor inputmode="decimal" value="${v.deslocamento_valor != null ? String(v.deslocamento_valor).replace('.', ',') : ''}" placeholder="R$"></label>
      </div>
      ${listaEmbarque(v.embarque_local || '')}
      <div class="grade-2">
        <label class="campo"><span data-rotulo-local>${v.deslocamento ? 'Onde buscar o grupo' : 'Endereço do embarque'}</span><input data-emb-local value="${esc(v.embarque_local || '')}"></label>
        <label class="campo"><span>Link do Google Maps <small style="font-weight:400;color:var(--suave)">(opcional)</small></span><input data-emb-maps type="url" value="${esc(v.embarque_maps || '')}" placeholder="https://maps.app.goo.gl/..."></label>
      </div>`;
  }
  /* Marinheiro que já tem passeio no dia fica cinza e não dá para escolher (o nome da lancha
     aparece ao lado). Se o escolhido ficou ocupado (mudou o dia), volta para "A definir". */
  function marinheirosDoDia(c, dia, passeioId) {
    const sel = c.querySelector('[data-marinheiro]'), nota = c.querySelector('[data-marinheiro-nota]');
    let tirou = '';
    [...sel.options].forEach((o) => {
      if (!o.value) return;
      const m = marinheiro(o.value);
      const ocup = dia ? S.passeios.find((x) => x.dia === dia && x.marinheiro_id === o.value && x.id !== passeioId && x.status !== 'cancelado') : null;
      o.disabled = !!ocup;
      o.textContent = m.nome + (ocup ? ` (ocupado: ${(lancha(ocup.lancha_id) || {}).nome || 'outro passeio'})` : '');
      if (ocup && o.selected) { tirou = m.nome; sel.value = ''; }
    });
    const livres = [...sel.options].filter((o) => o.value && !o.disabled).length;
    nota.hidden = !(tirou || dia);
    nota.textContent = tirou ? `${tirou} já tem passeio neste dia. Escolha outro marinheiro.`
      : !dia ? '' : livres ? `${livres === 1 ? '1 marinheiro livre' : livres + ' marinheiros livres'} neste dia.` : 'Nenhum marinheiro livre neste dia.';
  }
  // Liga o mostra/esconde dos campos do personalizado e do deslocamento.
  function ligaCamposPasseio(c, passeioId) {
    const f = (k) => c.querySelector(`[data-${k}]`);
    ligaListaEmbarque(c, f('emb-local'), f('emb-maps'));
    const diaEl = f('dia');
    if (diaEl) { const pinta = () => marinheirosDoDia(c, diaEl.value, passeioId); diaEl.addEventListener('change', pinta); pinta(); }
    const mostra = () => {
      f('bloco-pers').hidden = f('roteiro').value !== 'personalizado';
      const d = !f('bloco-pers').hidden && f('desloc').value === '1';
      f('bloco-valor').hidden = !d;
      f('rotulo-local').textContent = d ? 'Onde buscar o grupo' : 'Endereço do embarque';
    };
    f('roteiro').addEventListener('change', mostra);
    f('desloc').addEventListener('change', () => {
      // passou a ter deslocamento: o local sugerido da lancha não serve mais
      if (f('desloc').value === '1' && f('emb-local').dataset.sugerido === '1') { f('emb-local').value = ''; f('emb-maps').value = ''; f('emb-local').dataset.sugerido = ''; f('emb-local').dispatchEvent(new Event('preenchido')); }
      mostra();
    });
    ['emb-local', 'emb-maps'].forEach((k) => f(k).addEventListener('input', () => { f('emb-local').dataset.sugerido = ''; }));
    f('emb-local').addEventListener('lista', () => { f('emb-local').dataset.sugerido = ''; });
    mostra();
  }
  // Lê os campos acima. null + mensagem se faltar algo.
  function lePasseio(c) {
    const f = (k) => c.querySelector(`[data-${k}]`);
    const pers = f('roteiro').value === 'personalizado';
    const desl = pers && f('desloc').value === '1';
    const maps = f('emb-maps').value.trim();
    if (maps && !/^https?:\/\//.test(maps)) return [null, 'O link do mapa precisa começar com https://. Copie o link pelo botão "Compartilhar" do Google Maps.'];
    if (desl && !f('emb-local').value.trim()) return [null, 'Escreva onde a lancha vai buscar o grupo.'];
    return [{
      roteiro_id: pers ? null : f('roteiro').value || null,
      personalizado: pers,
      pedido: pers ? f('pedido').value.trim() || null : null,
      deslocamento: desl,
      deslocamento_valor: desl && f('desloc-valor').value.trim() ? num(f('desloc-valor').value) : null,
      marinheiro_id: f('marinheiro').value || null,
      embarque_local: f('emb-local').value.trim() || null,
      embarque_maps: maps || null,
    }, null];
  }

  /* Marca um passeio. Vem da Agenda (lancha e dia escolhidos) ou do cliente (lead escolhido).
     Quem reservou: um cliente nosso (busca pelo nome ou cadastra na hora) ou um parceiro que
     vendeu para um cliente dele (o contato do cliente fica com o parceiro; aqui vai só o nome). */
  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function marcarPasseio(pre) {
    const l0 = pre.lead_id ? lead(pre.lead_id) : null;
    const candidatos = S.leads.filter((x) => x.etapa !== 'perdidos' && (!passeioDoLead(x.id) || x.id === pre.lead_id))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const rotLead = (x) => [x.nome || foneTela(x.wa_id) || 'Sem nome', x.pessoas ? x.pessoas + ' pessoas' : '', x.data_desejada ? ddIso(x.data_desejada) : ''].filter(Boolean).join(' · ');
    const lIni = lancha(pre.lancha_id || (l0 && l0.lancha_id)) || {};
    const vendedores = S.parceiros.filter((x) => x.ativo !== false);
    abreGaveta('Marcar passeio', `
      <div class="chips" role="group" aria-label="Quem reservou" style="margin-bottom:14px">
        <button class="chip" type="button" data-quem="cliente" aria-pressed="true">Cliente nosso</button>
        <button class="chip" type="button" data-quem="parceiro" aria-pressed="false">Cliente de parceiro</button>
      </div>
      <div data-bloco-cliente>
        <input type="hidden" data-lead value="${l0 ? l0.id : ''}">
        <div class="busca-cliente" data-escolhido${l0 ? '' : ' hidden'}>
          <span data-escolhido-txt>${l0 ? esc(rotLead(l0)) : ''}</span>
          <button class="botao botao--leve botao--pequeno" type="button" data-trocar>Trocar</button>
        </div>
        <div data-busca-bloco${l0 ? ' hidden' : ''}>
          <label class="campo"><span>Cliente</span><input data-busca type="search" autocomplete="off" placeholder="Digite o nome ou o WhatsApp"></label>
          <ul class="busca-cliente__lista" data-achados hidden></ul>
          <div class="grade-2" data-novo>
            <label class="campo"><span>Nome do cliente novo</span><input data-nome autocomplete="off"></label>
            <label class="campo"><span>WhatsApp</span><input data-fone inputmode="tel" placeholder="(48) 99999-9999" autocomplete="off"></label>
          </div>
        </div>
      </div>
      <div data-bloco-parceiro hidden>
        <div class="grade-2">
          <label class="campo"><span>Parceiro que vendeu</span><select data-vendedor>${opcoes(vendedores, null, (x) => x.nome, 'Escolha o parceiro')}</select></label>
          <label class="campo"><span>Nome do cliente dele <small style="font-weight:400;color:var(--suave)">(opcional)</small></span><input data-nome-p autocomplete="off"></label>
        </div>
        <p class="ajuda">O contato do cliente fica com o parceiro. Depois de marcar, mande os dados do passeio ao parceiro pelo botão do WhatsApp.</p>
      </div>
      <div class="grade-2">
        <label class="campo"><span>Lancha</span><select data-lancha>${opcoes(lanchasAtivas(), lIni.id, (x) => `${x.nome} (até ${x.passageiros})`, 'Escolha a lancha')}</select></label>
        <label class="campo"><span>Dia</span><input type="date" data-dia value="${pre.dia || (l0 && l0.data_desejada) || ''}"></label>
      </div>
      <div class="grade-2">
        <label class="campo"><span>Pessoas</span><input data-pessoas inputmode="numeric" value="${(l0 && l0.pessoas) || ''}"></label>
        <label class="campo"><span>Horário de embarque</span><input type="time" data-hora value="${lIni.embarque_hora ? lIni.embarque_hora.slice(0, 5) : '09:00'}"></label>
      </div>
      ${camposPasseio({ roteiro_id: l0 && l0.roteiro_id, marinheiro_id: lIni.marinheiro_id, embarque_local: lIni.embarque_local || embPadrao().local, embarque_maps: lIni.embarque_local ? lIni.embarque_maps : embPadrao().maps })}
      <p class="ajuda">Horário, embarque e marinheiro vêm do cadastro da lancha. Mude aqui se este passeio for diferente.</p>
      <p class="selo selo--alerta" data-aviso hidden style="margin:0 0 12px;white-space:normal"></p>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Marcar o passeio</button>`, (c) => {
      const f = (k) => c.querySelector(`[data-${k}]`);
      let quem = 'cliente';
      f('emb-local').dataset.sugerido = '1';
      ligaCamposPasseio(c);
      const confere = () => {
        const l = lancha(f('lancha').value), n = Number(f('pessoas').value);
        const av = f('aviso');
        av.hidden = !(l && n > l.passageiros);
        if (!av.hidden) av.textContent = `A ${l.nome} leva até ${l.passageiros} pessoas.`;
      };
      chips(c, '[data-quem]', (b) => {
        quem = b.dataset.quem;
        f('bloco-cliente').hidden = quem !== 'cliente';
        f('bloco-parceiro').hidden = quem !== 'parceiro';
      });
      // busca do cliente: mostra até 8 nomes enquanto digita; sem escolher, vira cliente novo com o nome digitado
      const escolhe = (x) => {
        f('lead').value = x.id;
        f('escolhido-txt').textContent = rotLead(x);
        f('escolhido').hidden = false; f('busca-bloco').hidden = true;
        if (x.pessoas) f('pessoas').value = x.pessoas;
        if (x.roteiro_id) { f('roteiro').value = x.roteiro_id; f('roteiro').dispatchEvent(new Event('change')); }
        if (!f('dia').value && x.data_desejada) { f('dia').value = x.data_desejada; f('dia').dispatchEvent(new Event('change')); }
        confere();
      };
      f('trocar').addEventListener('click', () => {
        f('lead').value = ''; f('escolhido').hidden = true; f('busca-bloco').hidden = false; f('busca').value = ''; f('busca').focus();
      });
      f('busca').addEventListener('input', () => {
        const bruto = f('busca').value.trim(), q = semAcento(bruto), d = digitos(bruto);
        const ul = f('achados');
        if (d.length >= 4) { if (!f('fone').value) f('fone').value = bruto; } else f('nome').value = bruto;
        if (q.length < 2) { ul.hidden = true; return; }
        const achou = candidatos.filter((x) => semAcento(x.nome).includes(q) || (d.length >= 4 && digitos(x.wa_id).includes(d))).slice(0, 8);
        ul.innerHTML = achou.length ? achou.map((x) => `<li><button type="button" data-id="${x.id}">${esc(rotLead(x))}</button></li>`).join('')
          : '<li class="busca-cliente__nada">Nenhum cliente com esse nome. Preencha abaixo para cadastrar.</li>';
        ul.hidden = false;
        ul.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => { ul.hidden = true; escolhe(lead(b.dataset.id)); }));
      });
      // trocou a lancha: traz o horário, o marinheiro e o embarque de sempre dela (se ainda for a sugestão)
      f('lancha').addEventListener('change', () => {
        const l = lancha(f('lancha').value);
        if (l) {
          if (l.embarque_hora) f('hora').value = l.embarque_hora.slice(0, 5);
          const mo = l.marinheiro_id && [...f('marinheiro').options].find((o) => o.value === l.marinheiro_id);
          if (mo && !mo.disabled) f('marinheiro').value = l.marinheiro_id;
          if (f('emb-local').dataset.sugerido === '1') {
            f('emb-local').value = l.embarque_local || embPadrao().local;
            f('emb-maps').value = l.embarque_local ? l.embarque_maps || '' : embPadrao().maps;
            f('emb-local').dispatchEvent(new Event('preenchido'));
          }
        }
        confere();
      });
      f('pessoas').addEventListener('input', confere);
      confere();
      aoSalvar(f('salvar'), async () => {
        const lanchaId = f('lancha').value, dia = f('dia').value, pessoas = Number(f('pessoas').value) || null;
        if (quem === 'parceiro' && !f('vendedor').value) return erroCampo(c, 'Escolha o parceiro que vendeu o passeio.');
        if (quem === 'cliente' && !f('lead').value && !f('nome').value.trim()) return erroCampo(c, 'Escolha o cliente na busca ou escreva o nome do cliente novo.');
        if (!lanchaId || !dia) return erroCampo(c, 'Escolha a lancha e o dia.');
        const [extra, erro] = lePasseio(c);
        if (erro) return erroCampo(c, erro);
        erroCampo(c, '');
        let leadId = quem === 'cliente' ? f('lead').value : '', criado = false;
        if (!leadId) {
          const vend = parceiro(f('vendedor').value);
          const dados = quem === 'parceiro'
            ? { nome: f('nome-p').value.trim() || `Cliente de ${vend.nome}`, parceiro_id: vend.id, etapa: 'conversando', origem: 'parceiro', pessoas }
            : { nome: f('nome').value.trim(), wa_id: fone(f('fone').value), etapa: 'conversando', origem: 'direto' };
          const novo = await grava(sb.from('bb_leads').insert(dados).select('id').single());
          if (!novo) return;
          leadId = novo.id; criado = true;
        }
        const p = await grava(sb.from('bb_passeios').insert(Object.assign({ lancha_id: lanchaId, dia, hora_saida: f('hora').value || null, lead_id: leadId, pessoas }, extra)));
        if (!p) { if (criado) await sb.from('bb_leads').delete().eq('id', leadId); return; }
        const x = lead(leadId) || { etapa: 'conversando', valor_fechado: 0, valor_orcado: 0 };
        const muda = { lancha_id: lanchaId, data_desejada: dia, roteiro_id: extra.roteiro_id };
        if (pessoas) muda.pessoas = pessoas;
        if (x.etapa !== 'fechados') { muda.etapa = 'fechados'; if (!Number(x.valor_fechado) && Number(x.valor_orcado)) muda.valor_fechado = x.valor_orcado; }
        await grava(sb.from('bb_leads').update(muda).eq('id', leadId));
        fechaGaveta(); await atualiza();
        avisa(`Passeio marcado: ${lancha(lanchaId).nome}, ${ddIso(dia)}.`);
      });
    });
  }

  function editarPasseio(p) {
    const emb = embarqueDe(p);
    abreGaveta('Mudar o passeio', `
      <div class="grade-2">
        <label class="campo"><span>Dia</span><input type="date" data-dia value="${p.dia}"></label>
        <label class="campo"><span>Lancha</span><select data-lancha>${opcoes(S.lanchas.filter((x) => x.ativo || x.id === p.lancha_id), p.lancha_id, (x) => `${x.nome} (até ${x.passageiros})`)}</select></label>
      </div>
      <div class="grade-2">
        <label class="campo"><span>Horário de embarque</span><input type="time" data-hora value="${(p.hora_saida || '').slice(0, 5)}"></label>
        <label class="campo"><span>Pessoas</span><input data-pessoas inputmode="numeric" value="${p.pessoas || ''}"></label>
      </div>
      ${camposPasseio(Object.assign({}, p, { embarque_local: emb.local, embarque_maps: emb.maps }))}
      <p class="ajuda">Mudou o dia ou a lancha? O dia antigo fica livre no site e o novo fica ocupado. Mudou algo? Mande de novo ao cliente, ao marinheiro e ao parceiro.</p>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Salvar</button>`, (c) => {
      ligaCamposPasseio(c, p.id);
      aoSalvar(c.querySelector('[data-salvar]'), async () => {
        const dia = c.querySelector('[data-dia]').value, lanchaId = c.querySelector('[data-lancha]').value;
        if (!dia || !lanchaId) return erroCampo(c, 'Escolha o dia e a lancha.');
        const mudou = dia !== p.dia || lanchaId !== p.lancha_id;
        const outro = S.passeios.find((x) => x.id !== p.id && x.lancha_id === lanchaId && x.dia === dia);
        if (outro) return erroCampo(c, `A ${lancha(lanchaId).nome} já tem passeio em ${ddIso(dia)}.`);
        const [extra, erro] = lePasseio(c);
        if (erro) return erroCampo(c, erro);
        erroCampo(c, '');
        const ok = await grava(sb.from('bb_passeios').update(Object.assign({
          dia, lancha_id: lanchaId,
          hora_saida: c.querySelector('[data-hora]').value || null,
          pessoas: Number(c.querySelector('[data-pessoas]').value) || null,
        }, extra)).eq('id', p.id));
        if (!ok) return;
        // o pedido do cliente acompanha o passeio (data e lancha)
        if (p.lead_id && mudou) await grava(sb.from('bb_leads').update({ data_desejada: dia, lancha_id: lanchaId }).eq('id', p.lead_id));
        fechaGaveta(); await atualiza();
        avisa(mudou ? `Passeio mudado para ${lancha(lanchaId).nome}, ${ddIso(dia)}.` : 'Passeio atualizado.');
      });
    });
  }

  /* ================= CLIENTES (funil) ================= */
  let etapaAtual = 'novos', busca = '';
  const textoBusca = (l) => [l.nome, l.wa_id, foneTela(l.wa_id), l.email, l.mensagem].join(' ').toLowerCase();

  /* Uma pessoa pode ter vários pedidos ao longo dos anos (um por reserva). Junta pelo
     WhatsApp; sem WhatsApp, pelo e-mail; sem nenhum dos dois, o pedido fica sozinho. */
  let filtroTab = 'todos', ordemTab = 'ultimo', origemTab = '';
  const chavePessoa = (c) => { const d = digitos(c.wa_id); return d ? 'w' + d : c.email ? 'e' + c.email.trim().toLowerCase() : 'i' + c.id; };
  const diaDoPedido = (c) => { const p = passeioDoLead(c.id); return p ? p.dia : c.data_desejada; };
  function pessoas() {
    const grupos = new Map();
    S.leads.forEach((c) => { const k = chavePessoa(c); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(c); });
    const hj = iso(hoje());
    return [...grupos.entries()].map(([k, ls]) => {
      ls.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      const res = ls.filter((c) => c.etapa === 'fechados');
      const dias = res.map(diaDoPedido).filter(Boolean).sort();
      const prim = ls[ls.length - 1];
      const achar = (f) => (ls.find((c) => c[f]) || {})[f] || null;
      return {
        k, pedidos: ls, nome: achar('nome'), wa: achar('wa_id'), email: achar('email'),
        reservas: res.length, ultimo: dias.filter((d) => d < hj).pop() || null, proximo: dias.find((d) => d >= hj) || null,
        total: res.reduce((s, c) => s + (Number(c.valor_fechado) || 0), 0),
        origem: prim.origem_manual || prim.origem, primeiro: prim.created_at, contato: ls[0].created_at, exemplo: ls.some(exemplo),
      };
    });
  }
  const pessoaDe = (k) => pessoas().find((x) => x.k === k);

  // Funil de vendas: os pedidos por etapa, do primeiro oi até o passeio.
  function telaFunil() {
    const termo = busca.trim().toLowerCase();
    const conta = (id) => S.leads.filter((c) => c.etapa === id).length;
    const abas = ETAPAS.map((e) => `<button class="aba" type="button" role="tab" aria-selected="${!termo && e.id === etapaAtual}" data-etapa="${e.id}">${e.nome}<b>${conta(e.id)}</b></button>`).join('');
    const et = ETAPAS.find((e) => e.id === etapaAtual);
    tela.innerHTML = `
      <header class="cab"><div><h1>Funil de vendas</h1><p>Cada pedido que chegou, do primeiro oi até o passeio.</p></div>
        <button class="botao botao--principal" type="button" data-novo-cliente><svg><use href="#p-mais-um"/></svg>Cadastrar cliente</button></header>
      <label class="busca"><span class="sr">Procurar cliente</span><input type="search" placeholder="Procurar por nome ou telefone" value="${esc(busca)}" data-busca autocomplete="off"></label>
      <div class="abas" role="tablist" aria-label="Etapas">${abas}</div>
      <p class="ajuda" data-ajuda>${termo ? 'Resultado da procura em todas as etapas.' : esc(et.ajuda)}</p>
      <ul class="lista" data-lista></ul>`;
    const pinta = () => {
      const t = busca.trim().toLowerCase();
      let lista = t ? S.leads.filter((c) => textoBusca(c).includes(t)) : S.leads.filter((c) => c.etapa === etapaAtual);
      if (!t && etapaAtual === 'fechados') lista = lista.slice().sort((a, b) => (diaVenda(a) || '9').localeCompare(diaVenda(b) || '9'));
      tela.querySelector('[data-lista]').innerHTML = lista.slice(0, 300).map((c) => {
        const l = lancha(c.lancha_id), r = roteiro(c.roteiro_id);
        const valor = Number(c.valor_fechado) ? R(c.valor_fechado) : Number(c.valor_orcado) ? 'Orçado ' + R(c.valor_orcado) : '';
        const data = c.data_desejada ? ddIso(c.data_desejada) : (c.data_texto || 'data a definir');
        const partes = [data, c.pessoas ? c.pessoas + ' pessoas' : '', l ? l.nome : r ? r.nome : '', valor, c.etapa === 'perdidos' ? c.motivo_perda : '', t ? ETAPAS.find((e) => e.id === c.etapa).nome : ''].filter(Boolean);
        return `<li><button class="linha" type="button" data-cliente="${c.id}">
          <span class="avatar">${esc((c.nome || '?')[0].toUpperCase())}</span>
          <span class="linha__corpo"><b>${esc(c.nome || foneTela(c.wa_id) || 'Sem nome')}${seloExemplo(c)}</b><span>${esc(partes.join(' · '))}</span></span>
          <svg><use href="#p-seta"/></svg></button></li>`;
      }).join('') || vazio(t ? 'Ninguém encontrado com esse nome ou telefone.' : 'Ninguém nesta etapa agora.');
    };
    const campo = tela.querySelector('[data-busca]');
    campo.addEventListener('input', () => {
      busca = campo.value; pinta();
      tela.querySelector('[data-ajuda]').textContent = busca.trim() ? 'Resultado da procura em todas as etapas.' : et.ajuda;
      tela.querySelectorAll('[data-etapa]').forEach((b) => b.setAttribute('aria-selected', String(!busca.trim() && b.dataset.etapa === etapaAtual)));
    });
    pinta();
  }

  // Clientes: cada pessoa uma vez só, em tabela, com filtros e exportação.
  function telaClientes() {
    const FILTROS = [['todos', 'Todos'], ['marcado', 'Com passeio marcado'], ['clientes', 'Já reservaram'], ['voltaram', 'Voltaram mais de uma vez'], ['nunca', 'Nunca reservaram']];
    const origens = [...new Set(S.leads.map((c) => c.origem_manual || c.origem).filter(Boolean))];
    tela.innerHTML = `
      <header class="cab"><div><h1>Clientes</h1><p>Cada pessoa uma vez só, com todos os pedidos e passeios dela. As etapas da venda ficam no Funil de vendas.</p></div>
        <div class="acoes"><button class="botao botao--leve" type="button" data-csv><svg><use href="#p-baixar"/></svg>Exportar clientes</button>
        <button class="botao botao--principal" type="button" data-novo-cliente><svg><use href="#p-mais-um"/></svg>Cadastrar cliente</button></div></header>
      <div class="filtros-cli">
        <label class="busca"><span class="sr">Procurar cliente</span><input type="search" placeholder="Procurar por nome, telefone ou e-mail" value="${esc(busca)}" data-busca autocomplete="off"></label>
        <label class="campo"><span class="sr">Veio de</span><select data-origem-tab><option value="">Veio de qualquer lugar</option>${origens.map((o) => `<option value="${esc(o)}"${o === origemTab ? ' selected' : ''}>Veio de: ${esc(nomeOrigem(o))}</option>`).join('')}</select></label>
      </div>
      <div class="chips chips--periodo" role="group" aria-label="Mostrar" style="margin:0 0 12px">${FILTROS.map(([v, n]) => `<button class="chip" type="button" aria-pressed="${v === filtroTab}" data-filtro-tab="${v}">${n}</button>`).join('')}</div>
      <p class="ajuda" data-resumo></p>
      <div class="tabela-cli" data-tabela></div>`;
    let lista = [];
    const pinta = () => {
      const t = busca.trim().toLowerCase();
      const passa = { todos: () => true, marcado: (x) => !!x.proximo, clientes: (x) => x.reservas > 0, voltaram: (x) => x.reservas > 1, nunca: (x) => x.reservas === 0 }[filtroTab];
      lista = pessoas().filter((x) => passa(x) && (!origemTab || x.origem === origemTab)
        && (!t || x.pedidos.some((c) => textoBusca(c).includes(t))));
      const por = {
        nome: (a, b) => String(a.nome || '~').localeCompare(String(b.nome || '~'), 'pt-BR'),
        ultimo: (a, b) => String(b.proximo || b.ultimo || '').localeCompare(String(a.proximo || a.ultimo || '')) || String(b.contato).localeCompare(String(a.contato)),
        total: (a, b) => b.total - a.total || b.reservas - a.reservas,
        reservas: (a, b) => b.reservas - a.reservas || b.total - a.total,
      };
      lista.sort(por[ordemTab]);
      const voltaram = lista.filter((x) => x.reservas > 1).length;
      tela.querySelector('[data-resumo]').textContent = lista.length
        ? `${lista.length === 1 ? '1 pessoa' : lista.length + ' pessoas'}. ${voltaram ? `${voltaram === 1 ? '1 voltou' : voltaram + ' voltaram'} para mais de um passeio.` : ''} Toque numa pessoa para ver o histórico.`
        : '';
      const th = (id, nome, cls) => `<th${cls ? ` class="${cls}"` : ''} aria-sort="${ordemTab === id ? (id === 'nome' ? 'ascending' : 'descending') : 'none'}"><button type="button" data-ordem-tab="${id}">${nome}</button></th>`;
      tela.querySelector('[data-tabela]').innerHTML = lista.length ? `<table>
        <thead><tr>${th('nome', 'Cliente')}<th>WhatsApp</th><th>E-mail</th>${th('reservas', 'Reservas', 'num')}${th('ultimo', 'Último passeio')}${th('total', 'Total gasto', 'num')}<th>Veio de</th></tr></thead>
        <tbody>${lista.slice(0, 500).map((x) => `<tr data-historico="${esc(x.k)}">
          <td data-r="Cliente"><button class="tabela-cli__nome" type="button">${esc(x.nome || foneTela(x.wa) || 'Sem nome')}</button>${x.exemplo ? seloExemplo({ origem_import: 'demo' }) : ''}<small>${x.pedidos.length === 1 ? '1 pedido' : x.pedidos.length + ' pedidos'}</small></td>
          <td data-r="WhatsApp">${esc(foneTela(x.wa)) || '<span class="tabela-cli__nada">sem</span>'}</td>
          <td data-r="E-mail">${x.email ? esc(x.email) : '<span class="tabela-cli__nada">sem</span>'}</td>
          <td data-r="Reservas" class="num">${x.reservas}</td>
          <td data-r="Último passeio">${x.proximo ? `<b>Próximo ${ddIso(x.proximo)}</b>${x.ultimo ? `<small>antes ${ddIso(x.ultimo)}</small>` : ''}` : x.ultimo ? ddIso(x.ultimo) + `<small>${x.ultimo.slice(0, 4)}</small>` : '<span class="tabela-cli__nada">nunca</span>'}</td>
          <td data-r="Total gasto" class="num">${x.total ? R(x.total) : '<span class="tabela-cli__nada">nada</span>'}</td>
          <td data-r="Veio de">${esc(nomeOrigem(x.origem))}</td></tr>`).join('')}</tbody></table>`
        : `<ul class="lista">${vazio(t ? 'Ninguém encontrado com esse nome, telefone ou e-mail.' : 'Ninguém neste filtro.')}</ul>`;
    };
    const campo = tela.querySelector('[data-busca]');
    campo.addEventListener('input', () => { busca = campo.value; pinta(); });
    tela.querySelector('[data-origem-tab]').addEventListener('change', (e) => { origemTab = e.target.value; pinta(); });
    tela.querySelectorAll('[data-filtro-tab]').forEach((b) => b.addEventListener('click', () => {
      filtroTab = b.dataset.filtroTab;
      tela.querySelectorAll('[data-filtro-tab]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      pinta();
    }));
    tela.querySelector('[data-tabela]').addEventListener('click', (e) => {
      const o = e.target.closest('[data-ordem-tab]');
      if (o) { e.stopPropagation(); ordemTab = o.dataset.ordemTab; pinta(); }
    });
    tela.querySelector('[data-csv]').addEventListener('click', () => baixaCsv(lista));
    pinta();
  }

  // Planilha das pessoas da tabela (o que está filtrado na tela). Ponto e vírgula e BOM: abre certo no Excel em português.
  function baixaCsv(lista) {
    const cel = (v) => {
      let s = String(v == null ? '' : v);
      if (/^[=+\-@]/.test(s)) s = "'" + s;   // o Excel não executa nada que venha da planilha
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const fonePlanilha = (w) => { const d = digitos(w); return !d ? '' : d.startsWith('55') ? foneTela(w) : d; };
    const linhas = [['Nome', 'WhatsApp', 'E-mail', 'Pedidos', 'Reservas', 'Último passeio', 'Próximo passeio', 'Total gasto', 'Veio de', 'Primeiro contato']]
      .concat(lista.filter((x) => !x.exemplo).map((x) => [x.nome || '', fonePlanilha(x.wa), x.email || '', x.pedidos.length, x.reservas,
        x.ultimo ? ddIso(x.ultimo) + '/' + x.ultimo.slice(0, 4) : '', x.proximo ? ddIso(x.proximo) + '/' + x.proximo.slice(0, 4) : '',
        x.total ? x.total.toFixed(2).replace('.', ',') : '0', nomeOrigem(x.origem), x.primeiro ? ddIso(iso(new Date(x.primeiro))) + '/' + String(x.primeiro).slice(0, 4) : '']));
    const blob = new Blob(['﻿' + linhas.map((l) => l.map(cel).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clientes-barra-boat-${iso(hoje())}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    avisa(`Exportei ${linhas.length - 1} ${linhas.length - 1 === 1 ? 'cliente' : 'clientes'} para a planilha.${lista.some((x) => x.exemplo) ? ' Os clientes de exemplo ficaram de fora.' : ''}`);
  }

  // Histórico de uma pessoa: todos os pedidos, reservas e quanto ela já gastou.
  function abreHistorico(k) {
    const x = pessoaDe(k);
    if (!x) return;
    const wa = digitos(x.wa);
    abreGaveta(x.nome || foneTela(x.wa) || 'Cliente', `
      <div class="secao-g">
        ${x.exemplo ? '<p class="selo selo--neutro" style="white-space:normal;margin:0 0 10px">Cliente de exemplo: será apagado antes do lançamento.</p>' : ''}
        <p style="margin:0;color:var(--suave)">${[foneTela(x.wa), x.email, 'veio de ' + nomeOrigem(x.origem), 'primeiro contato ' + quando(x.primeiro)].filter(Boolean).map(esc).join(' · ')}</p>
      </div>
      <div class="numeros secao-g">
        <div class="numero"><span>Reservas</span><b>${x.reservas}</b><small>${x.pedidos.length === 1 ? '1 pedido' : x.pedidos.length + ' pedidos'}</small></div>
        <div class="numero"><span>Total gasto</span><b>${R(x.total)}</b>${x.reservas > 1 ? `<small>${R(x.total / x.reservas)} por reserva</small>` : ''}</div>
        <div class="numero"><span>${x.proximo ? 'Próximo passeio' : 'Último passeio'}</span><b>${x.proximo ? ddIso(x.proximo) : x.ultimo ? ddIso(x.ultimo) : 'nunca'}</b>${(x.proximo || x.ultimo) ? `<small>${(x.proximo || x.ultimo).slice(0, 4)}</small>` : ''}</div>
      </div>
      ${wa ? `<div class="acoes secao-g"><a class="botao botao--wa" href="https://wa.me/${wa}" target="_blank" rel="noopener"><svg><use href="#p-wa"/></svg>Abrir conversa</a></div>` : ''}
      <div class="secao-g"><h3>Pedidos</h3>
        <ul class="lista">${x.pedidos.map((c) => {
          const p = passeioDoLead(c.id), l = lancha((p && p.lancha_id) || c.lancha_id), r = roteiro(c.roteiro_id);
          const dia = diaDoPedido(c);
          const valor = Number(c.valor_fechado) ? R(c.valor_fechado) : Number(c.valor_orcado) ? 'orçado ' + R(c.valor_orcado) : '';
          return `<li><button class="linha" type="button" data-cliente="${c.id}">
            <span class="linha__icone"><svg><use href="#${c.etapa === 'fechados' ? 'p-lancha' : 'p-clientes'}"/></svg></span>
            <span class="linha__corpo"><b>${dia ? `${ddIso(dia)}/${dia.slice(0, 4)}` : esc(c.data_texto || 'Data a definir')}${l ? ' · ' + esc(l.nome) : r ? ' · ' + esc(r.nome) : ''}</b>
              <span>${esc([ETAPAS.find((e) => e.id === c.etapa).nome, c.pessoas ? c.pessoas + ' pessoas' : '', valor, c.etapa === 'perdidos' ? c.motivo_perda : '', 'pedido ' + quando(c.created_at)].filter(Boolean).join(' · '))}</span></span>
            <svg><use href="#p-seta"/></svg></button></li>`;
        }).join('')}</ul>
      </div>`);
  }

  function novoCliente() {
    let origem = 'direto';
    abreGaveta('Cadastrar cliente', `
      <div class="grade-2">
        <label class="campo"><span>Nome</span><input data-nome autocomplete="off"></label>
        <label class="campo"><span>WhatsApp</span><input data-fone inputmode="tel" placeholder="(48) 99999-9999" autocomplete="off"></label>
      </div>
      <div class="grade-2">
        <label class="campo"><span>Data do passeio</span><input type="date" data-dia></label>
        <label class="campo"><span>Pessoas</span><input data-pessoas inputmode="numeric"></label>
      </div>
      <label class="campo"><span>Roteiro</span><select data-roteiro>${opcoes(S.roteiros, null, (x) => x.nome, 'Ainda não sabe')}</select></label>
      <div class="campo"><span>Como chegou até vocês?</span><div class="chips">${ORIGENS.map(([v, n]) => `<button class="chip" type="button" aria-pressed="${v === 'direto'}" data-origem="${v}">${esc(n)}</button>`).join('')}</div></div>
      <label class="campo"><span>O que a pessoa pediu <small style="font-weight:400;color:var(--suave)">(se quiser)</small></span><textarea data-msg rows="3"></textarea></label>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Cadastrar</button>`, (c) => {
      const f = (k) => c.querySelector(`[data-${k}]`);
      chips(c, '[data-origem]', (b) => { origem = b.dataset.origem; });
      f('nome').focus();
      aoSalvar(f('salvar'), async () => {
        const nome = f('nome').value.trim(), wa = fone(f('fone').value);
        if (!nome && !wa) return erroCampo(c, 'Escreva o nome ou o WhatsApp.');
        if (wa && wa.replace(/\D/g, '').length < 12) return erroCampo(c, 'O WhatsApp precisa ter DDD e número. Ex.: (48) 99115-3172.');
        const repetido = wa && S.leads.find((x) => x.wa_id === wa && !['fechados', 'perdidos'].includes(x.etapa));
        if (repetido) { erroCampo(c, ''); abreCliente(repetido.id); avisa('Esse cliente já está cadastrado. Abrimos a ficha dele.'); return; }
        erroCampo(c, '');
        const novo = await grava(sb.from('bb_leads').insert({
          nome: nome || null, wa_id: wa, data_desejada: f('dia').value || null, pessoas: Number(f('pessoas').value) || null,
          roteiro_id: f('roteiro').value || null, origem, mensagem: f('msg').value.trim() || null, etapa: 'novos',
        }).select('id').single());
        if (!novo) return;
        etapaAtual = 'novos'; await atualiza(); abreCliente(novo.id); avisa('Cliente cadastrado.');
      });
    });
  }

  function abreCliente(id) {
    const c = lead(id);
    if (!c) { fechaGaveta(); return; }
    const n = ETAPAS.findIndex((e) => e.id === c.etapa);
    const prox = n < 3 ? ETAPAS[n + 1] : null;
    const p = passeioDoLead(c.id);
    const l = lancha(c.lancha_id);
    const fechado = Number(c.valor_fechado), orcado = Number(c.valor_orcado), custos = Number(c.custos_passeio) || 0;
    const rec = S.receb.filter((r) => r.lead_id === c.id);
    const notas = Array.isArray(c.notas) ? c.notas : [];
    const digitos = String(c.wa_id || '').replace(/\D/g, '');
    abreGaveta(c.nome || foneTela(c.wa_id) || 'Cliente', `
      <div class="secao-g">
        <div class="etapas" aria-hidden="true">${ETAPAS.slice(0, 4).map((e, i) => `<span class="${i <= n && c.etapa !== 'perdidos' ? 'on' : ''}"></span>`).join('')}<span class="${c.etapa === 'perdidos' ? 'on perdido' : ''}"></span></div>
        ${exemplo(c) ? '<p class="selo selo--neutro" style="white-space:normal;margin:0 0 10px">Cliente de exemplo: será apagado antes do lançamento, com tudo o que for anotado nele.</p>' : ''}
        <p style="margin:0;color:var(--suave)">Etapa: <b style="color:var(--tinta)">${esc(ETAPAS[n].nome)}</b> · veio de ${esc(nomeOrigem(c.origem_manual || c.origem))} · chegou ${esc(quando(c.created_at))}${c.etapa === 'perdidos' && c.motivo_perda ? ` · ${esc(c.motivo_perda)}` : ''}</p>
        ${(() => {
          const x = pessoaDe(chavePessoa(c));
          if (!x || x.pedidos.length < 2) return '';
          return `<button class="linha historico-atalho" type="button" data-historico="${esc(x.k)}"><span class="linha__icone"><svg><use href="#p-relogio"/></svg></span>
            <span class="linha__corpo"><b>Já pediu ${x.pedidos.length} vezes${x.reservas ? `, ${x.reservas === 1 ? '1 reserva' : x.reservas + ' reservas'}` : ''}</b><span>${x.total ? 'Gastou ' + R(x.total) + ' no total. ' : ''}Ver o histórico</span></span><svg><use href="#p-seta"/></svg></button>`;
        })()}
      </div>
      <div class="acoes secao-g">
        ${digitos ? `<a class="botao botao--wa" href="https://wa.me/${digitos}" target="_blank" rel="noopener"><svg><use href="#p-wa"/></svg>Abrir conversa</a>` : ''}
        ${prox ? `<button class="botao botao--principal" type="button" data-mover="${prox.id}">Passar para ${esc(prox.nome)}</button>` : ''}
        ${c.etapa === 'perdidos' ? '<button class="botao botao--leve" type="button" data-mover="conversando">Voltar para Conversando</button>' : ''}
        ${c.etapa !== 'perdidos' && c.etapa !== 'fechados' ? '<button class="botao botao--leve" type="button" data-perdeu>Não fechou</button>' : ''}
      </div>

      <div class="secao-g"><h3>O passeio</h3>
        ${p ? `<div class="estado"><svg><use href="#p-ok"/></svg>Marcado na ${esc((lancha(p.lancha_id) || {}).nome || 'lancha')}, ${DIAS[deIso(p.dia).getDay()]} ${ddIso(p.dia)}${p.hora_saida ? ', saída ' + hora(p.hora_saida) : ''}.</div>
          <div class="acoes" style="margin-bottom:12px"><button class="botao botao--leve botao--pequeno" type="button" data-editar-p>Mudar data, hora ou marinheiro</button>${botoesEnvio(p, true)}</div>`
          : c.etapa === 'fechados' ? '<div class="alerta" style="margin-bottom:12px"><div><b>Ainda não está na agenda.</b><p style="margin:2px 0 0">Marque para o dia aparecer ocupado no site.</p></div></div>' : ''}
        <div class="cartao">
          <div class="grade-2">
            <label class="campo"><span>Nome</span><input data-f="nome" value="${esc(c.nome)}"></label>
            <label class="campo"><span>WhatsApp</span><input data-f="wa_id" inputmode="tel" value="${esc(foneTela(c.wa_id))}"></label>
            <label class="campo"><span>Data</span><input type="date" data-f="data_desejada" value="${c.data_desejada || ''}"${p ? ' disabled' : ''}></label>
            <label class="campo"><span>Pessoas</span><input data-f="pessoas" inputmode="numeric" value="${c.pessoas || ''}"></label>
            <label class="campo"><span>Roteiro</span><select data-f="roteiro_id">${opcoes(S.roteiros, c.roteiro_id, (x) => x.nome, 'A combinar')}</select></label>
            <label class="campo"><span>Lancha</span><select data-f="lancha_id"${p ? ' disabled' : ''}>${opcoes(lanchasAtivas(), c.lancha_id, (x) => `${x.nome} (até ${x.passageiros})`, 'Ainda não escolhida')}</select></label>
          </div>
          <label class="campo"><span>E-mail <small style="font-weight:400;color:var(--suave)">(se tiver)</small></span><input type="email" data-f="email" value="${esc(c.email || '')}" autocomplete="off"></label>
          ${l && c.pessoas > l.passageiros ? `<p class="selo selo--alerta" style="margin:0 0 12px">A ${esc(l.nome)} leva até ${l.passageiros} pessoas.</p>` : ''}
          ${p ? '<p class="ajuda">Para trocar a lancha ou o dia, abra o passeio na Agenda e toque em "Mudar data, hora ou marinheiro".</p>' : ''}
          <div class="acoes"><button class="botao botao--leve" type="button" data-salvar-pedido>Salvar o pedido</button>
          ${!p && c.etapa !== 'perdidos' ? '<button class="botao botao--principal" type="button" data-marcar>Marcar na agenda</button>' : ''}</div>
        </div>
      </div>

      <div class="secao-g"><h3>Valores</h3>
        <div class="cartao">
          <div class="grade-2">
            <label class="campo"><span>Valor orçado</span><input data-v="valor_orcado" inputmode="decimal" value="${orcado ? Rc(orcado) : ''}" placeholder="R$ 0"></label>
            <label class="campo"><span>Valor fechado</span><input data-v="valor_fechado" inputmode="decimal" value="${fechado ? Rc(fechado) : ''}" placeholder="R$ 0"></label>
          </div>
          <label class="campo"><span>Custos do passeio</span><input data-v="custos_passeio" inputmode="decimal" value="${c.custos_passeio != null ? Rc(custos) : ''}" placeholder="R$ 0"><small>Combustível, marinheiro, gelo. Entra no relatório de quanto sobrou.</small></label>
          <button class="botao botao--leve" type="button" data-salvar-valores>Salvar valores</button>
        </div>
        ${fechado ? `<div class="numeros" style="margin-top:12px">
          <div class="numero"><span>Recebido</span><b>${R(recebido(c.id))}</b><small>${rec.length} ${rec.length === 1 ? 'pagamento' : 'pagamentos'}</small></div>
          <div class="numero"><span>Falta receber</span><b>${R(falta(c))}</b></div>
          ${c.custos_passeio != null ? `<div class="numero"><span>Sobra deste passeio</span><b>${R(fechado - custos)}</b></div>` : ''}
        </div>` : ''}
        ${rec.length ? `<ul class="lista" style="margin-top:12px">${rec.map((r) => `<li class="linha"><span class="linha__icone"><svg><use href="#p-dinheiro"/></svg></span>
          <span class="linha__corpo"><b>${R(r.valor)}</b><span>${esc({ sinal: 'Sinal', restante: 'Restante', outro: 'Pagamento' }[r.tipo])}${r.forma ? ' por ' + esc((FORMAS.find((x) => x[0] === r.forma) || [0, r.forma])[1].toLowerCase()) : ''} em ${ddIso(r.recebido_em)}</span></span>
          <button class="botao botao--perigo-leve botao--pequeno" type="button" data-apaga-rec="${r.id}">Apagar</button></li>`).join('')}</ul>` : ''}
        ${fechado || orcado ? `<button class="botao botao--principal botao--cheio" type="button" data-receber="${c.id}" style="margin-top:12px"><svg><use href="#p-mais-um"/></svg>Anotar pagamento recebido</button>` : ''}
      </div>

      <div class="secao-g"><h3>Anotações</h3>
        ${notas.length ? `<ul class="notas">${notas.slice().reverse().map((x) => `<li><p>${esc(x.txt)}</p><small>${esc(x.autor || '')}${x.autor ? ', ' : ''}${esc(quando(x.ts))}</small></li>`).join('')}</ul>` : ''}
        <label class="campo"><span class="sr">Nova anotação</span><textarea data-nota rows="2" placeholder="Ex.: quer o barco com som, aniversário da filha"></textarea></label>
        <button class="botao botao--leve" type="button" data-anotar>Anotar</button>
      </div>

      ${c.mensagem ? `<div class="secao-g"><h3>Primeira mensagem</h3><div class="conversa"><div class="msg">${esc(c.mensagem)}<small>${esc(quando(c.created_at))}</small></div></div>
        <p class="ajuda" style="margin-top:10px">A conversa inteira aparece aqui quando o robô do WhatsApp estiver ligado.</p></div>` : ''}`, (g) => {
      const reabre = async (msg) => { await atualiza(); abreCliente(c.id); if (msg) avisa(msg); };
      g.querySelectorAll('[data-mover]').forEach((b) => aoSalvar(b, async () => {
        const para = b.dataset.mover;
        const muda = { etapa: para };
        if (para === 'fechados' && !fechado && orcado) muda.valor_fechado = orcado;
        if (para === 'conversando') muda.motivo_perda = null;
        if (!(await grava(sb.from('bb_leads').update(muda).eq('id', c.id)))) return;
        etapaAtual = para;
        await reabre(`${c.nome || 'Cliente'} passou para ${ETAPAS.find((e) => e.id === para).nome}.`);
      }));
      const ep = g.querySelector('[data-editar-p]');
      if (ep) ep.addEventListener('click', () => editarPasseio(p));
      const perdeu = g.querySelector('[data-perdeu]');
      if (perdeu) perdeu.addEventListener('click', () => naoFechou(c));
      aoSalvar(g.querySelector('[data-salvar-pedido]'), async () => {
        const v = (k) => g.querySelector(`[data-f="${k}"]`).value;
        const wa = fone(v('wa_id'));
        if (wa && wa.replace(/\D/g, '').length < 12) { avisa('O WhatsApp precisa ter DDD e número.', true); return; }
        const email = v('email').trim().toLowerCase();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { avisa('Esse e-mail não parece certo. Confira.', true); return; }
        const muda = { nome: v('nome').trim() || null, wa_id: wa, email: email || null, pessoas: Number(v('pessoas')) || null, roteiro_id: v('roteiro_id') || null };
        if (!p) { muda.data_desejada = v('data_desejada') || null; muda.lancha_id = v('lancha_id') || null; }
        if (!(await grava(sb.from('bb_leads').update(muda).eq('id', c.id)))) return;
        await reabre('Pedido salvo.');
      });
      const marcar = g.querySelector('[data-marcar]');
      if (marcar) marcar.addEventListener('click', () => marcarPasseio({ lead_id: c.id, lancha_id: c.lancha_id, dia: c.data_desejada }));
      aoSalvar(g.querySelector('[data-salvar-valores]'), async () => {
        const v = (k) => g.querySelector(`[data-v="${k}"]`).value;
        const muda = { valor_orcado: num(v('valor_orcado')), valor_fechado: num(v('valor_fechado')), custos_passeio: v('custos_passeio').trim() ? num(v('custos_passeio')) : null };
        if (!(await grava(sb.from('bb_leads').update(muda).eq('id', c.id)))) return;
        await reabre('Valores salvos.');
      });
      g.querySelectorAll('[data-apaga-rec]').forEach((b) => confirmaNoBotao(b, 'Apagar mesmo?', async () => {
        if (!(await grava(sb.from('bb_recebimentos').delete().eq('id', b.dataset.apagaRec)))) return;
        await reabre('Pagamento apagado.');
      }));
      aoSalvar(g.querySelector('[data-anotar]'), async () => {
        const txt = g.querySelector('[data-nota]').value.trim();
        if (!txt) return;
        const novas = notas.concat({ ts: new Date().toISOString(), txt, autor: primeiroNome(S.nome) });
        if (!(await grava(sb.from('bb_leads').update({ notas: novas }).eq('id', c.id)))) return;
        await reabre('Anotado.');
      });
    });
  }

  function naoFechou(c) {
    let motivo = null;
    abreGaveta('Por que não fechou?', `
      <div class="chips" style="margin-bottom:16px">${MOTIVOS_PERDA.map((m) => `<button class="chip" type="button" aria-pressed="false" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div>
      <label class="campo" data-outro hidden><span>Conte em poucas palavras</span><input data-txt></label>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Salvar</button>
      <button class="botao botao--leve botao--cheio" type="button" data-volta style="margin-top:10px">Voltar</button>`, (g) => {
      chips(g, '[data-m]', (b) => { motivo = b.dataset.m; g.querySelector('[data-outro]').hidden = motivo !== 'Outro'; });
      g.querySelector('[data-volta]').addEventListener('click', () => abreCliente(c.id));
      aoSalvar(g.querySelector('[data-salvar]'), async () => {
        if (!motivo) return erroCampo(g, 'Escolha um motivo.');
        const txt = motivo === 'Outro' ? g.querySelector('[data-txt]').value.trim() || 'Outro' : motivo;
        if (!(await grava(sb.from('bb_leads').update({ etapa: 'perdidos', motivo_perda: txt }).eq('id', c.id)))) return;
        etapaAtual = 'perdidos'; await atualiza(); abreCliente(c.id); avisa('Anotado como não fechou.');
      });
    });
  }

  function anotarRecebimento(leadId, tipoPadrao) {
    const c = lead(leadId); if (!c) return;
    const f0 = falta(c);
    let tipo = tipoPadrao || (recebido(leadId) ? 'restante' : 'sinal'), forma = 'pix';
    abreGaveta('Pagamento recebido', `
      <p style="margin-top:0">${esc(c.nome || 'Cliente')}${Number(c.valor_fechado) ? `: fechado em ${R(c.valor_fechado)}, falta ${R(f0)}.` : '.'}</p>
      <label class="campo"><span>Quanto recebeu?</span><input class="valor-grande" type="text" inputmode="decimal" placeholder="R$ 0" data-valor value="${tipo === 'restante' && f0 ? Rc(f0) : ''}" autocomplete="off"></label>
      <div class="campo"><span>É o quê?</span><div class="chips">${[['sinal', 'Sinal'], ['restante', 'Restante'], ['outro', 'Outro']].map(([v, n]) => `<button class="chip" type="button" aria-pressed="${v === tipo}" data-tipo="${v}">${n}</button>`).join('')}</div></div>
      <div class="campo"><span>Como pagou?</span><div class="chips">${FORMAS.map(([v, n]) => `<button class="chip" type="button" aria-pressed="${v === forma}" data-forma="${v}">${n}</button>`).join('')}</div></div>
      <label class="campo"><span>Quando?</span><input type="date" data-data value="${iso(hoje())}"></label>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Salvar pagamento</button>`, (g) => {
      chips(g, '[data-tipo]', (b) => { tipo = b.dataset.tipo; if (tipo === 'restante' && f0) g.querySelector('[data-valor]').value = Rc(f0); });
      chips(g, '[data-forma]', (b) => { forma = b.dataset.forma; });
      g.querySelector('[data-valor]').focus();
      aoSalvar(g.querySelector('[data-salvar]'), async () => {
        const v = num(g.querySelector('[data-valor]').value);
        if (!v) return erroCampo(g, 'Escreva o valor recebido.');
        if (!(await grava(sb.from('bb_recebimentos').insert({ lead_id: leadId, tipo, forma, valor: v, recebido_em: g.querySelector('[data-data]').value || iso(hoje()) })))) return;
        await atualiza(); abreCliente(leadId); avisa(`Anotado: ${Rc(v)} recebido.`);
      });
    });
  }

  /* ================= DINHEIRO (só a dona) ================= */
  let abaDinheiro = 'resumo';
  let mesSel = iso(hoje()).slice(0, 7);
  const nomeMes = (m) => { const [a, n] = m.split('-').map(Number); return `${MESES_LONGOS[n - 1]} de ${a}`; };
  const somaMes = (m, d = 1) => { const [a, n] = m.split('-').map(Number); const x = new Date(a, n - 1 + d, 1); return iso(x).slice(0, 7); };
  const vendasDoMes = (m) => S.leads.filter((l) => l.etapa === 'fechados' && Number(l.valor_fechado) > 0 && (diaVenda(l) || '').startsWith(m));
  const fatMes = (m) => vendasDoMes(m).reduce((s, l) => s + Number(l.valor_fechado), 0);
  const despesasDoMes = (m) => S.despesas.filter((d) => d.dia.startsWith(m));
  // Período dos Relatórios: o mês escolhido, o semestre ou o ano em que ele cai.
  let periodo = 'mes';
  const PASSO = { mes: 1, semestre: 6, ano: 12 };
  function mesesDoPeriodo(m = mesSel, tipo = periodo) {
    const [a, n] = m.split('-').map(Number);
    const de = tipo === 'mes' ? n : tipo === 'semestre' ? (n <= 6 ? 1 : 7) : 1;
    const qt = tipo === 'mes' ? 1 : tipo === 'semestre' ? 6 : 12;
    return Array.from({ length: qt }, (_, i) => `${a}-${pad(de + i)}`);
  }
  function nomePeriodo(m = mesSel, tipo = periodo) {
    const [a, n] = m.split('-').map(Number);
    if (tipo === 'ano') return String(a);
    if (tipo === 'semestre') return `${n <= 6 ? '1º' : '2º'} semestre de ${a}`;
    return nomeMes(m);
  }
  const noPeriodo = (ms) => (data) => ms.includes(String(data || '').slice(0, 7));

  function telaDinheiro() {
    if (!dona()) { tela.innerHTML = '<header class="cab"><div><h1>Relatórios</h1></div></header><p class="cartao vazio">Esta parte é só da dona.</p>'; return; }
    const ms = mesesDoPeriodo();
    const desp = S.despesas.filter((d) => noPeriodo(ms)(d.dia));
    const atual = iso(hoje()).slice(0, 7);
    const rotulos = { mes: ['Mês anterior', 'Próximo mês'], semestre: ['Semestre anterior', 'Próximo semestre'], ano: ['Ano anterior', 'Próximo ano'] }[periodo];
    tela.innerHTML = `<header class="cab"><div><h1>Relatórios</h1>
        <div class="mes-nav"><button class="botao-icone" type="button" data-mes="-1" aria-label="${rotulos[0]}"><svg><use href="#p-volta"/></svg></button>
        <p>${esc(nomePeriodo().replace(/^./, (x) => x.toUpperCase()))}</p>
        <button class="botao-icone" type="button" data-mes="1" aria-label="${rotulos[1]}"${ms[ms.length - 1] >= atual ? ' disabled' : ''}><svg><use href="#p-seta"/></svg></button></div>
        <div class="chips chips--periodo" role="group" aria-label="Ver por">${[['mes', 'Mês'], ['semestre', 'Semestre'], ['ano', 'Ano']].map(([v, n]) => `<button class="chip" type="button" aria-pressed="${v === periodo}" data-periodo="${v}">${n}</button>`).join('')}</div></div>
      <div class="acoes"><button class="botao botao--principal" type="button" data-despesa><svg><use href="#p-mais-um"/></svg>Anotar despesa</button></div></header>
      <div class="abas" role="tablist" aria-label="Relatórios">
        <button class="aba" type="button" role="tab" aria-selected="${abaDinheiro === 'resumo'}" data-aba-d="resumo">Resumo</button>
        <button class="aba" type="button" role="tab" aria-selected="${abaDinheiro === 'despesas'}" data-aba-d="despesas">Despesas<b>${desp.length}</b></button></div>
      <div id="dinheiro-corpo"></div>`;
    if (abaDinheiro === 'resumo') resumo(); else despesas();
  }

  function pct(a, b) { return b ? Math.round((a / b - 1) * 100) : null; }

  function resumo() {
    const m = mesSel, [ano, mesN] = m.split('-').map(Number);
    const ms = mesesDoPeriodo(), dentro = noPeriodo(ms);
    const msAP = ms.map((x) => `${ano - 1}${x.slice(4)}`);
    const umMes = periodo === 'mes';
    const noP = umMes ? 'no mês' : periodo === 'semestre' ? 'no semestre' : 'no ano';
    const vendas = S.leads.filter((l) => l.etapa === 'fechados' && Number(l.valor_fechado) > 0 && dentro(diaVenda(l)));
    const bruto = vendas.reduce((s, l) => s + Number(l.valor_fechado), 0);
    const custos = vendas.reduce((s, l) => s + (Number(l.custos_passeio) || 0), 0);
    const despM = S.despesas.filter((d) => dentro(d.dia)), desp = despM.reduce((s, d) => s + Number(d.valor), 0);
    const liquido = bruto - custos - desp;
    const orcados = S.leads.filter((l) => l.orcamento_at && dentro(iso(new Date(l.orcamento_at))));
    const comOrc = orcados.filter((l) => Number(l.valor_orcado) > 0);
    const tmOrc = comOrc.length ? Math.round(comOrc.reduce((s, l) => s + Number(l.valor_orcado), 0) / comOrc.length) : 0;
    const tmBruto = vendas.length ? Math.round(bruto / vendas.length) : 0;
    const tmLiq = vendas.length ? Math.round(liquido / vendas.length) : 0;
    const brutoAP = msAP.reduce((s, x) => s + fatMes(x), 0);
    const dif = pct(bruto, brutoAP);
    const comMeta = ms.filter((x) => S.metas[x]);
    const meta = umMes ? S.metas[m] : comMeta.reduce((s, x) => s + S.metas[x], 0);
    const brutoMeta = umMes ? bruto : comMeta.reduce((s, x) => s + fatMes(x), 0);
    const atual = iso(hoje()).slice(0, 7);
    const diasRestam = umMes && m === atual ? new Date(ano, mesN, 0).getDate() - hoje().getDate() : 0;

    // gráfico: 12 meses do ano escolhido contra o ano anterior
    const F1 = Array.from({ length: 12 }, (_, i) => fatMes(`${ano}-${pad(i + 1)}`));
    const F0 = Array.from({ length: 12 }, (_, i) => fatMes(`${ano - 1}-${pad(i + 1)}`));
    const futuro = (i) => `${ano}-${pad(i + 1)}` > atual;
    const max = Math.max(1, ...F1, ...F0);
    const temDados = F1.some(Boolean) || F0.some(Boolean);
    const colunas = F1.map((v, i) => `<div class="colunas__mes ${ms.includes(`${ano}-${pad(i + 1)}`) ? 'is-atual' : ''}">
      <span class="coluna coluna--b" tabindex="0" style="height:${F0[i] / max * 100}%" data-dica="<b>${MESES_LONGOS[i]} de ${ano - 1}</b><br>${R(F0[i])}" aria-label="${MESES_LONGOS[i]} de ${ano - 1}: ${R(F0[i])}"></span>
      ${!futuro(i) || v ? `<span class="coluna coluna--a" tabindex="0" style="height:${v / max * 100}%" data-dica="<b>${MESES_LONGOS[i]} de ${ano}</b><br>${R(v)}" aria-label="${MESES_LONGOS[i]} de ${ano}: ${R(v)}"></span>` : ''}
    </div>`).join('');
    const ate = mesN - 1;
    const acum1 = F1.slice(0, ate + 1).reduce((s, v) => s + v, 0), acum0 = F0.slice(0, ate + 1).reduce((s, v) => s + v, 0);
    const fraseAno = !temDados ? 'Ainda não há vendas fechadas para mostrar. O gráfico enche conforme os passeios são fechados no painel.'
      : `De janeiro a ${MESES_LONGOS[ate]}, <b>${ano} soma ${R(acum1)}</b>${acum0 ? `, contra ${R(acum0)} no mesmo período de ${ano - 1}` : ''}.`;
    const tabela = F1.map((v, i) => `<tr><td>${MESES_LONGOS[i]}</td><td>${futuro(i) && !v ? 'ainda não' : R(v)}</td><td>${R(F0[i])}</td></tr>`).join('');

    const porCat = {};
    despM.forEach((d) => { porCat[d.categoria] = (porCat[d.categoria] || 0) + Number(d.valor); });
    const cats = Object.entries(porCat).sort((a, b) => b[1] - a[1]);

    const diasNoPeriodo = ms.reduce((s, x) => { const [a, n] = x.split('-').map(Number); return s + new Date(a, n, 0).getDate(); }, 0);
    const ocup = lanchasAtivas().map((l) => [l.nome, Math.round(new Set(S.passeios.filter((p) => p.lancha_id === l.id && dentro(p.dia)).map((p) => p.dia)).size / diasNoPeriodo * 100)])
      .filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const chegaram = S.leads.filter((l) => dentro(iso(new Date(l.created_at))));
    const porOrig = {};
    chegaram.forEach((l) => { const o = nomeOrigem(l.origem_manual || l.origem); porOrig[o] = (porOrig[o] || 0) + 1; });
    const origem = Object.entries(porOrig).sort((a, b) => b[1] - a[1]).map(([nome, q]) => [nome, Math.round(q / chegaram.length * 100), q]);

    $('#dinheiro-corpo').innerHTML = `
      <div class="numeros">
        <div class="numero"><span>Entrou (bruto)</span><b>${R(bruto)}</b><small class="${dif == null ? '' : dif >= 0 ? 'sobe' : 'desce'}">${dif == null ? `passeios fechados ${noP}` : `${Math.abs(dif)}% ${dif >= 0 ? 'a mais' : 'a menos'} que ${umMes ? `${MESES_LONGOS[mesN - 1]} de ${ano - 1}` : nomePeriodo(`${ano - 1}${m.slice(4)}`).replace(/^\d+$/, (x) => 'em ' + x)}`}</small></div>
        <div class="numero"><span>Sobrou (líquido)</span><b>${R(liquido)}</b><small>depois dos custos dos passeios e das despesas</small></div>
        <div class="numero"><span>Passeios vendidos</span><b>${vendas.length}</b><small>${orcados.length} ${orcados.length === 1 ? 'orçamento enviado' : 'orçamentos enviados'} ${noP}</small></div>
      </div>
      <div class="cartao bloco">${meta ? `<b style="color:var(--tinta)">${umMes ? `Meta de ${MESES_LONGOS[mesN - 1]}` : `Metas ${noP}, somadas`}: ${R(meta)}</b>
        <div class="meta" role="img" aria-label="${Math.round(brutoMeta / meta * 100)}% da meta"><i style="width:${Math.min(brutoMeta / meta * 100, 100)}%"></i></div>
        <span style="color:var(--suave)">${Math.round(brutoMeta / meta * 100)}% da meta${!umMes && comMeta.length < ms.length ? ` (${comMeta.length} de ${ms.length} meses com meta)` : ''}.${brutoMeta < meta ? ` Faltam ${R(meta - brutoMeta)}${diasRestam ? ` em ${diasRestam} ${diasRestam === 1 ? 'dia' : 'dias'}` : ''}.` : ' Meta batida.'}</span>
        ${umMes ? '<button class="botao botao--leve botao--pequeno" type="button" data-meta style="margin-left:8px">Mudar a meta</button>' : ''}`
        : umMes ? `<b style="color:var(--tinta)">Sem meta para ${MESES_LONGOS[mesN - 1]}</b><p style="margin:4px 0 12px;color:var(--suave)">Com uma meta, o painel mostra quanto falta e em quantos dias.</p>
        <button class="botao botao--leve botao--pequeno" type="button" data-meta>Definir a meta do mês</button>`
        : `<b style="color:var(--tinta)">Nenhum mês ${noP === 'no ano' ? 'do ano' : 'do semestre'} tem meta</b><p style="margin:4px 0 0;color:var(--suave)">A meta é definida mês a mês. Volte para Mês para definir.</p>`}</div>

      <section class="bloco"><h2>Ticket médio</h2>
        <div class="numeros">
          <div class="numero"><span>Por venda, bruto</span><b>${R(tmBruto)}</b><small>o que o cliente pagou, em média</small></div>
          <div class="numero"><span>Por venda, líquido</span><b>${R(tmLiq)}</b><small>o que sobrou, em média</small></div>
          <div class="numero"><span>Por orçamento</span><b>${R(tmOrc)}</b><small>${tmOrc && tmBruto ? (tmBruto <= tmOrc ? `você fecha, em média, ${Math.round((1 - tmBruto / tmOrc) * 100)}% abaixo do orçado` : 'você fecha acima do orçado, em média') : 'valor médio dos orçamentos'}</small></div>
        </div>
      </section>

      <section class="bloco grafico" aria-labelledby="g1"><h3 id="g1">Quanto entrou, mês a mês</h3>
        <p class="grafico__frase">${fraseAno}</p>
        <ul class="legenda"><li><i style="background:var(--serie2)"></i>${ano - 1}</li><li><i style="background:var(--serie1)"></i>${ano}</li></ul>
        <div class="colunas">${colunas}</div>
        <div class="colunas__rotulos">${MESES.map((x) => `<span>${x}</span>`).join('')}</div>
        <details class="tabela"><summary>Ver os números em tabela</summary><table><thead><tr><th>Mês</th><th>${ano}</th><th>${ano - 1}</th></tr></thead><tbody>${tabela}</tbody></table></details>
      </section>

      <div class="grade-2 bloco">
        <section class="grafico" aria-labelledby="g2"><h3 id="g2">Para onde foi o dinheiro</h3>
          ${cats.length ? `<p class="grafico__frase">O maior gasto ${umMes ? 'do mês' : periodo === 'semestre' ? 'do semestre' : 'do ano'} foi <b>${esc(cats[0][0].toLowerCase())}</b>: ${R(cats[0][1])} de ${R(desp)} em despesas.</p>${barras(cats.map(([n, v]) => [n, v, R(v)]))}`
            : `<p class="grafico__frase">Nenhuma despesa anotada ${noP}.</p>`}</section>
        <section class="grafico" aria-labelledby="g3"><h3 id="g3">Lanchas mais ocupadas</h3>
          ${ocup.length ? `<p class="grafico__frase">A <b>${esc(ocup[0][0])}</b> saiu em ${ocup[0][1]}% dos dias ${umMes ? 'do mês' : periodo === 'semestre' ? 'do semestre' : 'do ano'}.</p>${barras(ocup.map(([n, v]) => [n, v, v + '% dos dias']), 100)}`
            : `<p class="grafico__frase">Nenhum passeio marcado ${noP}.</p>`}</section>
      </div>

      <section class="bloco grafico" aria-labelledby="g4"><h3 id="g4">De onde vieram os clientes</h3>
        ${origem.length ? `<p class="grafico__frase">${chegaram.length} ${chegaram.length === 1 ? 'pessoa chegou' : 'pessoas chegaram'} ${noP}. <b>${esc(origem[0][0])}</b> trouxe ${origem[0][1]}%.</p>${barras(origem.map(([n, v, q]) => [n, v, `${v}% (${q})`]), 100)}`
          : `<p class="grafico__frase">Ninguém chegou ${noP} ainda.</p>`}</section>`;
    const bm = $('#dinheiro-corpo [data-meta]');
    if (bm) bm.addEventListener('click', () => definirMeta(m));
  }

  function barras(itens, teto) {
    const max = teto || Math.max(...itens.map((i) => i[1]));
    return `<ul class="barras">${itens.map(([n, v, rot]) => `<li><span class="barras__nome" title="${esc(n)}">${esc(n)}</span>
      <span class="barras__trilho"><span class="barras__barra" style="width:${Math.max(v / max * 78, 1)}%" data-dica="<b>${esc(n)}</b><br>${esc(rot)}"></span><span class="barras__valor">${esc(rot)}</span></span></li>`).join('')}</ul>`;
  }

  function definirMeta(m) {
    abreGaveta(`Meta de ${nomeMes(m)}`, `
      <label class="campo"><span>Quanto quer faturar no mês?</span><input class="valor-grande" inputmode="decimal" data-valor value="${S.metas[m] ? Rc(S.metas[m]) : ''}" placeholder="R$ 0"></label>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Salvar a meta</button>`, (g) => {
      g.querySelector('[data-valor]').focus();
      aoSalvar(g.querySelector('[data-salvar]'), async () => {
        const v = num(g.querySelector('[data-valor]').value);
        if (!v) return erroCampo(g, 'Escreva o valor da meta.');
        // demo: false tira a marca de exemplo (migração 2026-11-20-07); sem a coluna, grava sem ela
        let r = await sb.from('bb_metas').upsert({ mes: m + '-01', valor: v, demo: false });
        if (r.error && /demo/.test(r.error.message || '')) r = await sb.from('bb_metas').upsert({ mes: m + '-01', valor: v });
        if (r.error) { console.error(r.error); avisa(msgErro(r.error), true); return; }
        fechaGaveta(); await atualiza(); avisa('Meta salva.');
      });
    });
  }

  function despesas() {
    const lista = S.despesas.filter((d) => noPeriodo(mesesDoPeriodo())(d.dia));
    const porDia = {};
    lista.forEach((d) => { (porDia[d.dia] = porDia[d.dia] || []).push(d); });
    const hs = iso(hoje()), ontem = iso(somaDias(hoje(), -1));
    const html = Object.keys(porDia).sort().reverse().map((dia) => `
      <p class="despesa-dia">${dia === hs ? 'Hoje' : dia === ontem ? 'Ontem' : diaLongo(deIso(dia)) + (periodo === 'ano' && dia.slice(0, 4) !== String(hoje().getFullYear()) ? ' de ' + dia.slice(0, 4) : '')}</p>
      <ul class="lista">${porDia[dia].map((d) => `<li class="linha"><span class="linha__icone"><svg><use href="#p-dinheiro"/></svg></span>
        <span class="linha__corpo"><b>${esc(d.categoria)}${seloExemplo(d)}</b><span>${esc([(lancha(d.lancha_id) || {}).nome, d.obs].filter(Boolean).join(' · ') || 'sem observação')}</span></span>
        <b style="color:var(--tinta);white-space:nowrap">${R(d.valor)}</b>
        <button class="botao-icone" type="button" data-despesa-ver="${d.id}" aria-label="Ver despesa"><svg><use href="#p-seta"/></svg></button></li>`).join('')}</ul>`).join('');
    $('#dinheiro-corpo').innerHTML = `
      <div class="numeros"><div class="numero"><span>Gasto em ${esc(nomePeriodo())}</span><b>${R(lista.reduce((s, d) => s + Number(d.valor), 0))}</b><small>${lista.length} ${lista.length === 1 ? 'anotação' : 'anotações'}</small></div></div>
      ${html || `<p class="cartao vazio" style="margin-top:16px">Nenhuma despesa anotada ${periodo === 'mes' ? 'neste mês' : periodo === 'semestre' ? 'neste semestre' : 'neste ano'}.</p>`}`;
    $('#dinheiro-corpo').querySelectorAll('[data-despesa-ver]').forEach((b) => b.addEventListener('click', () => verDespesa(b.dataset.despesaVer)));
  }

  function verDespesa(id) {
    const d = S.despesas.find((x) => x.id === id); if (!d) return;
    abreGaveta(d.categoria, `<div class="cartao"><dl class="dados" style="display:grid;gap:8px">
        <div><dt>Valor:</dt><dd>${R(d.valor)}</dd></div>
        <div><dt>Dia:</dt><dd>${ddIso(d.dia)}</dd></div>
        <div><dt>Lancha:</dt><dd>${esc((lancha(d.lancha_id) || {}).nome || 'geral')}</dd></div>
        ${d.obs ? `<div><dt>Observação:</dt><dd>${esc(d.obs)}</dd></div>` : ''}
      </dl></div>
      <div class="acoes" style="margin-top:16px">
        ${d.recibo_path ? '<button class="botao botao--leve" type="button" data-recibo>Ver o recibo</button>' : ''}
        <button class="botao botao--perigo-leve" type="button" data-apagar>Apagar despesa</button></div>`, (g) => {
      const r = g.querySelector('[data-recibo]');
      if (r) r.addEventListener('click', async () => {
        const janela = window.open('', '_blank');
        const { data, error } = await sb.storage.from('bb-recibos').createSignedUrl(d.recibo_path, 300);
        if (error) { if (janela) janela.close(); avisa(msgErro(error), true); return; }
        if (janela) janela.location = data.signedUrl; else location.href = data.signedUrl;
      });
      confirmaNoBotao(g.querySelector('[data-apagar]'), 'Toque de novo para apagar', async () => {
        if (!(await grava(sb.from('bb_despesas').delete().eq('id', d.id)))) return;
        if (d.recibo_path) await sb.storage.from('bb-recibos').remove([d.recibo_path]);
        fechaGaveta(); await atualiza(); avisa('Despesa apagada.');
      });
    });
  }

  // Foto do recibo: o painel reduz e comprime antes de subir (lado maior 1600 px).
  async function comprime(arquivo) {
    const img = await createImageBitmap(arquivo);
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    const blob = (t, q) => new Promise((r) => cv.toBlob(r, t, q));
    let b = await blob('image/webp', 0.72);
    if (!b || b.type !== 'image/webp') b = await blob('image/jpeg', 0.75); // Safari antigo não gera WebP
    return b;
  }

  // Categorias: as fixas e as que a Michele já criou em "Outros" (aparecem como opção da próxima vez).
  function categorias() {
    const fixas = CATEGORIAS.filter((c) => c !== 'Outros');
    const criadas = [...new Set(S.despesas.map((d) => d.categoria))].filter((c) => c && !CATEGORIAS.includes(c)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return fixas.concat(criadas, 'Outros');
  }

  function anotarDespesa() {
    let cat = null, foto = null;
    abreGaveta('Anotar despesa', `
      <label class="campo"><span>Quanto foi?</span><input class="valor-grande" type="text" inputmode="decimal" placeholder="R$ 0" data-valor autocomplete="off"></label>
      <div class="campo"><span>Com o quê?</span><div class="chips">${categorias().map((c) => `<button class="chip" type="button" aria-pressed="false" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
      <label class="campo" data-outro hidden><span>Outros: com o quê?</span><input type="text" data-outro-txt maxlength="40" placeholder="Ex.: Copos novos" autocomplete="off">
        <small>Vira uma opção nova na lista para as próximas despesas.</small></label>
      <label class="campo"><span>Quando?</span><input type="date" value="${iso(hoje())}" data-data></label>
      <label class="campo"><span>Foi de alguma lancha? <small style="font-weight:400;color:var(--suave)">(se quiser)</small></span><select data-lancha>${opcoes(S.lanchas, null, (x) => x.nome, 'Não, foi geral')}</select></label>
      <label class="campo"><span>Observação <small style="font-weight:400;color:var(--suave)">(se quiser)</small></span><input type="text" data-obs placeholder="Ex.: Posto da Barra"></label>
      <label class="botao botao--leve botao--cheio" style="margin-bottom:12px"><svg><use href="#p-foto"/></svg><span data-foto-txt>Tirar foto do recibo</span>
        <input type="file" accept="image/*" capture="environment" data-foto class="sr"></label>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Salvar despesa</button>`, (c) => {
      c.querySelector('[data-valor]').focus();
      chips(c, '[data-cat]', (b) => {
        cat = b.dataset.cat;
        c.querySelector('[data-outro]').hidden = cat !== 'Outros';
        if (cat === 'Outros') c.querySelector('[data-outro-txt]').focus();
      });
      c.querySelector('[data-foto]').addEventListener('change', (e) => { foto = e.target.files[0] || null; c.querySelector('[data-foto-txt]').textContent = foto ? 'Foto do recibo pronta' : 'Tirar foto do recibo'; });
      aoSalvar(c.querySelector('[data-salvar]'), async () => {
        const v = num(c.querySelector('[data-valor]').value);
        if (!v || !cat) return erroCampo(c, 'Escreva o valor e escolha com o quê.');
        if (cat === 'Outros') {
          const t = c.querySelector('[data-outro-txt]').value.trim().replace(/\s+/g, ' ');
          if (!t) return erroCampo(c, 'Escreva com o quê foi a despesa.');
          // "copos novos" e "Copos novos" viram a mesma categoria
          const igual = categorias().find((x) => x.toLowerCase() === t.toLowerCase());
          cat = igual && igual !== 'Outros' ? igual : t.charAt(0).toUpperCase() + t.slice(1);
        }
        erroCampo(c, '');
        const dia = c.querySelector('[data-data]').value || iso(hoje());
        let recibo = null;
        if (foto) {
          try {
            const b = await comprime(foto);
            const ext = b.type === 'image/webp' ? 'webp' : 'jpg';
            const caminho = `${dia.slice(0, 4)}/${dia.slice(5, 7)}/${crypto.randomUUID()}.${ext}`;
            const { error } = await sb.storage.from('bb-recibos').upload(caminho, b, { contentType: b.type });
            if (error) throw error;
            recibo = caminho;
          } catch (e) { console.error(e); return erroCampo(c, 'A foto do recibo não subiu. Tente de novo ou salve sem a foto.'); }
        }
        const ok = await grava(sb.from('bb_despesas').insert({ dia, categoria: cat, valor: v, lancha_id: c.querySelector('[data-lancha]').value || null, obs: c.querySelector('[data-obs]').value.trim() || null, recibo_path: recibo }));
        if (!ok) { if (recibo) await sb.storage.from('bb-recibos').remove([recibo]); return; }
        fechaGaveta(); await atualiza(); avisa(`Anotado: ${cat}, ${Rc(v)}.`);
      });
    });
  }

  /* ================= LANCHAS ================= */
  // As fotos moram no site (assets/...): o painel fica em /painel/, então sobe um nível.
  const foto = (u) => (u ? (/^https?:/.test(u) ? u : '..' + u) : '');

  function telaLanchas() {
    tela.innerHTML = `<header class="cab"><div><h1>Lanchas</h1><p>${lanchasAtivas().length} lanchas no site${S.lanchas.length > lanchasAtivas().length ? `, ${S.lanchas.length - lanchasAtivas().length} escondidas` : ''}. Toque numa para mudar os dados ou as fotos.</p></div>
        <button class="botao botao--principal" type="button" data-nova-lancha><svg><use href="#p-mais-um"/></svg>Cadastrar lancha</button></header>
      <div class="lanchas">${S.lanchas.map((l) => {
        const p = parceiro(l.parceiro_id);
        return `<a class="lancha-c${l.ativo ? '' : ' is-oculta'}" href="#lancha/${l.id}">
        ${l.capa_url ? `<img src="${esc(foto(l.capa_url))}" alt="" loading="lazy">` : '<span class="lancha-c__sem"><svg><use href="#p-foto"/></svg>Sem fotos</span>'}
        <div><b>${esc(l.nome)}</b><span>${l.passageiros} pessoas · ${esc(donoNome(l))}</span>
        ${!l.ativo ? '<span class="selo selo--neutro">Escondida do site</span>'
          : !p ? '<span class="selo selo--bom"><svg><use href="#p-ok"/></svg>Agenda no painel</span>'
          : p.agenda_tipo ? `<span class="selo selo--bom"><svg><use href="#p-ok"/></svg>Agenda ${p.agenda_tipo === 'manual' ? 'pelo WhatsApp' : 'do dono conectada'}</span>`
          : '<span class="selo selo--alerta">Agenda do dono não conectada</span>'}</div></a>`;
      }).join('')}</div>`;
  }

  // Regiões que já existem nas lanchas, mais as três da ilha.
  const regioes = () => [...new Set(['Leste da Ilha', 'Norte da Ilha', 'Sul da Ilha'].concat(S.lanchas.map((l) => l.regiao).filter(Boolean)))];
  const slugDe = (nome) => {
    const base = String(nome).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lancha';
    let s = base, n = 2;
    while (S.lanchas.some((l) => l.slug === s)) s = `${base}-${n++}`;
    return s;
  };
  const linhas = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);

  // Embarque e marinheiro de sempre da lancha (viram sugestão ao marcar o passeio).
  const camposEmbarque = (l, at) => `
      ${listaEmbarque(l.embarque_local || '', 'Local de embarque de sempre')}
      <div class="grade-2">
        <label class="campo"><span>Endereço do embarque <small style="font-weight:400;color:var(--suave)">(opcional)</small></span><input ${at}="embarque_local" value="${esc(l.embarque_local || '')}" placeholder="${esc(embPadrao().local)}"></label>
        <label class="campo"><span>Link do Google Maps <small style="font-weight:400;color:var(--suave)">(opcional)</small></span><input ${at}="embarque_maps" type="url" value="${esc(l.embarque_maps || '')}" placeholder="https://maps.app.goo.gl/..."></label>
        <label class="campo"><span>Horário de embarque</span><input ${at}="embarque_hora" type="time" value="${l.embarque_hora ? l.embarque_hora.slice(0, 5) : ''}"></label>
        <label class="campo"><span>Marinheiro de sempre</span><select ${at}="marinheiro_id">${opcoes(S.marinheiros.filter((x) => x.ativo || x.id === l.marinheiro_id), l.marinheiro_id, (x) => x.nome, 'Nenhum')}</select></label>
      </div>
      <p class="ajuda">Embarque vazio: vale o primeiro local da lista de Locais de embarque. Ao marcar um passeio, estes dados já vêm preenchidos e dá para mudar só naquele passeio.</p>`;
  const leEmbarque = (v) => {
    const maps = v('embarque_maps').trim();
    if (maps && !/^https?:\/\//.test(maps)) return [null, 'O link do mapa precisa começar com https://. Copie pelo botão "Compartilhar" do Google Maps.'];
    return [{ embarque_local: v('embarque_local').trim() || null, embarque_maps: maps || null, embarque_hora: v('embarque_hora') || null, marinheiro_id: v('marinheiro_id') || null }, null];
  };

  // Cadastrar lancha: nasce escondida do site até ter fotos; o dono (parceiro) já vem escolhido aqui.
  function novaLancha() {
    abreGaveta('Cadastrar lancha', `
      <div class="grade-2">
        <label class="campo"><span>Nome</span><input data-n="nome" placeholder="Ex.: Phantom 29 Bravo"></label>
        <label class="campo"><span>Quantas pessoas leva</span><input data-n="passageiros" inputmode="numeric"></label>
        <label class="campo"><span>Tamanho (pés)</span><input data-n="pes" inputmode="decimal"></label>
        <label class="campo"><span>Região</span><select data-n="regiao">${regioes().map((r) => `<option>${esc(r)}</option>`).join('')}</select></label>
      </div>
      <label class="campo"><span>De quem é</span><select data-n="parceiro_id">${opcoes(S.parceiros.filter((p) => p.ativo !== false && p.tipo !== 'revendedor'), null, (x) => x.nome, 'Própria (da Barra Boat)')}</select>
        <small class="caixas__ajuda">O parceiro não está na lista? Cadastre ele antes em Parceiros.</small></label>
      ${camposEmbarque({}, 'data-n')}
      <label class="campo"><span>Itens a bordo <small style="font-weight:400;color:var(--suave)">(um por linha)</small></span><textarea data-n="itens" rows="5" placeholder="Banheiro&#10;Som bluetooth&#10;Churrasqueira&#10;Tapete flutuante"></textarea></label>
      <p class="ajuda">A lancha começa escondida do site. Depois de salvar, adicione as fotos e mude "Mostrar no site" para sim.</p>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Cadastrar lancha</button>`, (g) => {
      g.querySelector('[data-n="nome"]').focus();
      ligaListaEmbarque(g, g.querySelector('[data-n="embarque_local"]'), g.querySelector('[data-n="embarque_maps"]'));
      aoSalvar(g.querySelector('[data-salvar]'), async () => {
        const v = (k) => g.querySelector(`[data-n="${k}"]`).value;
        const nome = v('nome').trim(), pax = parseInt(v('passageiros'), 10);
        if (!nome) return erroCampo(g, 'Escreva o nome da lancha.');
        if (!(pax > 0)) return erroCampo(g, 'Escreva quantas pessoas a lancha leva.');
        if (S.lanchas.some((l) => l.nome.toLowerCase() === nome.toLowerCase())) return erroCampo(g, 'Já existe uma lancha com esse nome.');
        const [emb, erroEmb] = leEmbarque(v);
        if (erroEmb) return erroCampo(g, erroEmb);
        const nova = await grava(sb.from('bb_lanchas').insert({ ...emb,
          nome, slug: slugDe(nome), passageiros: pax, pes: v('pes').trim() ? num(v('pes')) : null, regiao: v('regiao'),
          parceiro_id: v('parceiro_id') || null, itens: linhas(v('itens')), ativo: false,
          ordem: Math.max(0, ...S.lanchas.map((l) => l.ordem || 0)) + 1,
        }).select('id').single());
        if (!nova) return;
        fechaGaveta(); await atualiza(); location.hash = '#lancha/' + nova.id;
        avisa(`${nome} cadastrada. Agora adicione as fotos.`);
      });
    });
  }

  function telaLancha(id) {
    const l = lancha(id);
    if (!l) { location.hash = '#lanchas'; return; }
    const dono = parceiro(l.parceiro_id);
    const quem = dono ? primeiroNome(dono.nome) : 'dono';
    const ocupados = S.dono.filter((a) => a.lancha_id === l.id && a.origem !== 'manual' && a.dia >= iso(hoje())).length;
    const porLink = dono && ['google', 'planilha'].includes(dono.agenda_tipo);
    const varias = dono && S.lanchas.filter((x) => x.parceiro_id === dono.id).length > 1;
    const estado = !dono ? '<div class="estado"><svg><use href="#p-ok"/></svg>Lancha sua: a agenda é a deste painel.</div>'
      : `${estadoAgenda(dono)}${porLink ? `<p class="ajuda">Desta lancha: ${ocupados === 1 ? '1 dia ocupado' : ocupados + ' dias ocupados'} daqui para frente.</p>` : ''}`;
    const todas = Array.isArray(l.fotos) ? l.fotos : [];
    const fotos = (l.capa_url ? [{ url_p: l.capa_url, alt: 'Capa' }] : []).concat(todas.slice(0, l.capa_url ? 3 : 4));
    tela.innerHTML = `<a class="voltar" href="#lanchas"><svg><use href="#p-volta"/></svg>Lanchas</a>
      <header class="cab"><div><h1>${esc(l.nome)}</h1><p>${l.passageiros} pessoas${l.pes ? ` · ${String(l.pes).replace('.', ',')} pés` : ''} · ${esc(donoNome(l))}</p></div>
        <a class="botao botao--leve botao--pequeno" href="../lanchas/${esc(l.slug)}/" target="_blank" rel="noopener">Ver no site</a></header>
      <div class="lancha-topo">
        <section class="cartao"><h2 style="font-size:1.1rem;margin-bottom:12px">Fotos</h2>
          <div class="fotos">${fotos.map((f) => `<img src="${esc(foto(f.url_p || f.url))}" alt="${esc(f.alt || '')}" loading="lazy">`).join('') || '<p class="ajuda">Sem fotos ainda.</p>'}</div>
          <a class="botao botao--leve botao--cheio" href="#fotos/${l.id}" style="margin-top:14px"><svg><use href="#p-foto"/></svg>${todas.length ? `Ver e mudar as fotos (${todas.length})` : 'Adicionar fotos'}</a>
        </section>
        <section class="cartao agenda-dono"><h3><svg><use href="#p-agenda"/></svg>${dono ? `Agenda do ${esc(quem)}` : 'Agenda'}</h3>
          ${estado}
          ${dono ? `${porLink && varias ? `<label class="campo" style="margin-top:4px"><span>Nome desta lancha na agenda do ${esc(quem)}</span>
              <input data-l="agenda_palavra" value="${esc(l.agenda_palavra || '')}" placeholder="${esc(l.nome)}">
              <small class="caixas__ajuda">O ${esc(quem)} anota várias lanchas na mesma agenda. O evento que tiver este nome no título (ou na descrição) ocupa esta lancha. Vazio: vale o nome "${esc(l.nome)}". Para mais de um nome, separe com vírgula.</small></label>` : ''}
            <div class="acoes"><button class="botao botao--leve botao--cheio" type="button" data-pessoa="parceiros|${dono.id}">${dono.agenda_tipo ? `Ver a agenda do ${esc(quem)}` : `Conectar a agenda do ${esc(quem)}`}</button></div>`
            : '<p style="margin:0;color:var(--suave)">Os passeios que você marca na Agenda já aparecem no site.</p>'}
        </section>
      </div>
      <section class="bloco cartao"><h2 style="font-size:1.1rem;margin-bottom:14px">Dados da lancha</h2>
        <div class="grade-2">
          <label class="campo"><span>Nome</span><input data-l="nome" value="${esc(l.nome)}"></label>
          <label class="campo"><span>Quantas pessoas leva</span><input data-l="passageiros" inputmode="numeric" value="${l.passageiros}"></label>
          <label class="campo"><span>Tamanho (pés)</span><input data-l="pes" inputmode="decimal" value="${l.pes != null ? String(l.pes).replace('.', ',') : ''}"></label>
          <label class="campo"><span>Dono</span><select data-l="parceiro_id">${opcoes(S.parceiros, l.parceiro_id, (x) => x.nome, 'Própria (da Barra Boat)')}</select></label>
          <label class="campo"><span>Região</span><select data-l="regiao">${regioes().map((r) => `<option${r === l.regiao ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></label>
        </div>
        ${camposEmbarque(l, 'data-l')}
        <label class="campo"><span>Itens a bordo <small style="font-weight:400;color:var(--suave)">(um por linha)</small></span><textarea data-l="itens" rows="6">${esc((Array.isArray(l.itens) ? l.itens : []).join('\n'))}</textarea></label>
        <label class="campo"><span>Texto da lancha no site <small style="font-weight:400;color:var(--suave)">(se ficar vazio, o site escreve um com o tamanho e as pessoas)</small></span><textarea data-l="descricao" rows="3">${esc(l.descricao || '')}</textarea></label>
        <label class="campo"><span>Mostrar no site</span><select data-l="ativo"><option value="1"${l.ativo ? ' selected' : ''}>Sim, aparece no site</option><option value="0"${l.ativo ? '' : ' selected'}>Não, esconder por enquanto</option></select></label>
        <p class="ajuda">O site novo lê estes dados quando estiver no servidor. Na prévia de hoje, as páginas continuam como estão.</p>
        <button class="botao botao--principal" type="button" data-salvar-lancha>Salvar</button>
      </section>
      <section class="bloco cartao"><h2 style="font-size:1.1rem;margin-bottom:6px">Apagar a lancha</h2>
        <p style="margin:0 0 12px;color:var(--suave)">Foi vendida ou saiu da frota? Ela some do painel e do site. Se já teve passeios, o painel guarda o histórico e só esconde a lancha do site.</p>
        <button class="botao botao--perigo-leve" type="button" data-apagar-lancha>Apagar a ${esc(l.nome)}</button>
      </section>`;
    confirmaNoBotao(tela.querySelector('[data-apagar-lancha]'), 'Toque de novo para apagar', async () => {
      const { error } = await sb.from('bb_lanchas').delete().eq('id', l.id);
      if (error && error.code === '23503') {
        // tem passeio no histórico (o banco não deixa apagar): esconde e mantém os números
        if (!(await grava(sb.from('bb_lanchas').update({ ativo: false }).eq('id', l.id)))) return;
        await atualiza(); avisa(`A ${l.nome} tem passeios no histórico. Ela ficou escondida do site, com os números guardados.`);
        return;
      }
      if (error) { console.error(error); avisa(msgErro(error), true); return; }
      location.hash = '#lanchas'; await atualiza(); avisa(`${l.nome} apagada.`);
    });
    ligaListaEmbarque(tela, tela.querySelector('[data-l="embarque_local"]'), tela.querySelector('[data-l="embarque_maps"]'));
    // nome na agenda do dono: grava ao sair do campo (a leitura seguinte já reparte com o nome novo)
    const palavra = tela.querySelector('[data-l="agenda_palavra"]');
    if (palavra) palavra.addEventListener('change', async () => {
      const novo = palavra.value.trim() || null;
      if (novo === (l.agenda_palavra || null)) return;
      if (!(await grava(sb.from('bb_lanchas').update({ agenda_palavra: novo }).eq('id', l.id)))) return;
      l.agenda_palavra = novo;
      avisa('Nome na agenda salvo. Na próxima leitura (até 15 minutos) os dias desta lancha são refeitos.');
    });
    aoSalvar(tela.querySelector('[data-salvar-lancha]'), async () => {
      const v = (k) => tela.querySelector(`[data-l="${k}"]`).value;
      const pax = parseInt(v('passageiros'), 10);
      if (!v('nome').trim() || !(pax > 0)) { avisa('Preencha o nome e quantas pessoas a lancha leva.', true); return; }
      if (!l.ativo && v('ativo') === '1' && !l.capa_url && !(Array.isArray(l.fotos) && l.fotos.length)) { avisa('Adicione pelo menos uma foto antes de mostrar a lancha no site.', true); return; }
      const [emb, erroEmb] = leEmbarque(v);
      if (erroEmb) { avisa(erroEmb, true); return; }
      const dados = { ...emb, nome: v('nome').trim(), passageiros: pax, pes: v('pes').trim() ? num(v('pes')) : null, parceiro_id: v('parceiro_id') || null, ativo: v('ativo') === '1',
        regiao: v('regiao'), itens: linhas(v('itens')), descricao: v('descricao').trim() || null };
      const ok = await grava(sb.from('bb_lanchas').update(dados).eq('id', l.id));
      if (!ok) return;
      api('fotos.php', { acao: 'cache' });   // o site mostra o nome e o número de pessoas novos na hora
      await atualiza(); avisa('Lancha salva.');
    });
  }

  /* ---------- fotos da lancha ---------- */
  // Reduz no navegador (foto de celular tem 12 MP) e acerta a rotação; o servidor recorta e gera os WebP.
  async function preparaFoto(arq) {
    let img;
    try { img = await createImageBitmap(arq); } catch (e) {
      img = await new Promise((ok, falha) => { const i = new Image(); i.onload = () => ok(i); i.onerror = falha; i.src = URL.createObjectURL(arq); });
    }
    const w = img.width || img.naturalWidth, h = img.height || img.naturalHeight;
    const k = Math.min(1, 2400 / Math.max(w, h));
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    return new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.92));
  }

  // Grava a lista na ordem da tela; a legenda segue a posição ("Phantom 29, foto 3").
  async function salvaFotos(l, lista) {
    // o servidor pode ter trocado uma foto pela versão melhorada (-ia) enquanto a tela estava aberta:
    // relê o banco e fica com a versão de lá, para não gravar de volta um arquivo que já foi apagado
    const { data: atual } = await sb.from('bb_lanchas').select('fotos').eq('id', l.id).maybeSingle();
    const raiz = (u) => String(u || '').replace(/-ia\.webp$/, '.webp');
    const doBanco = new Map(((atual && atual.fotos) || []).map((f) => [raiz(f.url), f]));
    const fotos = lista.map((f, i) => Object.assign({}, doBanco.get(raiz(f.url)) || f, { alt: `${l.nome}, foto ${i + 1}` }));
    return grava(sb.from('bb_lanchas').update({ fotos }).eq('id', l.id));
  }

  // A primeira foto é sempre a capa (lista de lanchas do site e compartilhamento).
  // Depois de mudar a ordem, apagar ou enviar, se a primeira mudou, a capa é refeita a partir dela.
  async function capaDaPrimeira(l, lista) {
    const primeira = lista[0];
    if (!primeira) return true;
    const r = await api('fotos.php', { acao: 'capa', lancha_id: l.id, url: primeira.url, antiga: l.capa_url });
    if (!r.ok) { avisa(r.erro || 'Não consegui trocar a capa.', true); return false; }
    return !!(await grava(sb.from('bb_lanchas').update({ capa_url: r.capa_url }).eq('id', l.id)));
  }

  const fotoSel = new Set();   // fotos marcadas para apagar em massa (pela url)

  function telaFotos(id) {
    const l = lancha(id);
    if (!l) { location.hash = '#lanchas'; return; }
    const fotos = Array.isArray(l.fotos) ? l.fotos : [];
    document.querySelectorAll('.fotos-grade__fantasma').forEach((x) => x.remove());   // sobra de um arraste anterior
    for (const u of [...fotoSel]) if (!fotos.some((f) => f.url === u)) fotoSel.delete(u);
    const fila = fotos.filter((f) => f.melhorar).length;
    tela.innerHTML = `<a class="voltar" href="#lancha/${l.id}"><svg><use href="#p-volta"/></svg>${esc(l.nome)}</a>
      <header class="cab"><div><h1>Fotos da ${esc(l.nome)}</h1><p>Arraste para mudar a ordem. A primeira foto é a capa e abre a galeria do site.</p></div>
        <label class="botao botao--principal"><svg><use href="#p-foto"/></svg>Adicionar fotos<input type="file" accept="image/*" multiple data-arquivos class="sr"></label></header>
      <p class="ajuda" data-progresso hidden></p>
      ${fila ? `<p class="ajuda">${fila === 1 ? '1 foto está pequena e vai' : fila + ' fotos estão pequenas e vão'} para a melhoria com inteligência artificial. Enquanto isso, ${fila === 1 ? 'ela aparece no site como chegou' : 'elas aparecem no site como chegaram'}.</p>` : ''}
      <div class="fotos-barra" data-barra hidden>
        <span data-barra-txt></span>
        <button class="botao botao--leve botao--pequeno" type="button" data-desmarcar>Desmarcar</button>
        <button class="botao botao--perigo-leve botao--pequeno" type="button" data-apagar-sel>Apagar as selecionadas</button>
      </div>
      ${fotos.length ? `<ol class="fotos-grade" data-grade>${fotos.map((f, i) => `<li class="fotos-grade__item${fotoSel.has(f.url) ? ' is-sel' : ''}" data-i="${i}">
          <button class="fotos-grade__abre" type="button" data-foto-i="${i}" aria-label="Foto ${i + 1}${i === 0 ? ', capa' : ''}. Arraste para mudar a ordem; Alt e as setas também movem.">
            <img src="${esc(foto(f.url_p || f.url))}" alt="" loading="lazy" draggable="false"></button>
          <span class="fotos-grade__n${i === 0 ? ' is-capa' : ''}">${i === 0 ? 'Capa' : i + 1}</span>
          ${f.melhorar ? '<span class="fotos-grade__selo">vai melhorar</span>' : ''}
          <label class="fotos-grade__marca"><input type="checkbox" data-sel="${i}"${fotoSel.has(f.url) ? ' checked' : ''}><span class="sr">Selecionar a foto ${i + 1}</span></label>
        </li>`).join('')}</ol>`
        : '<p class="cartao vazio">Sem fotos ainda. Toque em "Adicionar fotos" e escolha as fotos no celular ou no computador.</p>'}
      <p class="ajuda" style="margin-top:14px">Pode mandar a foto como saiu do celular: o painel recorta em quadrado e deixa leve para o site. No celular, segure a foto um instante e arraste.</p>`;
    tela.querySelector('[data-arquivos]').addEventListener('change', (e) => { const arqs = [...e.target.files]; e.target.value = ''; if (arqs.length) enviaFotos(l, arqs); });
    const grade = tela.querySelector('[data-grade]');
    if (!grade) return;

    // seleção para apagar em massa
    const pintaBarra = () => {
      const n = fotoSel.size;
      tela.querySelector('[data-barra]').hidden = !n;
      tela.querySelector('[data-barra-txt]').textContent = n === 1 ? '1 foto selecionada' : `${n} fotos selecionadas`;
    };
    grade.querySelectorAll('[data-sel]').forEach((cx) => cx.addEventListener('change', () => {
      const f = fotos[Number(cx.dataset.sel)];
      if (cx.checked) fotoSel.add(f.url); else fotoSel.delete(f.url);
      cx.closest('li').classList.toggle('is-sel', cx.checked);
      pintaBarra();
    }));
    tela.querySelector('[data-desmarcar]').addEventListener('click', () => { fotoSel.clear(); telaFotos(id); });
    confirmaNoBotao(tela.querySelector('[data-apagar-sel]'), 'Toque de novo para apagar', async () => {
      const sai = fotos.filter((f) => fotoSel.has(f.url));
      const fica = fotos.filter((f) => !fotoSel.has(f.url));
      if (!(await salvaFotos(l, fica))) return;
      for (const f of sai) await api('fotos.php', { acao: 'apagar', lancha_id: l.id, url: f.url });
      fotoSel.clear();
      if (fica[0] && (!fotos[0] || fotos[0].url !== fica[0].url)) await capaDaPrimeira(l, fica);
      await api('fotos.php', { acao: 'cache' });
      await atualiza();
      avisa(sai.length === 1 ? 'Foto apagada.' : `${sai.length} fotos apagadas.`);
    });
    pintaBarra();

    // nova ordem: grava, refaz a capa se a primeira mudou e avisa o site
    const salvaOrdem = async (nova) => {
      if (nova.every((f, i) => f.url === fotos[i].url)) return;
      grade.classList.add('is-salvando');   // até gravar, não deixa arrastar de novo (duas ordens brigando)
      if (!(await salvaFotos(l, nova))) { telaFotos(id); return; }
      if (nova[0].url !== fotos[0].url) await capaDaPrimeira(l, nova);
      await api('fotos.php', { acao: 'cache' });
      await atualiza();
      avisa(nova[0].url !== fotos[0].url ? 'Ordem salva. A primeira foto virou a capa.' : 'Ordem salva.');
    };

    // arrastar: mouse começa ao mover 6 px; dedo começa depois de segurar 250 ms (antes disso, é rolagem da tela)
    let arr = null;
    const itens = () => [...grade.querySelectorAll('.fotos-grade__item')];
    grade.addEventListener('pointerdown', (e) => {
      const li = e.target.closest('.fotos-grade__item');
      if (!li || e.target.closest('.fotos-grade__marca') || e.button > 0) return;
      if (arr) desfaz(arr);
      const ini = { x: e.clientX, y: e.clientY, li, id: e.pointerId, toque: e.pointerType !== 'mouse', ativo: false, t: null };
      if (ini.toque) ini.t = setTimeout(() => comeca(ini, ini.x, ini.y), 250);
      arr = ini;
    });
    const comeca = (a, x, y) => {
      if (!arr || arr !== a) return;
      a.ativo = true;
      const r = a.li.getBoundingClientRect();
      a.dx = x - r.left; a.dy = y - r.top;
      a.fantasma = a.li.cloneNode(true);
      a.fantasma.classList.add('fotos-grade__fantasma');
      Object.assign(a.fantasma.style, { width: r.width + 'px', height: r.height + 'px', left: r.left + 'px', top: r.top + 'px' });
      document.body.appendChild(a.fantasma);
      a.li.classList.add('is-arrastando');
      try { grade.setPointerCapture(a.id); } catch (e) { /* sem captura, segue */ }
      if (navigator.vibrate && a.toque) navigator.vibrate(15);
    };
    grade.addEventListener('pointermove', (e) => {
      const a = arr;
      if (!a || e.pointerId !== a.id) return;
      // o botão do mouse foi solto fora da tela (o pointerup se perdeu): termina aqui
      if (e.pointerType === 'mouse' && e.buttons === 0) { solta(); return; }
      if (!a.ativo) {
        const longe = Math.hypot(e.clientX - a.x, e.clientY - a.y) > (a.toque ? 10 : 6);
        if (!longe) return;
        if (a.toque) { clearTimeout(a.t); arr = null; return; }   // dedo andou antes de segurar: é rolagem
        comeca(a, a.x, a.y);
      }
      e.preventDefault();
      a.fantasma.style.left = (e.clientX - a.dx) + 'px';
      a.fantasma.style.top = (e.clientY - a.dy) + 'px';
      // troca de lugar com a foto que está embaixo do dedo/mouse
      const alvo = itens().find((x) => { if (x === a.li) return false; const r = x.getBoundingClientRect(); return e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom; });
      if (alvo) {
        const lista = itens();
        grade.insertBefore(a.li, lista.indexOf(alvo) > lista.indexOf(a.li) ? alvo.nextSibling : alvo);
        itens().forEach((x, k) => { const n = x.querySelector('.fotos-grade__n'); n.textContent = k ? k + 1 : 'Capa'; n.classList.toggle('is-capa', !k); });
      }
      // perto da borda da tela, rola sozinho
      if (e.clientY < 70) window.scrollBy(0, -12); else if (e.clientY > innerHeight - 70) window.scrollBy(0, 12);
    }, { passive: false });
    // tira o fantasma e a marca de arraste (também quando o arraste se perde no meio)
    const desfaz = (a) => {
      clearTimeout(a.t);
      if (a.fantasma) a.fantasma.remove();
      a.li.classList.remove('is-arrastando');
    };
    const solta = () => {
      const a = arr; arr = null;
      if (!a) return;
      desfaz(a);
      if (!a.ativo) return;
      grade.ultimoArraste = Date.now();
      salvaOrdem(itens().map((x) => fotos[Number(x.dataset.i)]));
    };
    grade.addEventListener('pointerup', solta);
    grade.addEventListener('pointercancel', solta);
    grade.addEventListener('lostpointercapture', solta);
    // o pointerup pode cair fora da grade (soltou longe, captura recusada): a janela também escuta
    const fora = () => { if (!document.contains(grade)) { removeEventListener('pointerup', fora); removeEventListener('blur', fora); return; } solta(); };
    addEventListener('pointerup', fora);
    addEventListener('blur', fora);
    // no celular, enquanto arrasta, a tela não rola (sem isso o navegador cancela o arraste)
    grade.addEventListener('touchmove', (e) => { if (arr && arr.ativo) e.preventDefault(); }, { passive: false });
    grade.addEventListener('contextmenu', (e) => { if (arr && arr.toque) e.preventDefault(); });   // segurar no celular não abre o menu da imagem

    // toque simples abre a foto; um clique que terminou um arraste não abre
    grade.querySelectorAll('[data-foto-i]').forEach((b) => b.addEventListener('click', (e) => {
      if (Date.now() - (grade.ultimoArraste || 0) < 400) return;
      abreFoto(l, Number(b.dataset.fotoI));
    }));
    // teclado: Alt + seta move a foto em foco
    grade.addEventListener('keydown', (e) => {
      const b = e.target.closest('[data-foto-i]');
      if (!b || !e.altKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const i = Number(b.dataset.fotoI), para = i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1);
      if (para < 0 || para >= fotos.length) return;
      const nova = fotos.slice(); const [x] = nova.splice(i, 1); nova.splice(para, 0, x);
      salvaOrdem(nova).then(() => { const f = tela.querySelector(`[data-foto-i="${para}"]`); if (f) f.focus(); });
    });
  }

  async function enviaFotos(l, arqs) {
    const prog = tela.querySelector('[data-progresso]');
    const entrada = tela.querySelector('[data-arquivos]');
    entrada.disabled = true;
    const antes = (Array.isArray(l.fotos) ? l.fotos : []).slice();
    let lista = antes.slice();
    let foram = 0, pequenas = 0;
    const erros = [];
    for (let i = 0; i < arqs.length; i++) {
      prog.hidden = false; prog.textContent = `Enviando a foto ${i + 1} de ${arqs.length}. Não feche esta tela.`;
      let blob;
      try { blob = await preparaFoto(arqs[i]); } catch (e) { erros.push(`${arqs[i].name}: esse formato não abre aqui. Envie em JPG.`); continue; }
      const fd = new FormData();
      fd.append('acao', 'enviar'); fd.append('lancha_id', l.id); fd.append('foto', blob, 'foto.jpg');
      const r = await api('fotos.php', fd);
      if (!r.ok) { erros.push(r.erro || 'Não deu certo.'); if (/só funciona/.test(r.erro || '')) break; continue; }
      lista.push(r.foto); foram++; if (r.foto.melhorar) pequenas++;
      // grava a cada foto: se a internet cair no meio, as que já subiram ficam
      if (!(await salvaFotos(l, lista))) break;
    }
    // lancha que estava sem fotos: a primeira enviada vira a capa
    if (foram && !antes.length) await capaDaPrimeira(l, lista);
    if (foram) await api('fotos.php', { acao: 'cache' });
    await atualiza();
    if (foram) avisa(`${foram === 1 ? '1 foto adicionada' : foram + ' fotos adicionadas'}.${pequenas ? ` ${pequenas === 1 ? '1 estava pequena e vai' : pequenas + ' estavam pequenas e vão'} para a melhoria com IA.` : ''}`);
    if (erros.length) setTimeout(() => avisa(erros[0] + (erros.length > 1 ? ` (e mais ${erros.length - 1})` : ''), true), foram ? 2900 : 0);
  }

  function abreFoto(l, i) {
    const fotos = (Array.isArray(l.fotos) ? l.fotos : []).slice();
    const f = fotos[i];
    if (!f) return;
    abreGaveta(`Foto ${i + 1} de ${fotos.length}${i === 0 ? ' (capa)' : ''}`, `
      <img class="foto-grande" src="${esc(foto(f.url))}" alt="">
      ${f.melhorar ? '<p class="ajuda">Foto pequena: vai para a melhoria com inteligência artificial.</p>' : ''}
      <p class="ajuda" style="margin-top:12px">Para mudar a ordem, feche e arraste a foto na lista. A primeira é a capa.</p>
      <section class="bloco"><button class="botao botao--perigo-leve" type="button" data-apagar-foto>Apagar esta foto</button></section>`, (c) => {
      confirmaNoBotao(c.querySelector('[data-apagar-foto]'), 'Toque de novo para apagar', async () => {
        fotos.splice(i, 1);
        if (!(await salvaFotos(l, fotos))) return;
        await api('fotos.php', { acao: 'apagar', lancha_id: l.id, url: f.url });
        if (i === 0 && fotos[0]) await capaDaPrimeira(l, fotos);
        fotoSel.delete(f.url);
        await api('fotos.php', { acao: 'cache' });
        fechaGaveta(); await atualiza(); avisa(i === 0 && fotos[0] ? 'Foto apagada. A próxima virou a capa.' : 'Foto apagada.');
      });
    });
  }

  /* ---------- agenda do parceiro ----------
     O link é do parceiro: ele anota todas as lanchas dele na mesma agenda. O servidor reparte cada
     evento pela lancha cujo nome está no título (ou na descrição); sem nome, ocupa todas as dele
     (agenda_sem_nome = 'todas') ou nenhuma. Parceiro com uma lancha só: todo evento é dela. */
  function estadoAgenda(p) {
    const quem = primeiroNome(p.nome) || 'dono';
    const lidaEm = p.agenda_lida_at ? new Date(p.agenda_lida_at) : null;
    const lida = lidaEm ? `Lida pela última vez em ${ddIso(iso(lidaEm))} às ${lidaEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. O painel lê de novo sozinho a cada 15 minutos.` : 'Ainda não foi lida. O painel lê sozinho a cada 15 minutos, ou toque em "Ler agora".';
    const erro = p.agenda_erro ? `<div class="alerta"><div><b>A última leitura não deu certo.</b><p style="margin:2px 0 0">${esc(p.agenda_erro)}</p></div></div>` : '';
    return p.agenda_tipo === 'google' ? `<div class="estado"><svg><use href="#p-ok"/></svg>Conectada ao Google Agenda do ${esc(quem)}.</div><p class="ajuda">${esc(lida)}</p>${erro}`
      : p.agenda_tipo === 'planilha' ? `<div class="estado"><svg><use href="#p-ok"/></svg>Conectada à planilha do ${esc(quem)}.</div><p class="ajuda">${esc(lida)}</p>${erro}`
      : p.agenda_tipo === 'manual' ? `<div class="estado"><svg><use href="#p-ok"/></svg>O ${esc(quem)} avisa pelo WhatsApp e você marca na Agenda.</div>`
      : '<div class="estado estado--sem">Agenda ainda não conectada. Enquanto isso, os dias ocupados das lanchas dele não aparecem no site.</div>';
  }

  // Bloco "Agenda dele" dentro do cadastro do parceiro.
  function blocoAgenda(p) {
    const dele = S.lanchas.filter((l) => l.parceiro_id === p.id);
    const quem = primeiroNome(p.nome) || 'dono';
    const porLink = ['google', 'planilha'].includes(p.agenda_tipo);
    const nomes = dele.map((l) => `<li><a href="#lancha/${l.id}">${esc(l.nome)}</a>: <b>${esc(l.agenda_palavra || l.nome)}</b></li>`).join('');
    return `<section class="agenda-parceiro" data-bloco-agenda><h3><svg><use href="#p-agenda"/></svg>Agenda do ${esc(quem)}</h3>
      ${estadoAgenda(p)}
      ${porLink && dele.length > 1 ? `<p class="ajuda" style="margin-bottom:4px">Ele anota as ${dele.length} lanchas na mesma agenda. Cada evento vai para a lancha cujo nome está no título:</p>
        <ul class="nomes-agenda">${nomes}</ul>
        <label class="campo"><span>Evento sem nome de lancha</span><select data-sem-nome>
          <option value="todas"${p.agenda_sem_nome !== 'nenhuma' ? ' selected' : ''}>Ocupa todas as lanchas dele (mais seguro)</option>
          <option value="nenhuma"${p.agenda_sem_nome === 'nenhuma' ? ' selected' : ''}>Não ocupa nenhuma</option></select></label>` : ''}
      ${!dele.length && p.agenda_tipo ? '<p class="ajuda">Marque acima as lanchas dele para a agenda valer.</p>' : ''}
      <div class="acoes">${porLink ? `<button class="botao botao--principal botao--cheio" type="button" data-ler-agora="${p.id}">Ler agora</button>` : ''}
        <button class="botao ${p.agenda_tipo ? 'botao--leve' : 'botao--principal'} botao--cheio" type="button" data-conectar="${p.id}">${p.agenda_tipo ? 'Trocar a agenda conectada' : 'Conectar a agenda dele'}</button>
        <button class="botao botao--wa botao--cheio" type="button" data-instrucoes="${p.id}"><svg><use href="#p-wa"/></svg>Mandar instruções ao ${esc(quem)}</button></div>
    </section>`;
  }

  function conectarAgenda(id) {
    const p = parceiro(id), quem = primeiroNome(p.nome) || 'dono';
    abreGaveta(`Agenda do ${quem}`, `
      <p style="margin-top:0">Como o ${esc(quem)} anota os dias ocupados das lanchas dele?</p>
      <div class="escolhas">
        <button class="escolha" type="button" data-tipo="google"><span class="linha__icone"><svg><use href="#p-agenda"/></svg></span><span><b>No Google Agenda</b><span>O mais comum. Ele te manda um link e você cola aqui.</span></span></button>
        <button class="escolha" type="button" data-tipo="planilha"><span class="linha__icone"><svg><use href="#p-mais"/></svg></span><span><b>Numa planilha do Google</b><span>Ele publica a planilha e te manda o link.</span></span></button>
        <button class="escolha" type="button" data-tipo="manual"><span class="linha__icone"><svg><use href="#p-wa"/></svg></span><span><b>Ele me avisa pelo WhatsApp</b><span>Você marca os dias dele na Agenda do painel.</span></span></button>
      </div>`, (c) => {
      c.querySelectorAll('[data-tipo]').forEach((b) => b.addEventListener('click', async () => {
        if (b.dataset.tipo !== 'manual') { colarLink(p, b.dataset.tipo); return; }
        if (!(await grava(sb.from('bb_parceiros').update({ agenda_tipo: 'manual', agenda_url: null, agenda_erro: null }).eq('id', p.id)))) return;
        await atualiza(); editaPessoa('parceiros', p.id); avisa('Pronto. Marque os dias dele na Agenda.');
      }));
    });
  }

  function colarLink(p, tipo) {
    const google = tipo === 'google';
    abreGaveta(google ? 'Colar o link do Google Agenda' : 'Colar o link da planilha', `
      <ol class="passos">${google
        ? '<li>O dono abre o Google Agenda no computador e vai em Configurações.</li><li>Clica no nome da agenda onde anota as lanchas, em "Integrar agenda".</li><li>Copia o "Endereço secreto no formato iCal" e te manda pelo WhatsApp.</li>'
        : '<li>O dono abre a planilha e vai em Arquivo, Compartilhar, Publicar na Web.</li><li>Escolhe "Valores separados por vírgula (.csv)" e clica em Publicar.</li><li>Copia o link e te manda pelo WhatsApp.</li>'}</ol>
      ${google ? '' : '<p class="ajuda">Como o painel lê a planilha: cada linha com uma data (23/11/2026) é um dia ocupado. Duas datas na mesma linha viram um período. Linhas com "livre" ou "cancelado" ficam de fora. O nome da lancha na linha diz de qual lancha é.</p>'}
      <label class="campo"><span>Cole aqui o link que ele mandou</span><input type="url" data-link placeholder="${google ? 'https://calendar.google.com/calendar/ical/...' : 'https://docs.google.com/spreadsheets/...'}"></label>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Conectar</button>
      <button class="botao botao--wa botao--cheio" type="button" data-instrucoes="${p.id}" style="margin-top:10px"><svg><use href="#p-wa"/></svg>Mandar estas instruções ao dono</button>`, (c) => {
      aoSalvar(c.querySelector('[data-salvar]'), async () => {
        const v = c.querySelector('[data-link]').value.trim();
        const ok = google ? /^https:\/\/calendar\.google\.com\/calendar\/ical\/.+\.ics$/.test(v) || /^https:\/\/.+\.ics(\?.*)?$/.test(v) : /^https:\/\/docs\.google\.com\/spreadsheets\//.test(v);
        if (!ok) return erroCampo(c, google ? 'Esse link não parece o certo. Ele começa com https://calendar.google.com/calendar/ical/ e termina com .ics. Peça de novo ao dono.' : 'Esse link não parece o certo. Ele começa com https://docs.google.com/spreadsheets/. Peça de novo ao dono.');
        if (!(await grava(sb.from('bb_parceiros').update({ agenda_tipo: tipo, agenda_url: v, agenda_erro: null, agenda_lida_at: null }).eq('id', p.id)))) return;
        await atualiza(); editaPessoa('parceiros', p.id); avisa('Agenda conectada. Lendo os dias ocupados.');
        await lerAgora(p.id, true);
      });
    });
  }

  // Lê na hora a agenda do parceiro (api/agenda.php, só no servidor). O cron faz o mesmo a cada 15 min.
  async function lerAgora(id, logoAposConectar) {
    const p = parceiro(id);
    let r;
    try {
      const { data: { session } } = await sb.auth.getSession();
      const resp = await fetch('../api/agenda.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ((session && session.access_token) || '') },
        body: JSON.stringify({ parceiro_id: id }),
      });
      r = await resp.json();
    } catch (e) {
      // prévia sem PHP (GitHub Pages) ou sem internet
      if (!logoAposConectar) avisa('A leitura na hora só funciona no site novo. Lá o painel lê sozinho a cada 15 minutos.', true);
      return;
    }
    await atualiza();
    if (!gaveta.hidden && $('[data-bloco-agenda]')) editaPessoa('parceiros', id);
    if (r.ok) {
      const partes = Object.entries(r.lanchas || {}).map(([n, k]) => `${n}: ${k}`);
      avisa(`Agenda do ${primeiroNome(p && p.nome) || 'dono'} lida: ${partes.length > 1 ? partes.join(', ') + ' dias ocupados' : (r.total === 1 ? '1 dia ocupado' : r.total + ' dias ocupados')}.`);
    } else avisa(r.erro || 'Não consegui ler a agenda agora.', true);
  }

  function instrucoes(id) {
    const dono = parceiro(id);
    const dele = S.lanchas.filter((l) => l.parceiro_id === id).map((l) => l.agenda_palavra ? l.agenda_palavra.split(',')[0].trim() : l.nome);
    const nomes = dele.length > 1 ? dele.slice(0, -1).join(', ') + ' ou ' + dele[dele.length - 1] : dele[0];
    let txt = `Oi, ${primeiroNome(dono && dono.nome) || 'tudo bem'}! Para os dias ocupados ${dele.length > 1 ? 'das suas lanchas' : 'da sua lancha'} aparecerem no site da Barra Boat, preciso do link da sua agenda. É rapidinho: abra o Google Agenda no computador, vá em Configurações, clique na agenda onde você anota as lanchas, depois em "Integrar agenda", e copie o "Endereço secreto no formato iCal". Me manda aqui. Esse link só deixa a gente ver os dias ocupados dessa agenda: não dá acesso ao seu e-mail nem a nada mais da sua conta.`;
    if (dele.length > 1) txt += ` Ao marcar uma reserva, escreva o nome da lancha no título do evento (${nomes}), assim o site sabe qual lancha está ocupada.`;
    const num2 = String((dono && dono.telefone) || '').replace(/\D/g, '');
    abreGaveta('Mensagem para o dono', `
      <p style="margin-top:0">Esta mensagem vai pronta no WhatsApp. Você pode mudar antes de enviar.</p>
      <div class="conversa"><div class="msg msg--nos">${esc(txt)}</div></div>
      <a class="botao botao--wa botao--cheio" href="https://wa.me/${num2}?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener" style="margin-top:16px"><svg><use href="#p-wa"/></svg>Abrir no WhatsApp</a>
      ${num2 ? '' : '<p class="ajuda" style="margin-top:12px">O dono não tem telefone cadastrado. O WhatsApp vai pedir para escolher o contato.</p>'}`);
  }

  /* ================= PARCEIROS E MARINHEIROS ================= */
  function telaPessoas(tipo) {
    const parc = tipo === 'parceiros';
    const lista = parc ? S.parceiros : S.marinheiros;
    tela.innerHTML = `<header class="cab"><div><h1>${parc ? 'Parceiros' : 'Marinheiros'}</h1><p>${parc ? 'Donos das lanchas de parceiros e quem vende passeios para vocês.' : 'Quem leva os passeios. Aparece na agenda e no dia do passeio.'}</p></div>
        <button class="botao botao--principal" type="button" data-pessoa="${tipo}|"><svg><use href="#p-mais-um"/></svg>Cadastrar</button></header>
      <ul class="lista">${lista.map((x) => {
        const lanchasDele = parc ? S.lanchas.filter((l) => l.parceiro_id === x.id).map((l) => l.nome) : [];
        const agenda = parc && lanchasDele.length ? ({ google: 'agenda conectada', planilha: 'planilha conectada', manual: 'avisa pelo WhatsApp' }[x.agenda_tipo] || 'agenda não conectada') : '';
        const sub = [foneTela(x.telefone), parc ? { dono: 'Dono de lancha', revendedor: 'Vende passeios', ambos: 'Dono e vende' }[x.tipo] : '', lanchasDele.join(', '), agenda, x.ativo ? '' : 'inativo'].filter(Boolean).join(' · ');
        return `<li><button class="linha" type="button" data-pessoa="${tipo}|${x.id}"><span class="avatar">${esc((x.nome || '?')[0].toUpperCase())}</span>
          <span class="linha__corpo"><b>${esc(x.nome)}${seloExemplo(x)}</b><span>${esc(sub || 'sem telefone')}</span></span><svg><use href="#p-seta"/></svg></button></li>`;
      }).join('') || vazio(parc ? 'Nenhum parceiro cadastrado ainda.' : 'Nenhum marinheiro cadastrado ainda.')}</ul>`;
  }

  // Parceiro: o que ele faz e com quais lanchas.
  //  - dono (ou "os dois"): a lancha fica no nome dele (bb_lanchas.parceiro_id): cor na agenda, agenda do dono.
  //    Vale também para quem cuida da lancha de outra pessoa.
  //  - vende passeios (ou "os dois"): bb_parceiro_lanchas, as lanchas que ele pode oferecer (e, no acesso
  //    de parceiro, as que ele vai enxergar).
  function editaPessoa(tipo, id) {
    const parc = tipo === 'parceiros';
    const tabela = parc ? 'bb_parceiros' : 'bb_marinheiros';
    const x = (parc ? S.parceiros : S.marinheiros).find((y) => y.id === id) || { ativo: true, tipo: 'dono' };
    let papel = x.tipo || 'dono';
    const dele = new Set(id ? S.lanchas.filter((l) => l.parceiro_id === id).map((l) => l.id) : []);
    const vende = new Set(id ? S.vende.filter((v) => v.parceiro_id === id).map((v) => v.lancha_id) : []);
    const caixas = (nome, sel) => `<div class="caixas">${S.lanchas.map((l) => {
      const outro = nome === 'dele' && l.parceiro_id && l.parceiro_id !== id ? parceiro(l.parceiro_id) : null;
      return `<label class="caixa"><input type="checkbox" data-${nome}="${l.id}"${sel.has(l.id) ? ' checked' : ''}>
        <span>${esc(l.nome)}${outro ? `<small>hoje com ${esc(primeiroNome(outro.nome))}</small>` : ''}${l.ativo ? '' : '<small>escondida do site</small>'}</span></label>`;
    }).join('')}</div>`;
    const usos = id && !parc ? S.passeios.filter((p) => p.marinheiro_id === id).length : 0;
    const avisoApagar = parc
      ? (dele.size ? `Ao apagar, ${dele.size === 1 ? 'a lancha dele volta' : `as ${dele.size} lanchas dele voltam`} a aparecer como próprias.` : 'Ao apagar, ele sai da lista de parceiros.')
      : (usos ? `Ele está em ${usos} ${usos === 1 ? 'passeio' : 'passeios'}. Ao apagar, ${usos === 1 ? 'esse passeio fica' : 'esses passeios ficam'} com o marinheiro "a definir".` : 'Ao apagar, ele sai da lista de marinheiros.');
    abreGaveta(id ? x.nome : parc ? 'Novo parceiro' : 'Novo marinheiro', `
      ${exemplo(x) ? '<p class="selo selo--neutro" style="white-space:normal;margin:0 0 14px">Cadastro de exemplo: será apagado antes do lançamento. Cadastre os seus em vez de mudar este.</p>' : ''}
      <div class="grade-2">
        <label class="campo"><span>Nome</span><input data-nome value="${esc(x.nome || '')}"></label>
        <label class="campo"><span>WhatsApp</span><input data-fone inputmode="tel" value="${esc(foneTela(x.telefone))}" placeholder="(48) 99999-9999"></label>
      </div>
      ${parc ? `<div class="campo"><span>O que ele faz?</span><div class="chips">${[['dono', 'Dono de lancha'], ['revendedor', 'Vende passeios'], ['ambos', 'Os dois']].map(([v, n]) => `<button class="chip" type="button" aria-pressed="${v === papel}" data-papel="${v}">${n}</button>`).join('')}</div></div>
        <div class="campo" data-bloco-dele><span>Lanchas dele</span><small class="caixas__ajuda">Marque as lanchas que são dele ou que ele cuida. Na agenda, elas ficam com a cor dele.</small>${caixas('dele', dele)}</div>
        <div class="campo" data-bloco-vende><span>Lanchas que ele vende</span><small class="caixas__ajuda">As lanchas que ele pode oferecer aos clientes dele.</small>${caixas('vende', vende)}</div>
        <label class="campo"><span>Comissão de quem vende (%) <small style="font-weight:400;color:var(--suave)">(se tiver)</small></span><input data-comissao inputmode="decimal" value="${x.comissao_pct != null ? String(x.comissao_pct).replace('.', ',') : ''}"></label>` : ''}
      ${parc && id ? blocoAgenda(x) : ''}
      ${id ? `<label class="campo"><span>Situação</span><select data-ativo><option value="1"${x.ativo ? ' selected' : ''}>Ativo</option><option value="0"${x.ativo ? '' : ' selected'}>Inativo</option></select></label>` : ''}
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Salvar</button>
      ${id ? `<div class="apagar-cadastro"><p>${esc(avisoApagar)}</p>
        <button class="botao botao--perigo-leve botao--cheio" type="button" data-apagar>Apagar ${parc ? 'parceiro' : 'marinheiro'}</button></div>` : ''}`, (g) => {
      const mostra = () => {
        if (!parc) return;
        g.querySelector('[data-bloco-dele]').hidden = papel === 'revendedor';
        g.querySelector('[data-bloco-vende]').hidden = papel === 'dono';
        const ag = g.querySelector('[data-bloco-agenda]');
        if (ag) ag.hidden = papel === 'revendedor';
      };
      const semNome = g.querySelector('[data-sem-nome]');
      if (semNome) semNome.addEventListener('change', async () => {
        if (!(await grava(sb.from('bb_parceiros').update({ agenda_sem_nome: semNome.value }).eq('id', id)))) return;
        x.agenda_sem_nome = semNome.value;
        avisa('Salvo. Na próxima leitura (até 15 minutos) os dias são refeitos.');
      });
      if (parc) chips(g, '[data-papel]', (b) => { papel = b.dataset.papel; mostra(); });
      mostra();
      if (!id) g.querySelector('[data-nome]').focus();
      aoSalvar(g.querySelector('[data-salvar]'), async () => {
        const nome = g.querySelector('[data-nome]').value.trim();
        if (!nome) return erroCampo(g, 'Escreva o nome.');
        erroCampo(g, '');
        const dados = { nome, telefone: fone(g.querySelector('[data-fone]').value) };
        if (parc) { dados.tipo = papel; const cm = g.querySelector('[data-comissao]').value.trim(); dados.comissao_pct = cm ? num(cm) : null; }
        if (id) dados.ativo = g.querySelector('[data-ativo]').value === '1';
        const salvo = await grava(id ? sb.from(tabela).update(dados).eq('id', id).select('id').single() : sb.from(tabela).insert(dados).select('id').single());
        if (!salvo) return;
        if (parc) {
          const pid = salvo.id;
          const marcadas = (k) => [...g.querySelectorAll(`[data-${k}]`)].filter((i) => i.checked).map((i) => i.dataset[k]);
          // dono: vale o que está marcado (a que era dele e foi desmarcada volta a ser própria)
          const novasDele = papel === 'revendedor' ? [] : marcadas('dele');
          const tirar = [...dele].filter((l) => !novasDele.includes(l));
          const por = novasDele.filter((l) => !dele.has(l));
          if (por.length && !(await grava(sb.from('bb_lanchas').update({ parceiro_id: pid }).in('id', por)))) return;
          if (tirar.length && !(await grava(sb.from('bb_lanchas').update({ parceiro_id: null }).in('id', tirar).eq('parceiro_id', pid)))) return;
          // vende: a lista marcada substitui a anterior
          const novasVende = papel === 'dono' ? [] : marcadas('vende');
          const sai = [...vende].filter((l) => !novasVende.includes(l)), entra = novasVende.filter((l) => !vende.has(l));
          if (sai.length && !(await grava(sb.from('bb_parceiro_lanchas').delete().eq('parceiro_id', pid).in('lancha_id', sai)))) return;
          if (entra.length && !(await grava(sb.from('bb_parceiro_lanchas').insert(entra.map((l) => ({ parceiro_id: pid, lancha_id: l })))))) return;
        }
        fechaGaveta(); await atualiza(); avisa('Salvo.');
      });
      const ap = g.querySelector('[data-apagar]');
      if (ap) confirmaNoBotao(ap, 'Toque de novo para apagar', async () => {
        const { error } = await sb.from(tabela).delete().eq('id', id);
        if (error && error.code === '23503') {
          // parceiro com comissão anotada: o banco guarda o histórico; ele fica inativo
          if (!(await grava(sb.from(tabela).update({ ativo: false }).eq('id', id)))) return;
          fechaGaveta(); await atualiza(); avisa(`${x.nome} tem comissões anotadas. Ficou inativo, com o histórico guardado.`);
          return;
        }
        if (error) { console.error(error); avisa(msgErro(error), true); return; }
        fechaGaveta(); await atualiza(); avisa(`${x.nome} apagado.`);
      });
    });
  }

  /* ================= CONTEÚDO DO SITE ================= */
  // Depois de mudar algo que o site mostra: o servidor tira a cópia guardada e o site mostra na hora.
  const limpaSite = () => api('fotos.php', { acao: 'cache' });
  const curto = (t, n = 110) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; };
  const moveNaLista = (lista, i, d) => { const j = i + d; if (j < 0 || j >= lista.length) return lista; const c = lista.slice(); [c[i], c[j]] = [c[j], c[i]]; return c; };

  /* ---------- roteiros ---------- */
  let roteirosCompletos = null;
  async function carregaRoteiros() {
    const { data, error } = await sb.from('bb_roteiros').select('*').order('ordem');
    if (error) { console.error(error); avisa(msgErro(error), true); return null; }
    roteirosCompletos = data || [];
    return roteirosCompletos;
  }

  // Roteiros que têm página própria no site (as outras são só do painel, para marcar passeios).
  const ROTEIRO_COM_PAGINA = ['ilha-do-campeche', 'costa-da-lagoa'];
  async function telaRoteiros() {
    tela.innerHTML = `<header class="cab"><div><h1>Roteiros</h1><p>As paradas e as regras que aparecem na página de cada roteiro no site.</p></div>
        <button class="botao botao--principal" type="button" data-novo-roteiro><svg><use href="#p-mais-um"/></svg>Cadastrar roteiro</button></header>
      <ul class="lista" data-lista><li class="cartao vazio">Carregando</li></ul>`;
    tela.querySelector('[data-novo-roteiro]').addEventListener('click', novoRoteiro);
    const rs = await carregaRoteiros();
    const ul = tela.querySelector('[data-lista]');
    if (!rs || !ul) return;
    ul.innerHTML = rs.map((r) => `<li><a class="linha${r.ativo === false ? ' is-desligada' : ''}" href="#roteiro/${r.id}"><span class="linha__icone"><svg><use href="#p-rota"/></svg></span>
      <span class="linha__corpo"><b>${esc(r.nome)}${r.ativo === false ? ' <span class="selo selo--neutro">Desativado</span>' : ''}</b><span>${(r.paradas || []).length} paradas · ${(r.regras || []).length ? (r.regras || []).length + ' regras' : 'sem regras'}${ROTEIRO_COM_PAGINA.includes(r.slug) ? ' · tem página no site' : ''}</span></span><svg><use href="#p-seta"/></svg></a></li>`).join('');
  }

  function novoRoteiro() {
    abreGaveta('Cadastrar roteiro', `
      <label class="campo"><span>Nome do roteiro</span><input data-nome placeholder="Ex.: Praia do Forte e Jurerê"></label>
      <label class="campo"><span>Resumo <small style="font-weight:400;color:var(--suave)">(opcional)</small></span><textarea data-resumo rows="3" placeholder="Por onde passa e o que tem de bom"></textarea></label>
      <p class="ajuda">O roteiro novo já aparece para marcar passeios e no cadastro dos clientes. Depois de salvar, adicione as paradas e as regras.</p>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Cadastrar roteiro</button>`, (g) => {
      g.querySelector('[data-nome]').focus();
      aoSalvar(g.querySelector('[data-salvar]'), async () => {
        const nome = g.querySelector('[data-nome]').value.trim();
        if (!nome) return erroCampo(g, 'Escreva o nome do roteiro.');
        if (S.roteiros.some((x) => x.nome.toLowerCase() === nome.toLowerCase())) return erroCampo(g, 'Já existe um roteiro com esse nome.');
        const base = semAcento(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'roteiro';
        let slug = base, n = 2;
        while (S.roteiros.some((x) => x.slug === slug)) slug = `${base}-${n++}`;
        const novo = await grava(sb.from('bb_roteiros').insert({ nome, slug, resumo: g.querySelector('[data-resumo]').value.trim() || null,
          paradas: [], regras: [], ativo: true, ordem: S.roteiros.length + 1 }).select('id').single());
        if (!novo) return;
        fechaGaveta(); roteirosCompletos = null; await atualiza(); location.hash = '#roteiro/' + novo.id;
        avisa(`${nome} cadastrado. Agora adicione as paradas.`);
      });
    });
  }

  async function telaRoteiro(id) {
    const r = (roteirosCompletos || []).find((x) => x.id === id) || ((await carregaRoteiros()) || []).find((x) => x.id === id);
    if (!r) { location.hash = '#roteiros'; return; }
    const paradas = Array.isArray(r.paradas) ? r.paradas : [];
    const regras = Array.isArray(r.regras) ? r.regras : [];
    const num = (v, suf) => (v != null ? `${String(Number(v)).replace('.', ',')} ${suf}` : null);
    const comPagina = ROTEIRO_COM_PAGINA.includes(r.slug);
    tela.innerHTML = `<a class="voltar" href="#roteiros"><svg><use href="#p-volta"/></svg>Roteiros</a>
      <header class="cab"><div><h1>${esc(r.nome)}${r.ativo === false ? ' <span class="selo selo--neutro">Desativado</span>' : ''}</h1><p>${esc([num(r.duracao_horas, 'horas'), num(r.distancia_milhas, 'milhas'), r.trajeto_texto].filter(Boolean).join(' · '))}</p></div>
        ${comPagina ? `<a class="botao botao--leve botao--pequeno" href="../${esc(r.slug)}/" target="_blank" rel="noopener">Ver no site</a>` : ''}</header>
      <p class="ajuda">${comPagina ? 'A duração, a distância e o tempo de navegação aparecem em várias páginas do site. Para mudar, fale com a Freela, que a gente troca em todas de uma vez.'
        : 'Este roteiro aparece no painel, para marcar passeios. Para ele ganhar uma página no site, como a Ilha do Campeche e a Costa da Lagoa, fale com a Freela.'}</p>
      <section class="bloco"><h2>Paradas <small>a ordem é a do passeio</small></h2>
        <ol class="lista paradas-l">${paradas.map((p, i) => `<li><button class="linha" type="button" data-parada="${i}">
          ${p.foto ? `<img class="paradas-l__foto" src="${esc(foto(p.foto))}" alt="">` : '<span class="paradas-l__foto paradas-l__foto--sem">sem foto</span>'}
          <span class="linha__corpo"><b>${i + 1}. ${esc(p.nome)}</b><span>${esc(curto(p.texto))}</span></span><svg><use href="#p-seta"/></svg></button></li>`).join('') || vazio('Nenhuma parada.')}</ol>
        <button class="botao botao--leve" type="button" data-nova-parada style="margin-top:12px"><svg><use href="#p-mais-um"/></svg>Adicionar parada</button>
      </section>
      <section class="bloco cartao"><h2 style="font-size:1.1rem;margin-bottom:6px">Regras do roteiro</h2>
        <p class="ajuda" style="margin-top:0">Uma regra por linha. Aparecem num quadro de aviso na página do roteiro. Sem nenhuma regra, o quadro some.</p>
        <label class="campo"><span class="sr">Regras</span><textarea data-regras rows="${Math.max(4, regras.length + 1)}">${esc(regras.join('\n'))}</textarea></label>
        <button class="botao botao--principal" type="button" data-salvar-regras>Salvar as regras</button>
      </section>
      <section class="bloco cartao"><h2 style="font-size:1.1rem;margin-bottom:6px">${r.ativo === false ? 'Roteiro desativado' : 'Desativar ou apagar'}</h2>
        <p style="margin:0 0 12px;color:var(--suave)">${r.ativo === false ? 'Não aparece para marcar passeios. Os passeios antigos continuam com ele.'
          : `Desativado, ele sai das opções para marcar passeio e os passeios antigos continuam com ele.${comPagina ? ' A página dele no site continua no ar.' : ''} Apagar só dá se nenhum passeio ou cliente usou este roteiro.`}</p>
        <div class="acoes">
          <button class="botao botao--leve" type="button" data-ativa>${r.ativo === false ? 'Ativar de novo' : 'Desativar'}</button>
          ${comPagina ? '' : '<button class="botao botao--perigo-leve" type="button" data-apagar-r>Apagar o roteiro</button>'}
        </div>
      </section>`;
    aoSalvar(tela.querySelector('[data-ativa]'), async () => {
      const ativo = r.ativo === false;
      if (!(await grava(sb.from('bb_roteiros').update({ ativo }).eq('id', r.id)))) return;
      r.ativo = ativo; await atualiza(); avisa(ativo ? 'Roteiro ativado.' : 'Roteiro desativado.');
    });
    const bApaga = tela.querySelector('[data-apagar-r]');
    if (bApaga) confirmaNoBotao(bApaga, 'Toque de novo para apagar', async () => {
      // o banco apagaria o roteiro dos passeios e clientes antigos (set null): confere antes
      const usados = await Promise.all(['bb_passeios', 'bb_leads'].map((tb) => sb.from(tb).select('id', { count: 'exact', head: true }).eq('roteiro_id', r.id)));
      if (usados.some((u) => u.error || u.count)) { avisa('Já tem passeio ou cliente com este roteiro. Desative em vez de apagar.', true); return; }
      const { error } = await sb.from('bb_roteiros').delete().eq('id', r.id);
      if (error) { console.error(error); avisa(msgErro(error), true); return; }
      roteirosCompletos = null; location.hash = '#roteiros'; await atualiza(); avisa(`${r.nome} apagado.`);
    });
    const salvaRoteiro = async (muda, msg) => {
      if (!(await grava(sb.from('bb_roteiros').update(muda).eq('id', r.id)))) return false;
      Object.assign(r, muda); limpaSite(); fechaGaveta(); telaRoteiro(r.id); avisa(msg); return true;
    };
    aoSalvar(tela.querySelector('[data-salvar-regras]'), async () => {
      const novas = tela.querySelector('[data-regras]').value.split('\n').map((x) => x.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
      await salvaRoteiro({ regras: novas }, novas.length ? 'Regras salvas. O site já mostra.' : 'Regras apagadas. O quadro saiu do site.');
    });
    tela.querySelectorAll('[data-parada]').forEach((b) => b.addEventListener('click', () => editaParada(r, Number(b.dataset.parada), salvaRoteiro)));
    tela.querySelector('[data-nova-parada]').addEventListener('click', () => editaParada(r, -1, salvaRoteiro));
  }

  function editaParada(r, i, salvaRoteiro) {
    const paradas = (Array.isArray(r.paradas) ? r.paradas : []).slice();
    const nova = i < 0;
    const p = nova ? { nome: '', texto: '', foto: null, alt: '' } : Object.assign({}, paradas[i]);
    let fotoNova = null;   // arquivo escolhido, ainda não enviado
    abreGaveta(nova ? 'Nova parada' : `Parada ${i + 1}`, `
      <div class="parada-foto" data-foto-area>${p.foto ? `<img src="${esc(foto(p.foto))}" alt="">` : '<span>Sem foto</span>'}</div>
      <div class="acoes" style="margin:10px 0 16px">
        <label class="botao botao--leve botao--pequeno"><svg><use href="#p-foto"/></svg>${p.foto ? 'Trocar a foto' : 'Escolher foto'}<input type="file" accept="image/*" data-arq class="sr"></label>
        ${p.foto ? '<button class="botao botao--leve botao--pequeno" type="button" data-tira-foto>Tirar a foto</button>' : ''}
      </div>
      <label class="campo"><span>Nome da parada</span><input data-nome value="${esc(p.nome)}" maxlength="80"></label>
      <label class="campo"><span>O que tem lá</span><textarea data-texto rows="4" maxlength="400">${esc(p.texto)}</textarea><small>Uma ou duas frases. Fatos ajudam quem procura no Google: o que dá para fazer, o que é proibido.</small></label>
      <label class="campo"><span>O que aparece na foto <small style="font-weight:400;color:var(--suave)">(para quem não enxerga)</small></span><input data-alt value="${esc(p.alt || '')}" maxlength="160" placeholder="Ex.: lancha ancorada em frente à areia branca"></label>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>${nova ? 'Adicionar a parada' : 'Salvar a parada'}</button>
      ${nova ? '' : `<div class="acoes" style="margin-top:14px">
        ${i > 0 ? '<button class="botao botao--leve botao--pequeno" type="button" data-mov="-1">Passar para antes</button>' : ''}
        ${i < paradas.length - 1 ? '<button class="botao botao--leve botao--pequeno" type="button" data-mov="1">Passar para depois</button>' : ''}</div>
      <section class="bloco"><button class="botao botao--perigo-leve" type="button" data-apagar-parada>Apagar esta parada</button></section>`}`, (c) => {
      c.querySelector('[data-arq]').addEventListener('change', (e) => {
        fotoNova = e.target.files[0] || null;
        if (fotoNova) c.querySelector('[data-foto-area]').innerHTML = `<img src="${URL.createObjectURL(fotoNova)}" alt="">`;
      });
      const tira = c.querySelector('[data-tira-foto]');
      if (tira) tira.addEventListener('click', () => { p.foto = null; fotoNova = null; c.querySelector('[data-foto-area]').innerHTML = '<span>Sem foto</span>'; });
      aoSalvar(c.querySelector('[data-salvar]'), async () => {
        const nome = c.querySelector('[data-nome]').value.trim(), texto = c.querySelector('[data-texto]').value.trim();
        if (!nome || !texto) return erroCampo(c, 'Preencha o nome da parada e o que tem lá.');
        erroCampo(c, '');
        if (fotoNova) {
          let blob;
          try { blob = await preparaFoto(fotoNova); } catch (e) { return erroCampo(c, 'Esse formato de foto não abre aqui. Envie em JPG.'); }
          const fd = new FormData();
          fd.append('acao', 'parada'); fd.append('roteiro_id', r.id); fd.append('foto', blob, 'foto.jpg');
          if (!nova && paradas[i].foto) fd.append('antiga', paradas[i].foto);
          const res = await api('fotos.php', fd);
          if (!res.ok) return erroCampo(c, res.erro || 'A foto não subiu. Tente de novo.');
          p.foto = res.url;
        }
        const pronta = { nome, texto, foto: p.foto || null, alt: c.querySelector('[data-alt]').value.trim() || (p.foto ? nome : '') };
        if (nova) paradas.push(pronta); else paradas[i] = pronta;
        await salvaRoteiro({ paradas }, nova ? 'Parada adicionada. O site já mostra.' : 'Parada salva. O site já mostra.');
      });
      c.querySelectorAll('[data-mov]').forEach((b) => aoSalvar(b, () => salvaRoteiro({ paradas: moveNaLista(paradas, i, Number(b.dataset.mov)) }, 'Ordem das paradas trocada.')));
      const ap = c.querySelector('[data-apagar-parada]');
      if (ap) confirmaNoBotao(ap, 'Toque de novo para apagar', () => { paradas.splice(i, 1); salvaRoteiro({ paradas }, 'Parada apagada.'); });
    });
  }

  /* ---------- perguntas frequentes e avaliações ---------- */
  let abaTextos = 'faq';
  const IDIOMAS = [['pt', 'Português'], ['es', 'Espanhol'], ['en', 'Inglês']];
  const TABELA_TEXTO = { faq: 'bb_faq', avaliacoes: 'bb_avaliacoes' };

  async function telaTextosSite() {
    tela.innerHTML = `<header class="cab"><div><h1>Perguntas e avaliações</h1><p>O que aparece na página inicial do site. Muda na hora.</p>
        <div class="chips chips--periodo" role="group" aria-label="Mostrar">${[['faq', 'Perguntas frequentes'], ['avaliacoes', 'Avaliações']].map(([v, n]) => `<button class="chip" type="button" aria-pressed="${v === abaTextos}" data-aba-t="${v}">${n}</button>`).join('')}</div></div>
        <button class="botao botao--principal" type="button" data-novo-texto><svg><use href="#p-mais-um"/></svg>${abaTextos === 'faq' ? 'Nova pergunta' : 'Nova avaliação'}</button></header>
      <p class="ajuda">${abaTextos === 'faq' ? 'As perguntas que mais chegam no WhatsApp. O Google também lê estas respostas.' : 'Copie avaliações reais do Google, com o nome e o mês. A primeira da lista aparece em destaque.'}${abaTextos === 'avaliacoes' ? ' <a href="https://search.google.com/local/reviews?placeid=ChIJweQXY-8_J5URa4sYsQVDMTc" target="_blank" rel="noopener">Abrir as avaliações no Google</a>' : ''}</p>
      <ol class="lista" data-lista><li class="cartao vazio">Carregando</li></ol>`;
    tela.querySelectorAll('[data-aba-t]').forEach((b) => b.addEventListener('click', () => { abaTextos = b.dataset.abaT; telaTextosSite(); }));
    tela.querySelector('[data-novo-texto]').onclick = () => editaTexto(null, []);
    const aba = abaTextos;
    const { data, error } = await sb.from(TABELA_TEXTO[aba]).select('*').order('ordem').order(aba === 'faq' ? 'pergunta' : 'created_at');
    const ul = tela.querySelector('[data-lista]');
    if (!ul || aba !== abaTextos) return;
    if (error) { console.error(error); ul.innerHTML = vazio('Não consegui carregar agora. Tente de novo.'); return; }
    const lista = data || [];
    ul.innerHTML = lista.map((x, i) => `<li><button class="linha" type="button" data-texto-i="${i}">
      <span class="linha__corpo"><b>${esc(aba === 'faq' ? x.pergunta : `${x.nome}${x.data_label ? ', ' + x.data_label : ''}`)}${x.ativo ? '' : ' <span class="selo selo--neutro">fora do site</span>'}${aba === 'avaliacoes' && i === 0 ? ' <span class="selo selo--bom">em destaque</span>' : ''}</b>
        <span>${esc(curto(aba === 'faq' ? x.resposta : x.texto))}</span></span><svg><use href="#p-seta"/></svg></button></li>`).join('')
      || vazio(aba === 'faq' ? 'Nenhuma pergunta ainda. O site mostra as perguntas de sempre até você cadastrar a primeira.' : 'Nenhuma avaliação ainda. O site mostra as de sempre até você cadastrar a primeira.');
    ul.querySelectorAll('[data-texto-i]').forEach((b) => b.addEventListener('click', () => editaTexto(lista[Number(b.dataset.textoI)], lista)));
    tela.querySelector('[data-novo-texto]').onclick = () => editaTexto(null, lista);
  }

  function editaTexto(x, lista) {
    const faq = abaTextos === 'faq', tab = TABELA_TEXTO[abaTextos];
    const i = x ? lista.indexOf(x) : -1;
    let idioma = (x && x.idioma) || 'pt';
    abreGaveta(x ? (faq ? 'Pergunta' : 'Avaliação') : (faq ? 'Nova pergunta' : 'Nova avaliação'), `${faq ? `
      <label class="campo"><span>Pergunta</span><input data-a value="${esc(x ? x.pergunta : '')}" maxlength="140" placeholder="Ex.: Pode levar criança de colo?"></label>
      <label class="campo"><span>Resposta</span><textarea data-b rows="6" maxlength="900">${esc(x ? x.resposta : '')}</textarea><small>Direto ao ponto, com números quando der. Linha em branco separa parágrafos. Nada de preço: o valor é sempre pelo WhatsApp.</small></label>` : `
      <label class="campo"><span>Nome de quem avaliou</span><input data-a value="${esc(x ? x.nome : '')}" maxlength="60"></label>
      <label class="campo"><span>Avaliação</span><textarea data-b rows="6" maxlength="900">${esc(x ? x.texto : '')}</textarea><small>Copie do Google do jeito que a pessoa escreveu.</small></label>
      <label class="campo"><span>Quando</span><input data-c value="${esc(x ? x.data_label || '' : '')}" maxlength="30" placeholder="Ex.: março de 2025"></label>
      <div class="campo"><span>Em que língua está escrita</span><div class="chips">${IDIOMAS.map(([v, n]) => `<button class="chip" type="button" aria-pressed="${v === idioma}" data-idioma="${v}">${n}</button>`).join('')}</div></div>`}
      <label class="campo"><span>Mostrar no site</span><select data-ativo><option value="1"${!x || x.ativo ? ' selected' : ''}>Sim</option><option value="0"${x && !x.ativo ? ' selected' : ''}>Não, deixar guardada</option></select></label>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>${x ? 'Salvar' : 'Adicionar'}</button>
      ${x ? `<div class="acoes" style="margin-top:14px">
        ${i > 0 ? '<button class="botao botao--leve botao--pequeno" type="button" data-mov="-1">Subir na lista</button>' : ''}
        ${i < lista.length - 1 ? '<button class="botao botao--leve botao--pequeno" type="button" data-mov="1">Descer na lista</button>' : ''}</div>
        <section class="bloco"><button class="botao botao--perigo-leve" type="button" data-apagar-t>Apagar</button></section>` : ''}`, (c) => {
      if (!faq) chips(c, '[data-idioma]', (b) => { idioma = b.dataset.idioma; });
      const fim = async (msg) => { limpaSite(); fechaGaveta(); await telaTextosSite(); avisa(msg); };
      aoSalvar(c.querySelector('[data-salvar]'), async () => {
        const a = c.querySelector('[data-a]').value.trim(), b = c.querySelector('[data-b]').value.trim();
        if (!a || !b) return erroCampo(c, faq ? 'Preencha a pergunta e a resposta.' : 'Preencha o nome e a avaliação.');
        if (faq && /R\$\s*\d/.test(b) && !/acréscimo/i.test(b)) return erroCampo(c, 'A resposta tem um valor em reais. No site, preço é sempre pelo WhatsApp.');
        erroCampo(c, '');
        const dados = faq ? { pergunta: a, resposta: b } : { nome: a, texto: b, data_label: c.querySelector('[data-c]').value.trim() || null, idioma };
        dados.ativo = c.querySelector('[data-ativo]').value === '1';
        if (!x) dados.ordem = lista.length ? Math.max(...lista.map((y) => y.ordem || 0)) + 1 : 0;
        if (!(await grava(x ? sb.from(tab).update(dados).eq('id', x.id) : sb.from(tab).insert(dados)))) return;
        await fim(x ? 'Salvo. O site já mostra.' : (faq ? 'Pergunta adicionada.' : 'Avaliação adicionada.'));
      });
      c.querySelectorAll('[data-mov]').forEach((bt) => aoSalvar(bt, async () => {
        const nova = moveNaLista(lista, i, Number(bt.dataset.mov));
        // regrava a ordem de todos (lista curta): 0, 1, 2...
        for (let k = 0; k < nova.length; k++) if (nova[k].ordem !== k) { if (!(await grava(sb.from(tab).update({ ordem: k }).eq('id', nova[k].id)))) return; }
        await fim('Ordem trocada.');
      }));
      const ap = c.querySelector('[data-apagar-t]');
      if (ap) confirmaNoBotao(ap, 'Toque de novo para apagar', async () => {
        if (!(await grava(sb.from(tab).delete().eq('id', x.id)))) return;
        await fim('Apagado.');
      });
    });
  }

  /* ---------- vídeos do Instagram (home) ---------- */
  // Envio com barra de progresso (o fetch não mostra o progresso do envio; o XMLHttpRequest mostra).
  function enviaComProgresso(arquivo, fd, aoAndar) {
    return new Promise(async (ok) => {
      const { data: { session } } = await sb.auth.getSession();
      const x = new XMLHttpRequest();
      x.open('POST', '../api/' + arquivo);
      x.setRequestHeader('Authorization', 'Bearer ' + ((session && session.access_token) || ''));
      x.upload.onprogress = (e) => { if (e.lengthComputable) aoAndar(e.loaded / e.total); };
      x.onload = () => { try { ok(JSON.parse(x.responseText)); } catch (e) { ok({ ok: false, erro: x.status === 413 ? 'Vídeo grande demais para enviar.' : 'O servidor não respondeu direito. Tente de novo.' }); } };
      x.onerror = () => ok({ ok: false, erro: 'O envio caiu. Confira a internet e tente de novo.' });
      x.send(fd);
    });
  }

  let videos = [];
  async function telaVideos() {
    tela.innerHTML = `<header class="cab"><div><h1>Vídeos do Instagram</h1><p>Os vídeos da página inicial do site, na ordem em que aparecem.</p></div>
        <button class="botao botao--principal" type="button" data-novo-video><svg><use href="#p-mais-um"/></svg>Adicionar vídeo</button></header>
      <p class="ajuda">Mande o vídeo como baixou do Instagram ou como gravou no celular. O servidor deixa ele leve para o site e tira a capa sozinho; em uns minutos ele aparece.</p>
      <ol class="videos-l" data-lista><li class="cartao vazio">Carregando</li></ol>`;
    tela.querySelector('[data-novo-video]').addEventListener('click', () => novoVideo());
    const { data, error } = await sb.from('bb_instagram').select('*').order('ordem').order('created_at');
    const ul = tela.querySelector('[data-lista]');
    if (!ul) return;
    if (error) { console.error(error); ul.innerHTML = vazio('Não consegui carregar agora. Tente de novo.'); return; }
    videos = data || [];
    ul.innerHTML = videos.map((v, i) => `<li><button type="button" data-video-i="${i}">
        ${v.poster_url ? `<img src="${esc(foto(v.poster_url))}" alt="" loading="lazy">` : '<span class="videos-l__sem">capa em preparo</span>'}
        <span class="videos-l__n">${i + 1}</span>
        ${v.erro ? '<span class="videos-l__selo videos-l__selo--erro">não deu certo</span>' : !v.pronto ? '<span class="videos-l__selo">preparando</span>' : !v.ativo ? '<span class="videos-l__selo videos-l__selo--fora">fora do site</span>' : ''}
        <span class="videos-l__leg">${esc(curto(v.legenda || 'Sem legenda', 70))}</span></button></li>`).join('')
      || vazio('Nenhum vídeo ainda. O site mostra os vídeos de sempre até você adicionar o primeiro.');
    ul.querySelectorAll('[data-video-i]').forEach((b) => b.addEventListener('click', () => editaVideo(videos[Number(b.dataset.videoI)], Number(b.dataset.videoI))));
    // vídeo em preparo: confere de novo em 30 s, enquanto a tela estiver aberta
    if (videos.some((v) => !v.pronto && !v.erro)) setTimeout(() => { if (location.hash === '#videos' && gaveta.hidden) telaVideos(); }, 30000);
  }

  function novoVideo() {
    abreGaveta('Adicionar vídeo', `
      <label class="campo"><span>Vídeo</span><input type="file" accept="video/*" data-arq><small>MP4 ou MOV, até 400 MB.</small></label>
      <label class="campo"><span>O que aparece no vídeo</span><input data-leg maxlength="140" placeholder="Ex.: churrasco a bordo em frente à Ilha do Campeche"><small>Uma frase. Quem não enxerga ouve esse texto, e o Google também lê.</small></label>
      <label class="campo"><span>Link do post no Instagram <small style="font-weight:400;color:var(--suave)">(se quiser)</small></span><input type="url" data-link placeholder="https://www.instagram.com/reel/..."></label>
      <div class="progresso" data-prog hidden><span></span></div>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Enviar o vídeo</button>`, (c) => {
      aoSalvar(c.querySelector('[data-salvar]'), async () => {
        const arq = c.querySelector('[data-arq]').files[0];
        const leg = c.querySelector('[data-leg]').value.trim(), link = c.querySelector('[data-link]').value.trim();
        if (!arq) return erroCampo(c, 'Escolha o vídeo.');
        if (!/^video\//.test(arq.type) && !/\.(mp4|mov|m4v|webm)$/i.test(arq.name)) return erroCampo(c, 'Esse arquivo não é um vídeo.');
        if (arq.size > 400 * 1048576) return erroCampo(c, 'Vídeo grande demais (mais de 400 MB). Envie um trecho menor.');
        if (!leg) return erroCampo(c, 'Escreva em uma frase o que aparece no vídeo.');
        if (link && !/^https:\/\/(www\.)?instagram\.com\//.test(link)) return erroCampo(c, 'O link precisa ser de um post do Instagram.');
        erroCampo(c, '');
        const prog = c.querySelector('[data-prog]'), barra = prog.querySelector('span');
        prog.hidden = false;
        const fd = new FormData();
        fd.append('acao', 'enviar'); fd.append('video', arq, arq.name);
        const r = await enviaComProgresso('videos.php', fd, (p) => { barra.style.width = Math.round(p * 100) + '%'; });
        if (!r.ok) { prog.hidden = true; return erroCampo(c, r.erro || 'Não deu certo. Tente de novo.'); }
        // entra em primeiro na lista (o mais novo aparece antes no site)
        const ordem = videos.length ? Math.min(...videos.map((v) => v.ordem || 0)) - 1 : 0;
        if (!(await grava(sb.from('bb_instagram').insert({ video_url: r.video_url, poster_url: null, legenda: leg, url: link || null, ordem, pronto: false, ativo: true })))) return;
        fechaGaveta(); await telaVideos();
        avisa('Vídeo enviado. Em uns minutos ele aparece no site.');
      });
    });
  }

  function editaVideo(v, i) {
    if (!v) return;
    abreGaveta(`Vídeo ${i + 1}`, `
      ${v.pronto && !v.erro ? `<video class="video-previa" src="${esc(foto(v.video_url))}"${v.poster_url ? ` poster="${esc(foto(v.poster_url))}"` : ''} controls playsinline preload="none"></video>` : ''}
      ${v.erro ? `<div class="alerta"><div><b>Não deu certo preparar este vídeo.</b><p style="margin:2px 0 0">${esc(v.erro)}</p></div></div>` : !v.pronto ? '<p class="ajuda">O servidor está preparando este vídeo. Ele aparece no site em uns minutos.</p>' : ''}
      <label class="campo"><span>O que aparece no vídeo</span><input data-leg value="${esc(v.legenda || '')}" maxlength="140"></label>
      <label class="campo"><span>Link do post no Instagram</span><input type="url" data-link value="${esc(v.url || '')}"></label>
      <label class="campo"><span>Mostrar no site</span><select data-ativo><option value="1"${v.ativo ? ' selected' : ''}>Sim</option><option value="0"${v.ativo ? '' : ' selected'}>Não, deixar guardado</option></select></label>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Salvar</button>
      <div class="acoes" style="margin-top:14px">
        ${i > 0 ? '<button class="botao botao--leve botao--pequeno" type="button" data-mov="-1">Passar para antes</button>' : ''}
        ${i < videos.length - 1 ? '<button class="botao botao--leve botao--pequeno" type="button" data-mov="1">Passar para depois</button>' : ''}</div>
      <section class="bloco"><button class="botao botao--perigo-leve" type="button" data-apagar-v>Apagar este vídeo</button></section>`, (c) => {
      const fim = async (msg) => { limpaSite(); fechaGaveta(); await telaVideos(); avisa(msg); };
      aoSalvar(c.querySelector('[data-salvar]'), async () => {
        const leg = c.querySelector('[data-leg]').value.trim(), link = c.querySelector('[data-link]').value.trim();
        if (!leg) return erroCampo(c, 'Escreva em uma frase o que aparece no vídeo.');
        if (link && !/^https:\/\/(www\.)?instagram\.com\//.test(link)) return erroCampo(c, 'O link precisa ser de um post do Instagram.');
        if (!(await grava(sb.from('bb_instagram').update({ legenda: leg, url: link || null, ativo: c.querySelector('[data-ativo]').value === '1' }).eq('id', v.id)))) return;
        await fim('Vídeo salvo.');
      });
      c.querySelectorAll('[data-mov]').forEach((b) => aoSalvar(b, async () => {
        const nova = moveNaLista(videos, i, Number(b.dataset.mov));
        for (let k = 0; k < nova.length; k++) if (nova[k].ordem !== k) { if (!(await grava(sb.from('bb_instagram').update({ ordem: k }).eq('id', nova[k].id)))) return; }
        await fim('Ordem trocada.');
      }));
      confirmaNoBotao(c.querySelector('[data-apagar-v]'), 'Toque de novo para apagar', async () => {
        if (!(await grava(sb.from('bb_instagram').delete().eq('id', v.id)))) return;
        await api('videos.php', { acao: 'apagar', video_url: v.video_url });
        await fim('Vídeo apagado.');
      });
    });
  }

  /* ================= ACESSOS (só a dona) ================= */
  const WA_BARRA = '5548991153172';
  const PAPEIS = {
    dona: ['Dona', 'Vê e mexe em tudo.'],
    atendente: ['Atendente', 'Vê tudo, menos Relatórios.'],
    parceiro: ['Parceiro', 'Vê só a agenda das lanchas dele e as comissões. Nada de clientes nem valores da Barra Boat.'],
    marinheiro: ['Marinheiro', 'Vê só os passeios em que ele é o marinheiro e a previsão do tempo.'],
  };
  const linkPainel = () => location.origin + location.pathname;

  // Chama um PHP do painel (api/). Sem PHP (prévia) devolve um erro em português.
  async function api(arquivo, corpo) {
    try {
      const { data: { session } } = await sb.auth.getSession();
      const arquivoJunto = corpo instanceof FormData;   // envio de foto: o navegador monta o multipart
      const headers = { Authorization: 'Bearer ' + ((session && session.access_token) || '') };
      if (!arquivoJunto) headers['Content-Type'] = 'application/json';
      const r = await fetch('../api/' + arquivo, { method: 'POST', headers, body: arquivoJunto ? corpo : JSON.stringify(corpo) });
      return await r.json();
    } catch (e) {
      return { ok: false, erro: 'Isso só funciona no painel do site novo, com internet.' };
    }
  }

  let equipe = null;
  async function telaAcessos() {
    if (!dona()) { location.hash = '#hoje'; return; }
    tela.innerHTML = `<header class="cab"><div><h1>Quem acessa o painel</h1><p>Cada pessoa entra com o próprio e-mail e senha e vê só a parte dela.</p></div>
        <button class="botao botao--principal" type="button" data-dar-acesso><svg><use href="#p-mais-um"/></svg>Dar acesso a alguém</button></header>
      <ul class="lista" data-equipe><li class="cartao vazio">Carregando</li></ul>
      <section class="bloco cartao"><h2 style="font-size:1.1rem;margin-bottom:10px">O que cada um vê</h2>
        <ul class="papeis">${Object.values(PAPEIS).map(([n, t]) => `<li><b>${n}</b><span>${t}</span></li>`).join('')}</ul></section>`;
    tela.querySelector('[data-dar-acesso]').addEventListener('click', () => darAcesso());
    const { data, error } = await sb.rpc('bb_equipe_lista');
    const ul = tela.querySelector('[data-equipe]');
    if (!ul) return;
    if (error) { console.error(error); ul.innerHTML = vazio('Não consegui carregar a lista agora. Tente de novo.'); return; }
    equipe = data || [];
    ul.innerHTML = equipe.map((x) => {
      const de = x.papel === 'parceiro' ? (parceiro(x.parceiro_id) || {}).nome : x.papel === 'marinheiro' ? (marinheiro(x.marinheiro_id) || {}).nome : '';
      return `<li><button class="linha" type="button" data-acesso="${x.user_id}">
        <span class="avatar">${esc((x.nome || '?')[0].toUpperCase())}</span>
        <span class="linha__corpo"><b>${esc(x.nome)}${x.user_id === S.user.id ? ' (você)' : ''}</b><span>${esc([PAPEIS[x.papel][0] + (de && de !== x.nome ? ' · ' + de : ''), x.email, x.ultimo_acesso ? 'entrou ' + quando(x.ultimo_acesso) : 'ainda não entrou'].join(' · '))}</span></span>
        <svg><use href="#p-seta"/></svg></button></li>`;
    }).join('') || vazio('Só você tem acesso por enquanto.');
    ul.querySelectorAll('[data-acesso]').forEach((b) => b.addEventListener('click', () => abreAcesso(equipe.find((x) => x.user_id === b.dataset.acesso))));
  }

  function darAcesso() {
    let papel = 'parceiro';
    const jaTem = (campo, id) => (equipe || []).some((x) => x[campo] === id);
    const opcoesPessoa = (lista, campo) => lista.filter((x) => x.ativo !== false).map((x) => `<option value="${x.id}"${jaTem(campo, x.id) ? ' disabled' : ''}>${esc(x.nome)}${jaTem(campo, x.id) ? ' (já tem acesso)' : ''}</option>`).join('');
    abreGaveta('Dar acesso ao painel', `
      <div class="campo"><span>Quem é a pessoa?</span><div class="chips">${[['parceiro', 'Parceiro'], ['marinheiro', 'Marinheiro'], ['atendente', 'Atendente']].map(([v, n]) => `<button class="chip" type="button" aria-pressed="${v === papel}" data-papel-ac="${v}">${n}</button>`).join('')}</div></div>
      <p class="ajuda" data-explica>${PAPEIS.parceiro[1]}</p>
      <label class="campo" data-bloco="parceiro"><span>Parceiro</span><select data-parceiro><option value="">Escolha</option>${opcoesPessoa(S.parceiros, 'parceiro_id')}</select>
        <small>Não está na lista? Cadastre antes em Mais, Parceiros.</small></label>
      <label class="campo" data-bloco="marinheiro" hidden><span>Marinheiro</span><select data-marinheiro><option value="">Escolha</option>${opcoesPessoa(S.marinheiros, 'marinheiro_id')}</select>
        <small>Não está na lista? Cadastre antes em Mais, Marinheiros.</small></label>
      <label class="campo" data-bloco="atendente" hidden><span>Nome</span><input data-nome autocomplete="off"></label>
      <label class="campo"><span>E-mail da pessoa</span><input type="email" data-email autocomplete="off" placeholder="nome@gmail.com"><small>É com ele que a pessoa entra. A senha o painel cria e você manda pelo WhatsApp.</small></label>
      <p class="erro" data-erro hidden></p>
      <button class="botao botao--principal botao--cheio" type="button" data-salvar>Criar o acesso</button>`, (c) => {
      chips(c, '[data-papel-ac]', (b) => {
        papel = b.dataset.papelAc;
        c.querySelector('[data-explica]').textContent = PAPEIS[papel][1];
        c.querySelectorAll('[data-bloco]').forEach((x) => { x.hidden = x.dataset.bloco !== papel; });
      });
      aoSalvar(c.querySelector('[data-salvar]'), async () => {
        const email = c.querySelector('[data-email]').value.trim().toLowerCase();
        const corpo = { acao: 'criar', papel, email };
        let pessoa = null;
        if (papel === 'parceiro') { pessoa = parceiro(c.querySelector('[data-parceiro]').value); if (!pessoa) return erroCampo(c, 'Escolha o parceiro.'); corpo.parceiro_id = pessoa.id; corpo.nome = pessoa.nome; }
        else if (papel === 'marinheiro') { pessoa = marinheiro(c.querySelector('[data-marinheiro]').value); if (!pessoa) return erroCampo(c, 'Escolha o marinheiro.'); corpo.marinheiro_id = pessoa.id; corpo.nome = pessoa.nome; }
        else { corpo.nome = c.querySelector('[data-nome]').value.trim(); if (!corpo.nome) return erroCampo(c, 'Escreva o nome da pessoa.'); }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erroCampo(c, 'Esse e-mail não parece certo. Confira.');
        erroCampo(c, '');
        const r = await api('equipe.php', corpo);
        if (!r.ok) return erroCampo(c, r.erro || 'Não deu certo. Tente de novo.');
        mostraSenha({ nome: corpo.nome, email, senha: r.senha, telefone: pessoa && pessoa.telefone, jaTinha: r.ja_tinha });
        telaAcessos();
      });
    });
  }

  // Mostra o acesso uma vez só, com a mensagem pronta para o WhatsApp.
  function mostraSenha({ nome, email, senha, telefone, jaTinha }) {
    const txt = jaTinha
      ? `Oi, ${primeiroNome(nome)}! Liberei seu acesso ao painel da Barra Boat: ${linkPainel()} Entre com o e-mail ${email} e a senha que você já usa nesse e-mail.`
      : `Oi, ${primeiroNome(nome)}! Seu acesso ao painel da Barra Boat: ${linkPainel()} E-mail: ${email} Senha: ${senha} No primeiro acesso, troque a senha em Conta.`;
    abreGaveta(jaTinha ? 'Acesso liberado' : 'Acesso criado', `
      ${jaTinha ? '<p style="margin-top:0">Esse e-mail já tinha login em outro sistema nosso. A pessoa entra com a senha que já usa.</p>'
        : `<p style="margin-top:0">Mande agora: a senha não aparece de novo. Se perder, gere uma senha nova.</p>
        <div class="credenciais"><div><span>E-mail</span><b>${esc(email)}</b></div><div><span>Senha</span><b class="credenciais__senha">${esc(senha)}</b></div></div>`}
      <div class="conversa" style="margin-top:14px"><div class="msg msg--nos">${esc(txt)}</div></div>
      <a class="botao botao--wa botao--cheio" href="${linkWa(telefone || '', txt)}" target="_blank" rel="noopener" style="margin-top:14px"><svg><use href="#p-wa"/></svg>Mandar pelo WhatsApp</a>
      <button class="botao botao--leve botao--cheio" type="button" data-copiar style="margin-top:10px">Copiar a mensagem</button>
      ${telefone ? '' : '<p class="ajuda" style="margin-top:12px">Sem telefone no cadastro: o WhatsApp vai pedir para escolher o contato.</p>'}`, (c) => {
      c.querySelector('[data-copiar]').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(txt); avisa('Mensagem copiada.'); } catch (e) { avisa('Não consegui copiar. Selecione o texto e copie.', true); }
      });
    });
  }

  function abreAcesso(x) {
    if (!x) return;
    const eu = x.user_id === S.user.id;
    const pessoa = x.papel === 'parceiro' ? parceiro(x.parceiro_id) : x.papel === 'marinheiro' ? marinheiro(x.marinheiro_id) : null;
    abreGaveta(x.nome, `
      <p style="margin-top:0;color:var(--suave)">${esc(PAPEIS[x.papel][0])} · ${esc(x.email)} · ${x.ultimo_acesso ? 'entrou ' + esc(quando(x.ultimo_acesso)) : 'ainda não entrou'}</p>
      <p class="ajuda">${esc(PAPEIS[x.papel][1])}</p>
      ${eu ? '<a class="botao botao--leve botao--cheio" href="#conta" data-fechar>Trocar minha senha</a>' : `
        ${x.criado_aqui ? '<button class="botao botao--leve botao--cheio" type="button" data-nova-senha>Gerar uma senha nova</button><p class="ajuda" style="margin-top:8px">Para quando a pessoa esqueceu a senha. A antiga para de funcionar.</p>' : '<p class="ajuda">Este e-mail tem login de outro sistema nosso: a senha a pessoa troca por lá.</p>'}
        ${x.papel !== 'dona' ? `<section class="bloco"><h3 style="margin-bottom:6px">Tirar o acesso</h3><p style="margin:0 0 12px;color:var(--suave)">A pessoa não entra mais no painel. Os cadastros e passeios dela continuam.</p>
          <button class="botao botao--perigo-leve" type="button" data-tirar>Tirar o acesso de ${esc(primeiroNome(x.nome))}</button></section>` : ''}`}`, (c) => {
      const ns = c.querySelector('[data-nova-senha]');
      if (ns) aoSalvar(ns, async () => {
        const r = await api('equipe.php', { acao: 'nova_senha', user_id: x.user_id });
        if (!r.ok) { avisa(r.erro || 'Não deu certo. Tente de novo.', true); return; }
        mostraSenha({ nome: x.nome, email: x.email, senha: r.senha, telefone: pessoa && pessoa.telefone });
      });
      const ti = c.querySelector('[data-tirar]');
      if (ti) confirmaNoBotao(ti, 'Toque de novo para tirar', async () => {
        if (!(await grava(sb.from('bb_equipe').delete().eq('user_id', x.user_id)))) return;
        fechaGaveta(); avisa(`${primeiroNome(x.nome)} não acessa mais o painel.`); telaAcessos();
      });
    });
  }

  /* ================= CONTA (todos) ================= */
  function telaConta() {
    const restr = restrito();
    tela.innerHTML = `<header class="cab"><div><h1>${restr ? 'Conta' : 'Sua conta'}</h1><p>${esc(S.nome || '')}${S.nome ? ' · ' : ''}${esc((S.user && S.user.email) || '')}</p></div></header>
      <section class="cartao"><h2 style="font-size:1.1rem;margin-bottom:12px">Trocar a senha</h2>
        <div class="grade-2">
          <label class="campo"><span>Senha nova</span><input type="password" data-s1 autocomplete="new-password" minlength="8"></label>
          <label class="campo"><span>Repita a senha nova</span><input type="password" data-s2 autocomplete="new-password" minlength="8"></label>
        </div>
        <p class="erro" data-erro hidden></p>
        <button class="botao botao--principal" type="button" data-trocar>Trocar a senha</button></section>
      <section class="bloco cartao"><h2 style="font-size:1.1rem;margin-bottom:8px">Usar como aplicativo no celular</h2>
        <p style="margin:0;color:var(--suave)">No iPhone: abra no Safari, toque em Compartilhar e em "Adicionar à Tela de Início". No Android: abra no Chrome, toque nos três pontinhos e em "Instalar app".</p></section>
      <button class="botao botao--leve" type="button" data-sair style="margin-top:20px">Sair do painel</button>`;
    aoSalvar(tela.querySelector('[data-trocar]'), async () => {
      const s1 = tela.querySelector('[data-s1]').value, s2 = tela.querySelector('[data-s2]').value;
      if (s1.length < 8) return erroCampo(tela, 'A senha precisa ter pelo menos 8 letras ou números.');
      if (s1 !== s2) return erroCampo(tela, 'As duas senhas não estão iguais.');
      erroCampo(tela, '');
      const { error } = await sb.auth.updateUser({ password: s1 });
      if (error) { console.error(error); erroCampo(tela, /different|same/i.test(error.message || '') ? 'A senha nova precisa ser diferente da atual.' : msgErro(error)); return; }
      tela.querySelector('[data-s1]').value = ''; tela.querySelector('[data-s2]').value = '';
      avisa('Senha trocada. Use a nova no próximo acesso.');
    });
  }

  /* ================= MARINHEIRO ================= */
  const restrito = () => S.papel === 'parceiro' || S.papel === 'marinheiro';
  const nomeDia = (s) => { const hs = iso(hoje()); return s === hs ? 'Hoje' : s === iso(somaDias(hoje(), 1)) ? 'Amanhã' : `${DIAS_LONGOS[deIso(s).getDay()]}, ${ddIso(s)}`; };

  async function carregaRestrito() {
    if (S.papel === 'marinheiro') { S.escala = await um(sb.rpc('bb_meus_passeios')); return; }
    const [agp, comissoes] = await Promise.all([
      um(sb.rpc('bb_agenda_parceiro', { de: iso(hoje()), ate: iso(somaDias(hoje(), 120)) })),
      um(sb.rpc('bb_minhas_comissoes')).catch(() => []),
    ]);
    S.agp = agp; S.comissoes = comissoes;
  }

  function telaEscala() {
    const hs = iso(hoje());
    const ps = (S.escala || []).filter((p) => p.dia >= hs);
    const dias = [...new Set(ps.map((p) => p.dia))];
    tela.innerHTML = `
      <header class="cab"><div><h1>Seus passeios</h1><p>Olá${S.nome ? ', ' + esc(primeiroNome(S.nome)) : ''}. Os passeios em que você é o marinheiro, dos próximos 60 dias.</p></div>
        <a class="botao botao--wa" href="${linkWa(WA_BARRA, 'Oi, equipe! Aqui é ' + (primeiroNome(S.nome) || 'o marinheiro') + '.')}" target="_blank" rel="noopener"><svg><use href="#p-wa"/></svg>Falar com a equipe</a></header>
      ${dias.length ? dias.map((d) => `<section class="bloco"><h2>${nomeDia(d)}</h2><ul class="lista">${ps.filter((p) => p.dia === d).map((p) => `<li class="linha passeio-m">
          <span class="passeio-m__hora">${p.hora_saida ? hora(p.hora_saida) : 'a definir'}</span>
          <span class="linha__corpo"><b>${esc(p.lancha)}${p.roteiro ? ' · ' + esc(p.roteiro) : ''}</b>
            <span>${esc([p.pessoas ? p.pessoas + ' pessoas' : '', p.cliente ? 'cliente ' + p.cliente : '', Number(p.passageiros) ? `${p.passageiros} na lista de passageiros` : ''].filter(Boolean).join(' · '))}</span>
            <span>Embarque: ${p.embarque_maps ? `<a href="${esc(p.embarque_maps)}" target="_blank" rel="noopener">${esc(p.embarque_local || embPadrao().local)}</a>` : esc(p.embarque_local || embPadrao().local)}</span>
            ${p.personalizado && p.pedido ? `<span>Pedido: ${esc(p.pedido)}</span>` : ''}</span></li>`).join('')}</ul></section>`).join('')
        : '<p class="cartao vazio">Nenhum passeio marcado para você nos próximos 60 dias. Quando a equipe marcar, ele aparece aqui.</p>'}
      <section class="bloco"><h2>Previsão do Windguru <small>próximos 4 dias, vento em km/h</small></h2>
        <div class="cartao windguru"><div data-windguru></div>
          <a class="windguru__link" href="https://www.windguru.cz/${WINDGURU}" target="_blank" rel="noopener">Abrir no Windguru</a></div></section>`;
    montaWindguru();
  }

  /* ================= PARCEIRO ================= */
  let pgIni = 0;
  function lanchasDoParceiro() {
    const m = new Map();
    (S.agp || []).forEach((x) => { if (!m.has(x.lancha_id)) m.set(x.lancha_id, { id: x.lancha_id, nome: x.lancha, passageiros: x.passageiros, propria: x.propria }); });
    return [...m.values()].sort((a, b) => (b.propria - a.propria) || a.nome.localeCompare(b.nome, 'pt-BR'));
  }
  const diaParceiro = (lid, s) => (S.agp || []).filter((x) => x.lancha_id === lid && x.dia === s);

  function telaMinhaAgenda() {
    const ls = lanchasDoParceiro();
    const temPropria = ls.some((l) => l.propria), temRevenda = ls.some((l) => !l.propria);
    const base = somaDias(hoje(), pgIni);
    const dias = Array.from({ length: 14 }, (_, i) => somaDias(base, i));
    const hs = iso(hoje());
    const cab = dias.map((d) => `<th scope="col" class="${iso(d) === hs ? 'is-hoje' : ''} ${d.getDay() % 6 === 0 ? 'is-fds' : ''} ${d.getDate() === 1 ? 'is-mes' : ''}">${DIAS[d.getDay()]}<b>${d.getDate()}</b><small>${MESES[d.getMonth()]}</small></th>`).join('');
    const linhas = ls.map((l) => `<tr><th scope="row">${esc(l.nome)}<small>${l.passageiros} pessoas · ${l.propria ? 'sua' : 'você vende'}</small></th>${dias.map((d) => {
      const s = iso(d), es = diaParceiro(l.id, s);
      const q = `${esc(l.nome)}, ${DIAS[d.getDay()]} ${dd(d)}`;
      const bt = (cls, txt, rot) => `<td><button class="dia dia--${cls}" type="button" data-pdia="${l.id}|${s}" aria-label="${q}, ${rot}"><span>${txt}</span></button></td>`;
      if (!es.length) return bt('livre', 'livre', 'livre');
      const e = es.find((x) => x.motivo === 'passeio') || es.find((x) => x.motivo === 'fechado') || es[0];
      if (!l.propria) return bt('dono', 'ocupada', 'ocupada');
      if (e.motivo === 'passeio') return bt('reservada', e.hora_saida ? hora(e.hora_saida) : 'passeio', 'passeio da Barra Boat');
      if (e.motivo === 'fechado') return bt('fechado', 'fech.', 'agenda da Barra Boat fechada');
      return bt('dono', e.motivo === 'dono' ? 'sua' : 'agenda', 'ocupada por você');
    }).join('')}</tr>`).join('');
    tela.innerHTML = `
      <header class="cab"><div><h1>Agenda</h1><p>Olá${S.nome ? ', ' + esc(primeiroNome(S.nome)) : ''}. ${temPropria ? 'Toque num dia livre da sua lancha para marcar que ela não está disponível.' : 'Toque num dia livre para mandar um pedido à equipe.'}</p></div></header>
      <div class="ag-nav">
        <button class="botao botao--leve botao--pequeno" type="button" data-pg="-14"${pgIni <= 0 ? ' disabled' : ''}><svg><use href="#p-volta"/></svg>Antes</button>
        ${pgIni !== 0 ? '<button class="botao botao--leve botao--pequeno" type="button" data-pg="0">Voltar para hoje</button>' : ''}
        <button class="botao botao--leve botao--pequeno" type="button" data-pg="14"${pgIni >= 112 ? ' disabled' : ''}>Depois<svg><use href="#p-seta"/></svg></button>
      </div>
      <ul class="agenda-legenda">
        ${temPropria ? '<li><i class="amostra amostra--reservada"></i>Passeio da Barra Boat</li><li><i class="amostra amostra--dono"></i>Ocupada por você</li><li><i class="amostra amostra--fechado"></i>Barra Boat fechada</li>' : '<li><i class="amostra amostra--dono"></i>Ocupada</li>'}
        <li><i class="amostra amostra--livre"></i>Livre</li>
      </ul>
      ${ls.length ? `<div class="agenda-grade"><table><thead><tr><th scope="col" class="sr">Lancha</th>${cab}</tr></thead><tbody>${linhas}</tbody></table></div>`
        : '<p class="cartao vazio">Ainda não tem lancha ligada ao seu nome. Fale com a equipe da Barra Boat.</p>'}
      <p class="ajuda" style="margin-top:14px">${temRevenda ? 'Nas lanchas que você vende aparece só se o dia está livre ou ocupado. ' : ''}Os dias ocupados aparecem ocupados no site da Barra Boat.</p>`;
    tela.querySelectorAll('[data-pg]').forEach((b) => b.addEventListener('click', () => {
      pgIni = b.dataset.pg === '0' ? 0 : Math.min(Math.max(pgIni + Number(b.dataset.pg), 0), 112); telaMinhaAgenda();
    }));
    tela.querySelectorAll('[data-pdia]').forEach((b) => b.addEventListener('click', () => abreDiaParceiro(...b.dataset.pdia.split('|'))));
  }

  function abreDiaParceiro(lid, s) {
    const l = lanchasDoParceiro().find((x) => x.id === lid);
    if (!l) return;
    const es = diaParceiro(lid, s);
    const titulo = `${l.nome}: ${nomeDia(s)}`;
    const passeio = es.find((x) => x.motivo === 'passeio'), fechado = es.find((x) => x.motivo === 'fechado');
    const seu = es.find((x) => x.motivo === 'dono'), agenda = es.find((x) => x.motivo === 'agenda');
    const pedido = `Oi, equipe! Aqui é ${primeiroNome(S.nome) || 'o parceiro'}. Tenho um cliente para a ${l.nome} no dia ${ddIso(s)}. Posso fechar?`;
    let corpo;
    if (!l.propria) {
      corpo = es.length ? '<div class="estado estado--sem">Este dia está ocupado.</div>'
        : `<div class="estado"><svg><use href="#p-ok"/></svg>Este dia está livre.</div>
          <a class="botao botao--wa botao--cheio" href="${linkWa(WA_BARRA, pedido)}" target="_blank" rel="noopener" style="margin-top:14px"><svg><use href="#p-wa"/></svg>Mandar o pedido à equipe</a>`;
    } else if (passeio) {
      corpo = `<div class="estado"><svg><use href="#p-ok"/></svg>Passeio da Barra Boat${passeio.hora_saida ? ', saída ' + hora(passeio.hora_saida) : ''}.</div>
        <p style="color:var(--suave)">${esc([passeio.roteiro, passeio.pessoas ? passeio.pessoas + ' pessoas' : ''].filter(Boolean).join(' · ') || 'Detalhes com a equipe.')}</p>
        <a class="botao botao--wa botao--cheio" href="${linkWa(WA_BARRA, `Oi, equipe! Sobre o passeio da ${l.nome} no dia ${ddIso(s)}:`)}" target="_blank" rel="noopener"><svg><use href="#p-wa"/></svg>Falar com a equipe</a>`;
    } else if (fechado) {
      corpo = '<div class="estado estado--sem">A Barra Boat fechou a agenda neste dia.</div>';
    } else if (seu) {
      corpo = `<div class="estado"><svg><use href="#p-ok"/></svg>Você marcou este dia como ocupado.</div>
        <button class="botao botao--principal botao--cheio" type="button" data-liberar style="margin-top:14px">Liberar o dia</button>`;
    } else if (agenda) {
      corpo = '<div class="estado"><svg><use href="#p-ok"/></svg>Ocupado pela sua agenda do Google.</div><p class="ajuda">Para liberar, apague o evento na sua agenda. O painel lê de novo a cada 15 minutos.</p>';
    } else {
      corpo = `<div class="estado"><svg><use href="#p-ok"/></svg>Este dia está livre.</div>
        <p style="color:var(--suave)">Vai usar a lancha ou ela não pode sair? Marque como ocupado: o site mostra o dia ocupado e a Barra Boat não marca passeio nela.</p>
        <button class="botao botao--principal botao--cheio" type="button" data-ocupar>Marcar como ocupado</button>`;
    }
    abreGaveta(titulo, corpo, (c) => {
      const marca = async (ocupado) => {
        if (!(await grava(sb.rpc('bb_parceiro_marca_dia', { p_lancha: lid, p_dia: s, p_ocupado: ocupado })))) return;
        fechaGaveta(); await atualiza(); avisa(ocupado ? `${l.nome} ocupada em ${ddIso(s)}.` : `${ddIso(s)} liberado na ${l.nome}.`);
      };
      const oc = c.querySelector('[data-ocupar]'); if (oc) aoSalvar(oc, () => marca(true));
      const li = c.querySelector('[data-liberar]'); if (li) aoSalvar(li, () => marca(false));
    });
  }

  function telaComissoes() {
    const cs = S.comissoes || [];
    const aPagar = cs.filter((c) => c.status !== 'pago').reduce((s, c) => s + Number(c.valor_comissao || 0), 0);
    const pago = cs.filter((c) => c.status === 'pago').reduce((s, c) => s + Number(c.valor_comissao || 0), 0);
    tela.innerHTML = `
      <header class="cab"><div><h1>Comissões</h1><p>Os passeios que você vendeu e o que a Barra Boat te paga por eles.</p></div></header>
      <div class="numeros"><div class="numero"><span>A receber</span><b>${R(aPagar)}</b></div><div class="numero"><span>Já recebido</span><b>${R(pago)}</b></div></div>
      <ul class="lista" style="margin-top:16px">${cs.map((c) => `<li class="linha"><span class="linha__icone"><svg><use href="#p-dinheiro"/></svg></span>
        <span class="linha__corpo"><b>${R(c.valor_comissao)}${c.lancha ? ' · ' + esc(c.lancha) : ''}</b><span>${c.dia ? 'passeio em ' + ddIso(c.dia) + '/' + c.dia.slice(0, 4) : 'data a definir'} · ${c.status === 'pago' ? 'pago' + (c.pago_em ? ' em ' + ddIso(c.pago_em) : '') : 'a receber'}</span></span></li>`).join('')
        || vazio('Nenhuma venda sua ainda. Quando a equipe registrar uma venda sua, ela aparece aqui.')}</ul>`;
  }

  /* ================= MAIS ================= */
  /* ================= rotas e cliques ================= */
  function rota() {
    if (!S.papel) return;
    const h = (location.hash || '#hoje').slice(1);
    const [base, arg] = h.split('/');
    if (restrito()) {
      const telas = S.papel === 'marinheiro' ? { escala: telaEscala, conta: telaConta } : { 'minha-agenda': telaMinhaAgenda, comissoes: telaComissoes, conta: telaConta };
      const b = telas[base] ? base : Object.keys(telas)[0];
      marcaMenu(b);
      telas[b]();
      return;
    }
    marcaMenu({ lancha: 'lanchas', fotos: 'lanchas', roteiro: 'roteiros', dinheiro: 'relatorios' }[base] || base);
    ({
      hoje: telaHoje, agenda: telaAgenda, clientes: telaClientes, funil: telaFunil, dinheiro: telaDinheiro, relatorios: telaDinheiro, lanchas: telaLanchas,
      embarques: telaEmbarques, mensagens: telaMensagens,
      lancha: () => telaLancha(arg), parceiros: () => telaPessoas('parceiros'), marinheiros: () => telaPessoas('marinheiros'),
      acessos: telaAcessos, conta: telaConta, fotos: () => telaFotos(arg),
      roteiros: telaRoteiros, roteiro: () => telaRoteiro(arg), 'site-textos': telaTextosSite, videos: telaVideos,
    }[base] || telaHoje)();
  }
  // Item atual em destaque no menu lateral e na barra de baixo; na barra, "Menu" fica marcado
  // quando a página está só no menu (Lanchas, Roteiros, Sua conta...).
  function marcaMenu(chave) {
    document.querySelectorAll('[data-nav]').forEach((a) => { if (a.dataset.nav === chave) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const naBarra = [...document.querySelectorAll('.barra [data-nav]')].some((a) => !a.hidden && a.dataset.nav === chave);
    const m = $('.barra [data-abre-menu]');
    if (m && !naBarra) m.setAttribute('aria-current', 'page');
  }

  // Menu no celular: abre deslizando da esquerda; fecha no X, no fundo, no Esc ou ao trocar de página
  function abreMenu() {
    document.body.classList.add('menu-aberto');
    $('.nav__fundo').hidden = false;
    $('[data-abre-menu]').setAttribute('aria-expanded', 'true');
    const atual = $('.nav [aria-current="page"]') || $('.nav .nav__item:not([hidden])');
    if (atual) atual.focus();
  }
  function fechaMenu() {
    if (!document.body.classList.contains('menu-aberto')) return;
    document.body.classList.remove('menu-aberto');
    $('.nav__fundo').hidden = true;
    $('[data-abre-menu]').setAttribute('aria-expanded', 'false');
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-abre-menu]')) { abreMenu(); return; }
    if (e.target.closest('[data-fecha-menu]')) fechaMenu();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechaMenu(); });

  window.addEventListener('hashchange', () => { fechaMenu(); rota(); window.scrollTo(0, 0); tela.focus({ preventScroll: true }); });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-cliente],[data-despesa],[data-dia],[data-etapa],[data-aba-d],[data-conectar],[data-ler-agora],[data-vista-cli],[data-historico],[data-instrucoes],[data-breve],[data-receber],[data-ag],[data-mes],[data-periodo],[data-sair],[data-novo-cliente],[data-pessoa],[data-nova-lancha]');
    if (!t) return;
    const d = t.dataset;
    if (d.cliente) abreCliente(d.cliente);
    else if ('despesa' in d) anotarDespesa();
    else if (d.dia) abreDia(...d.dia.split('|'));
    else if (d.etapa) { etapaAtual = d.etapa; busca = ''; telaFunil(); }
    else if (d.abaD) { abaDinheiro = d.abaD; telaDinheiro(); }
    else if (d.conectar) conectarAgenda(d.conectar);
    else if (d.historico) abreHistorico(d.historico);
    else if (d.lerAgora) {
      if (t.disabled) return;
      t.disabled = true; t.textContent = 'Lendo a agenda';
      lerAgora(d.lerAgora).finally(() => { if (document.contains(t)) { t.disabled = false; t.textContent = 'Ler agora'; } });
    }
    else if (d.instrucoes) instrucoes(d.instrucoes);
    else if (d.receber) anotarRecebimento(d.receber, 'restante');
    else if (d.ag != null) { agIni = d.ag === '0' ? 0 : Math.max(agIni + Number(d.ag), -56); telaAgenda(); }
    else if (d.mes) { mesSel = somaMes(mesSel, Number(d.mes) * PASSO[periodo]); if (mesSel > iso(hoje()).slice(0, 7)) mesSel = iso(hoje()).slice(0, 7); telaDinheiro(); }
    else if (d.periodo) { periodo = d.periodo; telaDinheiro(); }
    else if ('novoCliente' in d) novoCliente();
    else if (t.hasAttribute('data-nova-lancha')) novaLancha();
    else if (d.pessoa) { const [tipo, id] = d.pessoa.split('|'); editaPessoa(tipo, id || null); }
    else if ('sair' in d) sai();
    else if (d.breve) { e.preventDefault(); avisa(d.breve); }
  });

  // Voltou para a aba depois de um tempo: busca de novo (outra pessoa pode ter mudado algo).
  let saiuEm = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { saiuEm = Date.now(); return; }
    if (S.papel && saiuEm && Date.now() - saiuEm > 120000 && gaveta.hidden) atualiza();
  });

  /* ================= entrada (login) ================= */
  const entrada = $('#entrada'), app = $('#app');
  function mostraEntrada(msg) {
    S.papel = null;
    app.hidden = true; entrada.hidden = false;
    const er = $('#entrada-erro'); er.textContent = msg || ''; er.hidden = !msg;
    $('#entrada-email').focus();
  }
  async function sai() { await sb.auth.signOut(); location.hash = ''; mostraEntrada(); }

  $('#entrada-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const bt = $('#entrada-botao');
    bt.disabled = true; bt.textContent = 'Entrando';
    const { data, error } = await sb.auth.signInWithPassword({ email: $('#entrada-email').value.trim(), password: $('#entrada-senha').value });
    bt.disabled = false; bt.textContent = 'Entrar';
    if (error) { mostraEntrada(/fetch|network/i.test(error.message) ? 'Sem conexão. Confira a internet e tente de novo.' : 'E-mail ou senha incorretos.'); return; }
    $('#entrada-senha').value = '';
    entra(data.user);
  });

  // categoria sem nenhum item visível some (ex.: Vendas para o marinheiro)
  function arrumaGrupos() {
    document.querySelectorAll('.nav__grupo').forEach((g) => { g.hidden = !g.querySelector('.nav__item:not([hidden])'); });
  }

  async function entra(user) {
    S.user = user;
    const { data: papel, error } = await sb.rpc('bb_papel');
    if (error || !papel) { await sb.auth.signOut(); mostraEntrada('Este login não tem acesso ao painel da Barra Boat.'); return; }
    S.papel = papel;
    const { data: eu } = await sb.from('bb_equipe').select('nome').eq('user_id', user.id).maybeSingle();
    S.nome = eu ? eu.nome : '';
    // cada papel vê só o próprio menu
    const menu = papel === 'marinheiro' ? ['escala', 'conta'] : papel === 'parceiro' ? ['minha-agenda', 'conta']
      : ['hoje', 'agenda', 'clientes', 'funil', 'lanchas', 'parceiros', 'marinheiros', 'embarques', 'roteiros', 'site-textos', 'videos', 'mensagens', 'robo', 'massa', 'conta', 'menu']
        .concat(dona() ? ['relatorios', 'acessos'] : []);
    document.querySelectorAll('[data-nav]').forEach((a) => { a.hidden = !menu.includes(a.dataset.nav) || (a.hasAttribute('data-so-restrito') && !restrito()); });
    arrumaGrupos();
    entrada.hidden = true; app.hidden = false;
    tela.innerHTML = '<p class="carregando">Carregando o painel</p>';
    try { await carrega(); } catch (err) {
      console.error(err);
      tela.innerHTML = `<p class="cartao vazio">${esc(msgErro(err))}</p><button class="botao botao--leve" type="button" onclick="location.reload()">Tentar de novo</button>`;
      return;
    }
    // comissões só para quem vende passeio (tem lancha de revenda ou já tem comissão)
    if (papel === 'parceiro') {
      const vende = !!((S.comissoes || []).length || (S.agp || []).some((x) => !x.propria));
      document.querySelectorAll('[data-nav="comissoes"]').forEach((a) => { a.hidden = !vende; });
      arrumaGrupos();
    }
    rota();
  }

  sb.auth.getSession().then(({ data: { session } }) => { if (session) entra(session.user); else mostraEntrada(); });
})();
