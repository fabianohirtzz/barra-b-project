/* Barra Boat Floripa | site.js */
(() => {
  'use strict';
  // Textos no idioma da página: nas páginas traduzidas o PHP põe as traduções em window.BB_T
  // (a chave é o texto em português, que tools/i18n.php acha procurando T('...') nestes arquivos).
  const T = (s, v) => { let t = (window.BB_T && window.BB_T[s]) || s; if (v) t = t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)); return t; };
  const IDIOMA = document.documentElement.lang || 'pt-BR';
  const EM_PT = IDIOMA.indexOf('pt') === 0;

  const WA_NUMERO = '5548991153172';
  const WA_PADRAO = T('Olá! Vim pelo site da Barra Boat e gostaria de mais informações.');
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* GTM: quem põe é o PHP, só no domínio oficial (bb_producao em lib/site.php). Aqui não carrega de novo,
     para não contar a visita duas vezes nem sujar as contas de anúncio com a prévia. */

  /* ---------- origem do visitante (vai junto com o clique no WhatsApp) ---------- */
  const origem = (() => {
    try {
      const salva = sessionStorage.getItem('bb_origem');
      if (salva) return salva;
      const p = new URLSearchParams(location.search);
      let o = 'direto';
      if (p.get('gclid') || p.get('gbraid') || p.get('wbraid')) o = 'google-ads';
      else if (p.get('utm_source')) o = [p.get('utm_source'), p.get('utm_medium')].filter(Boolean).join('/');
      else if (document.referrer) {
        const r = new URL(document.referrer).hostname;
        if (/google\./.test(r)) o = 'google-organico';
        else if (/instagram\./.test(r)) o = 'instagram';
        else if (/facebook\.|fb\./.test(r)) o = 'facebook';
        else if (/tiktok\./.test(r)) o = 'tiktok';
        else if (!r.includes(location.hostname)) o = 'site:' + r;
      }
      sessionStorage.setItem('bb_origem', o);
      return o;
    } catch { return 'direto'; }
  })();

  // data no jeito do idioma ("30/11/2026" em português, "November 30, 2026" em inglês)
  const dataLonga = (iso) => (EM_PT ? iso.split('-').reverse().join('/') : new Date(iso + 'T12:00:00').toLocaleDateString(IDIOMA, { day: 'numeric', month: 'long', year: 'numeric' }));
  const resumoPt = (pares) => {
    const cod = (document.querySelector('[data-idioma-cod][aria-current="true"]') || {}).textContent || IDIOMA;
    return '[Resumo em português] ' + pares.filter((p) => p[1]).map((p) => p[0] + ': ' + p[1]).join(' | ') + ' | Idioma do cliente: ' + cod.replace(/^[A-Z]{2}/, '');
  };
  window.BBresumoPt = resumoPt;
  window.BBdataLonga = dataLonga;
  const linkWa = (texto) => `https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(texto)}`;
  $$('[data-wa]').forEach((a) => { a.href = linkWa(a.dataset.waTexto || WA_PADRAO); });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="wa.me/"]');
    if (!a) return;
    (window.dataLayer = window.dataLayer || []).push({ event: 'clique_whatsapp', origem, pagina: location.pathname });
  });

  /* ---------- ano ---------- */
  $$('[data-ano]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* =========================================================
     MAR: ondas em traço fino + uma lancha cruzando de vez em quando
     ========================================================= */
  const canvas = $('.mar');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const fundo = document.createElement('canvas');
    const fctx = fundo.getContext('2d');
    let W = 0, H = 0, dpr = 1;

    // aleatório determinístico: o mar desenhado é sempre o mesmo
    let sem = 7;
    const rnd = () => { sem = (sem * 16807) % 2147483647; return (sem - 1) / 2147483646; };

    function desenhaMar() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      [canvas, fundo].forEach((c) => { c.width = W * dpr; c.height = H * dpr; });
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fctx.clearRect(0, 0, W, H);
      sem = 7;
      const passo = W < 700 ? 64 : 72;
      fctx.lineCap = 'round';
      for (let y = passo * .6; y < H + passo; y += passo) {
        const lambda = 120 + rnd() * 70;       // comprimento da onda
        const amp = 2.6 + rnd() * 2.2;         // altura da onda
        const fase = rnd() * Math.PI * 2;
        const yy = y + (rnd() - .5) * 18;
        // a linha vem quebrada em trechos, como mar desenhado à mão
        let x = -40 + rnd() * 120;
        while (x < W + 40) {
          const trecho = 90 + rnd() * 380;
          const forte = rnd() > .82;
          fctx.beginPath();
          for (let xi = x; xi <= x + trecho; xi += 4) {
            const yi = yy + Math.sin((xi / lambda) * Math.PI * 2 + fase) * amp;
            xi === x ? fctx.moveTo(xi, yi) : fctx.lineTo(xi, yi);
          }
          fctx.strokeStyle = forte ? 'rgba(24,96,140,.11)' : 'rgba(24,96,140,.065)';
          fctx.lineWidth = forte ? 1.3 : 1;
          fctx.stroke();
          x += trecho + 50 + rnd() * 260;
        }
      }
      pinta();
    }
    function pinta() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(fundo, 0, 0);
    }

    /* a lancha vista de cima: proa à direita (+x) */
    function casco(c) {
      c.beginPath();
      c.moveTo(19, 0);
      c.bezierCurveTo(14, -5.6, 6, -7, -2, -7);
      c.lineTo(-16.5, -6.6);
      c.quadraticCurveTo(-19, -6.6, -19, -4.4);
      c.lineTo(-19, 4.4);
      c.quadraticCurveTo(-19, 6.6, -16.5, 6.6);
      c.lineTo(-2, 7);
      c.bezierCurveTo(6, 7, 14, 5.6, 19, 0);
      c.closePath();
      c.fillStyle = 'rgba(255,255,255,.95)'; c.fill();
      c.strokeStyle = 'rgba(8,51,89,.5)'; c.lineWidth = 1; c.stroke();
      // vinco da proa
      c.beginPath(); c.moveTo(17.5, 0); c.lineTo(5, 0);
      c.strokeStyle = 'rgba(8,51,89,.22)'; c.lineWidth = .8; c.stroke();
      // cockpit
      c.beginPath(); c.roundRect(-14.5, -4.6, 14, 9.2, 2.6);
      c.fillStyle = 'rgba(24,96,140,.22)'; c.fill();
      // para-brisa
      c.beginPath(); c.moveTo(1.5, -5.6); c.quadraticCurveTo(6.5, 0, 1.5, 5.6);
      c.strokeStyle = 'rgba(8,51,89,.6)'; c.lineWidth = 1.6; c.stroke();
      // motor de popa
      c.beginPath(); c.roundRect(-23, -2.3, 4, 4.6, 1);
      c.fillStyle = 'rgba(8,51,89,.55)'; c.fill();
    }

    let viagem = null;
    const VIDA = 4200; // quanto tempo a esteira leva para sumir
    function novaViagem() {
      const daEsquerda = Math.random() > .5;
      const y0 = H * (.18 + Math.random() * .64);
      viagem = {
        x0: daEsquerda ? -60 : W + 60, x1: daEsquerda ? W + 60 : -60,
        y0, y1: y0 + (Math.random() - .5) * H * .25, curva: (Math.random() - .5) * 90,
        inicio: performance.now(), dur: (W + 120) / (85 + Math.random() * 25) * 1000,
        rastro: [], fim: null,
      };
      requestAnimationFrame(quadro);
    }
    const ponto = (v, t) => ({
      x: v.x0 + (v.x1 - v.x0) * t,
      y: v.y0 + (v.y1 - v.y0) * t + Math.sin(t * Math.PI) * v.curva,
    });

    function quadro(agora) {
      const v = viagem; if (!v) return;
      const t = Math.min((agora - v.inicio) / v.dur, 1);
      const p = ponto(v, t), q = ponto(v, Math.min(t + .003, 1));
      const ang = Math.atan2(q.y - p.y, q.x - p.x);
      // a esteira nasce na popa, não no meio do barco
      const popa = { x: p.x - Math.cos(ang) * 22, y: p.y - Math.sin(ang) * 22, ang, t: agora };
      if (t < 1) v.rastro.push(popa); else if (!v.fim) v.fim = agora;
      while (v.rastro.length && agora - v.rastro[0].t > VIDA) v.rastro.shift();

      pinta();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      const R = v.rastro;
      for (let i = 1; i < R.length; i++) {
        const a = R[i - 1], b = R[i];
        const idade = (agora - b.t) / VIDA;      // 0 = recém deixado, 1 = sumindo
        const alfa = Math.pow(1 - idade, 1.6);
        // espuma do motor: larga e clara perto da popa, afina com a idade
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(255,255,255,${.75 * alfa})`;
        ctx.lineWidth = 5.5 * (1 - idade) + 1; ctx.stroke();
        ctx.strokeStyle = `rgba(24,96,140,${.16 * alfa})`;
        ctx.lineWidth = 1; ctx.stroke();
        // as duas ondas laterais: abrem pouco, como esteira de lancha
        const abre = 5 + idade * 26;
        for (const lado of [-1, 1]) {
          const nx = Math.cos(b.ang + Math.PI / 2) * lado, ny = Math.sin(b.ang + Math.PI / 2) * lado;
          const ma = Math.cos(a.ang + Math.PI / 2) * lado, mb = Math.sin(a.ang + Math.PI / 2) * lado;
          const abreA = 5 + ((agora - a.t) / VIDA) * 26;
          ctx.beginPath();
          ctx.moveTo(a.x + ma * abreA, a.y + mb * abreA);
          ctx.lineTo(b.x + nx * abre, b.y + ny * abre);
          ctx.strokeStyle = `rgba(24,96,140,${.2 * alfa})`;
          ctx.lineWidth = 1; ctx.stroke();
        }
      }
      if (t < 1) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
        // marola da proa
        ctx.beginPath(); ctx.moveTo(23, 0); ctx.quadraticCurveTo(12, -11, 2, -11.5);
        ctx.moveTo(23, 0); ctx.quadraticCurveTo(12, 11, 2, 11.5);
        ctx.strokeStyle = 'rgba(24,96,140,.18)'; ctx.lineWidth = 1; ctx.stroke();
        casco(ctx);
        ctx.restore();
      }
      if (v.fim && agora - v.fim > VIDA + 100) { viagem = null; pinta(); agenda(); return; }
      requestAnimationFrame(quadro);
    }
    function agenda(primeira) {
      if (reduz) return;
      setTimeout(() => {
        if (document.hidden || document.body.classList.contains('menu-aberto')) return agenda();
        novaViagem();
      }, primeira ? 2500 : 12000 + Math.random() * 12000);
    }

    let espera;
    window.addEventListener('resize', () => {
      clearTimeout(espera);
      espera = setTimeout(() => { if (Math.abs(window.innerWidth - W) > 2 || Math.abs(window.innerHeight - H) > 120) desenhaMar(); }, 150);
    });
    desenhaMar(); agenda(true);
  }

  /* =========================================================
     CABEÇALHO
     ========================================================= */
  const topo = $('[data-topo]');
  const hero = $('.hero, .capa');   // páginas sem capa escura já abrem com o cabeçalho sólido
  const flutuante = $('.wa-flutuante');
  let ancora = window.scrollY;   // ponto onde a direção mudou pela última vez
  let escondido = false;
  // O cabeçalho fica transparente sobre a capa só enquanto não encosta no texto dela;
  // antes de o texto passar por baixo do logo, ele fica sólido.
  const primeiroTexto = hero && hero.querySelector('.migalhas, h1');
  let limite = 80;
  function medeLimite() {
    if (!hero) return;
    limite = Math.min(hero.offsetHeight * .55, 520);
    if (primeiroTexto) {
      const topoTexto = primeiroTexto.getBoundingClientRect().top + window.scrollY;
      limite = Math.max(0, Math.min(limite, topoTexto - topo.offsetHeight - 12));
    }
  }
  medeLimite();
  window.addEventListener('resize', () => { medeLimite(); aoRolar(); });
  window.addEventListener('load', () => { medeLimite(); aoRolar(); });
  function aoRolar() {
    const y = window.scrollY;
    topo.classList.toggle('is-solido', !hero || y > limite);
    if (!document.body.classList.contains('menu-aberto')) {
      if (y < 600) { escondido = false; ancora = y; }
      else if (!escondido && y - ancora > 60) { escondido = true; ancora = y; }    // desceu 60px: some
      else if (escondido && ancora - y > 30) { escondido = false; ancora = y; }    // subiu 30px: volta
      else if ((escondido && y > ancora) || (!escondido && y < ancora)) ancora = y; // segue a mesma direção
      topo.classList.toggle('is-escondido', escondido);
    }
    if (flutuante) flutuante.classList.toggle('is-oculto', !!hero && y < hero.offsetHeight * .7);
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  /* =========================================================
     MENU: A ROTA
     ========================================================= */
  const rota = $('[data-rota]');
  const abre = $('[data-abre-menu]');
  if (rota && abre) {
    const barco = $('.rota__barco', rota);
    const trilha = $('.rota__trilha', rota);
    const paradas = $$('.rota__parada', rota);

    function navegaAte(parada) {
      paradas.forEach((p) => p.classList.toggle('is-foco', p === parada));
      const link = parada.querySelector('a');
      const y = Math.max(0, link.getBoundingClientRect().top - trilha.getBoundingClientRect().top + link.offsetHeight / 2 - 23);
      barco.style.setProperty('--barco-y', y + 'px');
    }
    paradas.forEach((p) => {
      p.addEventListener('mouseenter', () => navegaAte(p));
      p.addEventListener('focusin', () => navegaAte(p));
    });

    /* ondas do fundo do menu: linhas inteiras, de borda a borda, ondulando devagar */
    const cv = $('.rota__ondas', rota);
    const oc = cv.getContext('2d');
    let rodando = false, linhas = [];
    function preparaOndas() {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = innerWidth * d; cv.height = innerHeight * d;
      oc.setTransform(d, 0, 0, d, 0, 0);
      linhas = [];
      const passo = innerWidth < 700 ? 46 : 54;
      for (let y = 30, k = 0; y < innerHeight + 40; y += passo, k++) {
        linhas.push({ y, k, lambda: 260 + (k % 3) * 70, amp: 7 + (k % 4) * 2.5, vel: .00018 + (k % 5) * .00004 });
      }
    }
    function desenhaOndas(t) {
      const w = innerWidth, h = innerHeight;
      oc.clearRect(0, 0, w, h);
      oc.lineWidth = 1;
      for (const L of linhas) {
        oc.beginPath();
        for (let x = 0; x <= w; x += 6) {
          // a altura da onda cresce e diminui ao longo da linha (envelope), como mar de verdade
          const env = .55 + .45 * Math.sin(x / (w * .9) * Math.PI * 1.3 + L.k * .7);
          const y = L.y
            + Math.sin((x / L.lambda) * Math.PI * 2 + t * L.vel * 6 + L.k) * L.amp * env
            + Math.sin((x / (L.lambda * 2.7)) * Math.PI * 2 - t * L.vel * 3) * 4;
          x === 0 ? oc.moveTo(x, y) : oc.lineTo(x, y);
        }
        oc.strokeStyle = L.k % 4 === 0 ? 'rgba(143,198,227,.22)' : 'rgba(143,198,227,.11)';
        oc.stroke();
      }
    }
    function animaOndas(t) {
      if (!rodando) return;
      desenhaOndas(t);
      if (!reduz) requestAnimationFrame(animaOndas);
    }
    window.addEventListener('resize', () => { if (rodando) { preparaOndas(); desenhaOndas(performance.now()); } });

    let viaTeclado = false;
    rota.tabIndex = -1;
    abre.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') viaTeclado = true; });
    abre.addEventListener('pointerdown', () => { viaTeclado = false; });
    function abrir() {
      const r = abre.getBoundingClientRect();
      rota.style.setProperty('--ox', r.left + r.width / 2 + 'px');
      rota.style.setProperty('--oy', r.top + r.height / 2 + 'px');
      rota.hidden = false;
      preparaOndas(); rodando = true; requestAnimationFrame(animaOndas);
      document.body.classList.add('menu-aberto');
      abre.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        rota.classList.add('is-aberta');
        const atual = paradas.find((p) => p.querySelector('[aria-current]')) || paradas[0];
        setTimeout(() => navegaAte(atual), 60);
        // com teclado o foco vai para o primeiro link; com mouse, para o próprio painel (sem contorno)
        (viaTeclado ? rota.querySelector('.rota__parada a') : rota).focus({ preventScroll: true });
      }));
    }
    function fechar() {
      rota.classList.remove('is-aberta');
      abre.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-aberto');
      setTimeout(() => { rota.hidden = true; rodando = false; }, reduz ? 0 : 650);
      abre.focus({ preventScroll: true });
    }
    abre.addEventListener('click', abrir);
    $('[data-fecha-menu]', rota).addEventListener('click', fechar);
    rota.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) fechar(); });
    document.addEventListener('keydown', (e) => {
      if (rota.hidden) return;
      if (e.key === 'Escape') fechar();
      if (e.key === 'Tab') {
        const foco = $$('a,button', rota).filter((el) => el.offsetParent !== null);
        const prim = foco[0], ult = foco[foco.length - 1];
        if (e.shiftKey && document.activeElement === prim) { e.preventDefault(); ult.focus(); }
        else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); prim.focus(); }
      }
    });
  }

  /* =========================================================
     SELETOR: a lista suspensa com o tema do site
     O <select> de verdade continua no formulário (é ele que guarda o valor e que o PHP preenche);
     por cima vai um botão e uma lista acessível. Mudou o select por código? Dispare "change".
     ========================================================= */
  let seq = 0;
  const escH = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function montaSeletor(sel) {
    if (sel.dataset.seletor) return;
    sel.dataset.seletor = '1';
    const id = 'sel' + (++seq);
    const rotulo = sel.closest('label');
    const txtRotulo = rotulo && rotulo.querySelector(':scope > span:first-child');
    if (txtRotulo && !txtRotulo.id) txtRotulo.id = id + '-rot';
    const caixa = document.createElement('div');
    caixa.className = 'seletor';
    caixa.innerHTML = `<button type="button" class="seletor__botao" id="${id}-bt" aria-haspopup="listbox" aria-expanded="false"${txtRotulo ? ` aria-labelledby="${txtRotulo.id} ${id}-bt"` : ''}>
        <span class="seletor__valor"></span><span class="seletor__seta" aria-hidden="true"></span></button>
      <ul class="seletor__lista" id="${id}-lista" role="listbox" tabindex="-1" hidden${txtRotulo ? ` aria-labelledby="${txtRotulo.id}"` : ''}></ul>`;
    sel.parentNode.insertBefore(caixa, sel);
    sel.classList.add('seletor__nativo');
    sel.parentNode.classList.add('com-seletor');
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');
    const bt = $('.seletor__botao', caixa), lista = $('.seletor__lista', caixa), valor = $('.seletor__valor', caixa);
    // "Phantom 36, até 13 pessoas" vira nome + detalhe à direita
    const partes = (op) => { const m = op.textContent.match(/^(.*?), (até \d+ pessoas?)$/); return m ? [m[1], m[2]] : [op.textContent, '']; };
    let ativa = 0;
    const ops = () => [...sel.options];
    // opção escondida (o "Escolha a lancha" do começo) não entra na lista
    const prim = () => Math.max(0, ops().findIndex((op) => !op.hidden));
    function desenha() {
      lista.innerHTML = ops().map((op, i) => {
        if (op.hidden) return '';
        const [nome, det] = partes(op);
        return `<li role="option" id="${id}-o${i}" data-i="${i}" class="seletor__op" aria-selected="${op.selected}"${op.disabled ? ' aria-disabled="true"' : ''}>
          <span>${escH(nome)}</span>${det ? `<small>${escH(det)}</small>` : ''}</li>`;
      }).join('');
      const op = sel.selectedOptions[0];
      const [nome, det] = op ? partes(op) : ['', ''];
      valor.innerHTML = `${escH(nome)}${det ? `<small>${escH(det)}</small>` : ''}`;
      valor.classList.toggle('is-vazio', !op || !op.value);
    }
    const marca = (i) => {
      ativa = Math.max(prim(), Math.min(ops().length - 1, i));
      $$('.seletor__op', lista).forEach((li) => li.classList.toggle('is-ativa', Number(li.dataset.i) === ativa));
      lista.setAttribute('aria-activedescendant', `${id}-o${ativa}`);
      const li = $(`#${id}-o${ativa}`, lista);
      if (li) li.scrollIntoView({ block: 'nearest' });
    };
    function abre() {
      if (!lista.hidden) return;
      desenha();
      lista.hidden = false;
      bt.setAttribute('aria-expanded', 'true');
      caixa.classList.add('is-aberto');
      // abre para cima quando não cabe embaixo; dentro do popup, mede pelo popup (que corta o que sai dele)
      const r = bt.getBoundingClientRect();
      const moldura = caixa.closest('.reserva__caixa');
      const m = moldura ? moldura.getBoundingClientRect() : { top: 0, bottom: innerHeight };
      const baixo = Math.min(m.bottom, innerHeight) - r.bottom - 12, cima = r.top - Math.max(m.top, 0) - 12;
      const acima = baixo < 220 && cima > baixo;
      caixa.classList.toggle('is-acima', acima);
      lista.style.maxHeight = Math.max(150, Math.min(320, acima ? cima : baixo)) + 'px';
      marca(Math.max(prim(), sel.selectedIndex));
      lista.focus({ preventScroll: true });
    }
    function fecha(devolve = true) {
      if (lista.hidden) return;
      lista.hidden = true;
      bt.setAttribute('aria-expanded', 'false');
      caixa.classList.remove('is-aberto', 'is-acima');
      if (devolve) bt.focus({ preventScroll: true });
    }
    function escolhe(i) {
      const op = ops()[i];
      if (!op || op.disabled) return;
      if (sel.selectedIndex !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      desenha(); fecha();
    }
    bt.addEventListener('click', () => (lista.hidden ? abre() : fecha()));
    bt.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); abre(); }
    });
    let busca = '', tBusca;
    lista.addEventListener('keydown', (e) => {
      const n = ops().length;
      if (e.key === 'ArrowDown') { e.preventDefault(); marca(ativa + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marca(ativa - 1); }
      else if (e.key === 'Home') { e.preventDefault(); marca(prim()); }
      else if (e.key === 'End') { e.preventDefault(); marca(n - 1); }
      else if (e.key === 'PageDown') { e.preventDefault(); marca(ativa + 6); }
      else if (e.key === 'PageUp') { e.preventDefault(); marca(ativa - 6); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); escolhe(ativa); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fecha(); }
      else if (e.key === 'Tab') { escolhe(ativa); }
      else if (e.key.length === 1 && /\S/.test(e.key)) {
        // digitar as primeiras letras pula para a opção
        clearTimeout(tBusca); busca += e.key.toLowerCase(); tBusca = setTimeout(() => { busca = ''; }, 700);
        const tira = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        const k = ops().findIndex((op, j) => j >= prim() && !op.hidden && tira(op.textContent).startsWith(tira(busca)));
        if (k >= 0) marca(k);
      }
    });
    // preventDefault: dentro de um <label>, o clique numa opção seria repassado ao botão e reabriria a lista
    lista.addEventListener('click', (e) => { e.preventDefault(); const li = e.target.closest('.seletor__op'); if (li) escolhe(Number(li.dataset.i)); });
    lista.addEventListener('mousemove', (e) => { const li = e.target.closest('.seletor__op'); if (li) { const k = Number(li.dataset.i); if (k !== ativa) marca(k); } });
    document.addEventListener('pointerdown', (e) => { if (!caixa.contains(e.target)) fecha(false); });
    lista.addEventListener('focusout', (e) => { if (!caixa.contains(e.relatedTarget)) fecha(false); });
    sel.addEventListener('change', desenha);
    desenha();
  }
  $$('.planejar__select select, .campo select').forEach(montaSeletor);

  /* =========================================================
     PLANEJADOR: monta a mensagem do WhatsApp já qualificada.
     O mesmo formulário está na capa da home e no popup de reserva (todas as páginas).
     ========================================================= */
  function montaPlanejador(plan) {
    const out = $('[data-pessoas]', plan);
    const data = $('[data-data]', plan);
    const hoje = new Date(); hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
    data.min = hoje.toISOString().slice(0, 10);
    let n = Number(out.textContent) || 6;
    // Lancha é obrigatória; se o grupo passar do limite dela, avisa para escolher outra.
    const sel = $('[data-lancha]', plan);
    const maxFrota = Math.max(1, ...[...sel.options].map((o) => Number(o.dataset.pax) || 0));
    const limite = $('[data-limite]', plan);
    const limiteTxt = $('[data-limite-txt]', plan);
    const confere = () => {
      const op = sel.selectedOptions[0];
      const max = Number(op && op.dataset.pax);
      const passou = sel.value && n > max;
      limite.hidden = !passou;
      if (passou) limiteTxt.textContent = T('A {lancha} leva até {max} pessoas, e o seu grupo tem {n}. Escolha uma lancha maior.', { lancha: sel.value, max, n });
    };
    const poe = (v) => { n = Math.min(maxFrota, Math.max(1, v)); out.textContent = n; confere(); };
    $('[data-menos]', plan).addEventListener('click', () => poe(n - 1));
    $('[data-mais]', plan).addEventListener('click', () => poe(n + 1));
    sel.addEventListener('change', confere);
    // Personalizado: pergunta se a lancha busca o grupo em outro lugar e abre espaço para o pedido
    const pers = $('[data-pers]', plan), local = $('[data-desloc-local]', plan);
    const mostraPers = () => {
      pers.hidden = plan.roteiro.value !== 'Personalizado';
      local.hidden = pers.hidden || plan.desloc.value !== 'sim';
    };
    $$('[name="roteiro"], input[name="desloc"]', plan).forEach((r) => r.addEventListener('change', mostraPers));
    mostraPers();
    plan.addEventListener('submit', (e) => {
      e.preventDefault();
      const chama = () => { limite.hidden = false; limite.classList.remove('is-chamando'); void limite.offsetWidth; limite.classList.add('is-chamando'); };
      if (!sel.value) { limiteTxt.textContent = T('Escolha a lancha para consultar datas e valores.'); chama(); const b = $('.seletor__botao', plan); (b || sel).focus(); return; }
      if (!limite.hidden) { chama(); return; }
      const roteiro = plan.roteiro.value;
      const dia = data.value ? dataLonga(data.value) : null;
      const pessoas = n === 1 ? T('1 pessoa') : T('{n} pessoas', { n });
      const ondeBuscar = roteiro === 'Personalizado' && plan.desloc.value === 'sim' ? (plan.local.value.trim() || T('a combinar')) : '';
      let trecho;
      if (roteiro === 'Personalizado') {
        const pedido = plan.pedido.value.trim();
        trecho = T('Quero um passeio personalizado.')
          + ' ' + (ondeBuscar ? T('Preciso que a lancha busque o grupo em outro lugar: {local}.', { local: ondeBuscar }) : T('Podemos embarcar no ponto de vocês.'))
          + (pedido ? ' ' + T('Como quero o passeio: {pedido}', { pedido }) + (/[.!?。！？]$/.test(pedido) ? '' : '.') : '');
      } else trecho = T('Quero consultar um passeio para a {roteiro}.', { roteiro });
      const barco = T('Lancha: {lancha}.', { lancha: sel.value });
      let texto = [T('Olá! Vim pelo site da Barra Boat.'), trecho, barco, T('Data: {data}.', { data: dia || T('ainda a definir') }), T('Somos {pessoas}.', { pessoas })].join(' ');
      // site em outro idioma: a equipe recebe também um resumo em português
      if (!EM_PT) texto += '\n\n' + resumoPt([['Roteiro', roteiro], ['Lancha', sel.value], ['Data', data.value ? data.value.split('-').reverse().join('/') : 'a definir'], ['Pessoas', String(n)], ['Buscar o grupo em', ondeBuscar]]);
      (window.dataLayer = window.dataLayer || []).push({ event: 'clique_whatsapp', origem, pagina: location.pathname, formulario: plan.classList.contains('planejar--popup') ? 'popup' : 'planejar' });
      window.open(linkWa(texto), '_blank', 'noopener');
    });
    // preenchimento vindo de fora (popup aberto pela página de uma lancha ou de um roteiro)
    plan.preenche = ({ lancha, roteiro, dia } = {}) => {
      if (lancha) {
        const tira = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
        const op = [...sel.options].find((o) => o.value && tira(o.value) === tira(lancha));
        if (op && !op.selected) { sel.value = op.value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      }
      if (roteiro) {
        // pelo nome ou pelo endereço (slug) do roteiro; a lista suspensa é o <select name="roteiro">
        const rs = plan.roteiro, tira = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
        const op = rs && [...rs.options].find((o) => tira(o.value) === tira(roteiro) || o.dataset.slug === roteiro);
        if (op && !op.selected) { rs.value = op.value; rs.dispatchEvent(new Event('change', { bubbles: true })); }
        mostraPers();
      }
      if (dia && dia >= data.min) data.value = dia;
      confere();
    };
  }
  $$('[data-planejar]').forEach(montaPlanejador);

  /* =========================================================
     RESERVA: até o robô de atendimento existir, todo botão de WhatsApp abre o formulário
     num popup; o formulário monta a mensagem e aí sim abre o WhatsApp.
     Fica direto só o que tem data-wa-direto (o número no rodapé) e links no meio de texto.
     ========================================================= */
  const reserva = $('[data-reserva]');
  if (reserva) {
    const caixa = $('.reserva__caixa', reserva);
    const form = $('[data-planejar]', reserva);
    let voltaFoco = null, fechando;
    const focaveis = () => $$('button, a[href], input, select:not([tabindex="-1"]), textarea, [tabindex]:not([tabindex="-1"])', caixa)
      .filter((el) => !el.disabled && el.offsetParent !== null && !el.closest('[hidden]'));
    // de onde veio o clique: lancha da página, roteiro da página ou do texto do botão
    function contexto(a) {
      const c = {};
      const txt = (a.dataset.waTexto || a.dataset.waBase || '').toLowerCase();
      if (a.dataset.reservaRoteiro) c.roteiro = a.dataset.reservaRoteiro;
      else if (/personalizado/.test(txt)) c.roteiro = 'Personalizado';
      else if (/costa da lagoa/.test(txt) || /\/costa-da-lagoa\//.test(location.pathname)) c.roteiro = 'Costa da Lagoa';
      else if (/campeche/.test(txt) || /\/ilha-do-campeche\//.test(location.pathname)) c.roteiro = 'Ilha do Campeche';
      else {
        // página de um roteiro cadastrado no painel: o endereço é o slug da opção
        const slug = location.pathname.split('/').filter(Boolean).pop();
        if (slug && $(`[name="roteiro"] option[data-slug="${CSS.escape(slug)}"]`, form)) c.roteiro = slug;
      }
      const ag = $('[data-agenda][data-nome]');
      if (a.dataset.reservaLancha) c.lancha = a.dataset.reservaLancha;
      else if (ag) c.lancha = ag.dataset.nome;
      if (a.dataset.dia) c.dia = a.dataset.dia;
      return c;
    }
    function abreReserva(a) {
      clearTimeout(fechando);
      voltaFoco = a || document.activeElement;
      if (a) form.preenche(contexto(a));
      reserva.hidden = false;
      document.documentElement.classList.add('reserva-aberta');
      requestAnimationFrame(() => {
        reserva.classList.add('is-aberta');
        const primeiro = focaveis()[0];
        (primeiro || caixa).focus({ preventScroll: true });
      });
      (window.dataLayer = window.dataLayer || []).push({ event: 'abre_reserva', origem, pagina: location.pathname });
    }
    function fechaReserva() {
      if (reserva.hidden) return;
      reserva.classList.remove('is-aberta');
      document.documentElement.classList.remove('reserva-aberta');
      fechando = setTimeout(() => { reserva.hidden = true; }, reduz ? 0 : 260);
      if (voltaFoco && document.contains(voltaFoco)) voltaFoco.focus({ preventScroll: true });
    }
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = e.target.closest('[data-wa], [data-agenda-cta], a.botao[href*="wa.me/"], [data-reserva-abre]');
      if (!a || a.hasAttribute('data-wa-direto') || a.closest('[data-reserva]')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      abreReserva(a);
    }, true);
    $$('[data-reserva-fecha]', reserva).forEach((b) => b.addEventListener('click', fechaReserva));
    reserva.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); fechaReserva(); return; }
      if (e.key !== 'Tab') return;
      const f = focaveis(); if (!f.length) return;
      const prim = f[0], ult = f[f.length - 1];
      if (e.shiftKey && document.activeElement === prim) { e.preventDefault(); ult.focus(); }
      else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); prim.focus(); }
    });
    // enviou: o WhatsApp abre em outra aba e o popup fecha
    form.addEventListener('submit', () => { setTimeout(() => { if ($('[data-limite]', form).hidden) fechaReserva(); }, 0); });
  }

  /* =========================================================
     ROTEIROS: com mais de 2, a home mostra uma galeria (o PHP monta); as setas andam um card
     ========================================================= */
  $$('[data-rot-galeria]').forEach((gal) => {
    const tr = $('[data-rot-trilho]', gal), volta = $('[data-rot-volta]', gal), vai = $('[data-rot-vai]', gal);
    if (!tr || !volta || !vai) return;
    const passo = () => { const c = tr.querySelector('.roteiro'); return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(tr).columnGap || 0) : tr.clientWidth; };
    const setas = () => {
      volta.disabled = tr.scrollLeft < 8;
      vai.disabled = tr.scrollLeft + tr.clientWidth > tr.scrollWidth - 8;
    };
    volta.addEventListener('click', () => tr.scrollBy({ left: -passo(), behavior: reduz ? 'auto' : 'smooth' }));
    vai.addEventListener('click', () => tr.scrollBy({ left: passo(), behavior: reduz ? 'auto' : 'smooth' }));
    tr.addEventListener('scroll', setas, { passive: true });
    addEventListener('resize', setas);
    setas();
  });

  /* =========================================================
     LANCHAS: filtro por grupo + setas do trilho
     ========================================================= */
  const trilho = $('[data-trilho]');
  const grade = $('[data-grade-lanchas]');   // página /lanchas/: mesma lista em grade
  const caixa = trilho || grade;
  if (caixa) {
    const cards = $$('.lancha', caixa);
    let setas = () => {};
    if (trilho) {
      const volta = $('[data-trilho-volta]');
      const vai = $('[data-trilho-vai]');
      setas = () => {
        volta.disabled = trilho.scrollLeft < 8;
        vai.disabled = trilho.scrollLeft + trilho.clientWidth > trilho.scrollWidth - 8;
      };
      const anda = (dir) => {
        const c = cards.find((x) => !x.hidden);
        const w = c ? c.offsetWidth + 20 : 300;
        trilho.scrollBy({ left: dir * w * 2, behavior: reduz ? 'auto' : 'smooth' });
      };
      volta.addEventListener('click', () => anda(-1));
      vai.addEventListener('click', () => anda(1));
      trilho.addEventListener('scroll', setas, { passive: true });
      window.addEventListener('resize', setas);
      setas();
    }

    const faixas = { 0: [1, 99], 7: [1, 7], 10: [8, 10], 13: [11, 99] };
    const contagem = $('[data-contagem]');
    $$('[data-filtro] button').forEach((b) => b.addEventListener('click', () => {
      $$('[data-filtro] button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const [min, max] = faixas[b.dataset.pax];
      cards.forEach((c) => { const p = +c.dataset.pax; c.hidden = p < min || p > max; });
      if (contagem) {
        const n = cards.filter((c) => !c.hidden).length;
        contagem.textContent = n === 1 ? T('1 lancha') : T('{n} lanchas', { n });
      }
      if (trilho) trilho.scrollTo({ left: 0 });
      setas();
    }));
  }

  /* =========================================================
     IDIOMA: o botão do cabeçalho abre a lista; nas páginas em português, quem tem o navegador
     em outro idioma do site recebe uma sugestão discreta (uma vez; a escolha fica guardada).
     ========================================================= */
  const idi = $('[data-idioma]');
  if (idi) {
    const bt = $('[data-idioma-botao]', idi), lista = $('.idioma__lista', idi);
    const links = () => $$('a', lista);
    const fecha = (foco) => { lista.hidden = true; bt.setAttribute('aria-expanded', 'false'); if (foco) bt.focus(); };
    bt.addEventListener('click', () => {
      const abrir = lista.hidden;
      lista.hidden = !abrir; bt.setAttribute('aria-expanded', String(abrir));
      if (abrir) ($('[aria-current="true"]', lista) || links()[0]).focus();
    });
    document.addEventListener('click', (e) => { if (!lista.hidden && !idi.contains(e.target)) fecha(); });
    idi.addEventListener('keydown', (e) => {
      if (lista.hidden) return;
      const l = links(), i = l.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fecha(true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); l[(i + 1) % l.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); l[(i - 1 + l.length) % l.length].focus(); }
      else if (e.key === 'Tab' && !e.shiftKey && i === l.length - 1) fecha();
    });
    const guarda = (c) => { try { localStorage.setItem('bb_idioma', c); } catch { /* sem armazenamento: só não lembra */ } };
    links().forEach((a) => a.addEventListener('click', () => guarda(a.dataset.idiomaCod)));

    let escolheu = null;
    try { escolheu = localStorage.getItem('bb_idioma'); } catch { escolheu = 'pt'; }
    const SUGESTAO = {
      es: ['Este sitio también está en español.', 'Ver en español', 'Cerrar'],
      en: ['This site is also available in English.', 'View in English', 'Close'],
      fr: ['Ce site existe aussi en français.', 'Voir en français', 'Fermer'],
      de: ['Diese Website gibt es auch auf Deutsch.', 'Auf Deutsch ansehen', 'Schließen'],
      it: ['Questo sito è disponibile anche in italiano.', 'Vedi in italiano', 'Chiudi'],
      nl: ['Deze site is ook in het Nederlands.', 'Bekijk in het Nederlands', 'Sluiten'],
      ja: ['このサイトは日本語でもご覧いただけます。', '日本語で見る', '閉じる'],
      zh: ['本网站也提供简体中文版。', '查看中文版', '关闭'],
    };
    const doNavegador = ((navigator.languages || [navigator.language || ''])).map((x) => String(x).toLowerCase().slice(0, 2)).find((c) => c === 'pt' || SUGESTAO[c]);
    const alvo = doNavegador && SUGESTAO[doNavegador] && $(`a[data-idioma-cod="${doNavegador}"]`, lista);
    if (EM_PT && !escolheu && alvo) {
      const [frase, botao, fechar] = SUGESTAO[doNavegador];
      const caixa = document.createElement('div');
      caixa.className = 'sugere-idioma';
      caixa.lang = alvo.lang;
      caixa.setAttribute('role', 'region');
      caixa.setAttribute('aria-label', botao);
      caixa.innerHTML = `<span>${frase}</span><a href="${alvo.getAttribute('href')}">${botao}</a><button type="button" aria-label="${fechar}">&times;</button>`;
      $('a', caixa).addEventListener('click', () => guarda(doNavegador));
      $('button', caixa).addEventListener('click', () => { guarda('pt'); caixa.remove(); });
      document.body.appendChild(caixa);
    }
  }

  /* ---------- rodapé: o sorriso da assinatura aparece ao chegar ---------- */
  const rodape = $('[data-rodape]');
  if (rodape && 'IntersectionObserver' in window) {
    new IntersectionObserver((ent, obs) => {
      if (ent[0].isIntersecting) { rodape.classList.add('is-visivel'); obs.disconnect(); }
    }, { threshold: .25 }).observe(rodape);
  }
})();
