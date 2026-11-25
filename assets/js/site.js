/* Barra Boat Floripa | site.js */
(() => {
  'use strict';

  const WA_NUMERO = '5548991153172';
  const WA_PADRAO = 'Olá! Vim pelo site da Barra Boat e gostaria de mais informações.';
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- GTM: só no domínio de produção (a prévia não suja as contas de anúncio) ---------- */
  if (/(^|\.)barraboatfloripa\.com\.br$/.test(location.hostname)) {
    (function (w, d, s, l, i) { w[l] = w[l] || []; w[l].push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      const f = d.getElementsByTagName(s)[0], j = d.createElement(s); j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i; f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', 'GTM-5FJVHJRJ');
  }

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
  function aoRolar() {
    const y = window.scrollY;
    const limite = hero ? Math.min(hero.offsetHeight * .55, 520) : 80;
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
     PLANEJADOR: monta a mensagem do WhatsApp já qualificada
     ========================================================= */
  const plan = $('[data-planejar]');
  if (plan) {
    const out = $('[data-pessoas]', plan);
    const data = $('[data-data]', plan);
    const hoje = new Date(); hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
    data.min = hoje.toISOString().slice(0, 10);
    let n = 6;
    // Lancha escolhida: se o grupo passar do limite dela, avisa e oferece a orientação da equipe.
    const sel = $('[data-lancha]', plan);
    const limite = $('[data-limite]', plan);
    const limiteTxt = $('[data-limite-txt]', plan);
    const confere = () => {
      const op = sel.selectedOptions[0];
      const max = Number(op.dataset.pax);
      const passou = sel.value && n > max;
      limite.hidden = !passou;
      if (passou) limiteTxt.textContent = `A ${sel.value} leva até ${max} pessoas, e o seu grupo tem ${n}. Escolha outra lancha ou peça uma indicação para a nossa equipe.`;
    };
    const muda = (d) => { n = Math.min(13, Math.max(1, n + d)); out.textContent = n; confere(); };
    $('[data-menos]', plan).addEventListener('click', () => muda(-1));
    $('[data-mais]', plan).addEventListener('click', () => muda(1));
    sel.addEventListener('change', confere);
    // Personalizado: pergunta se a lancha busca o grupo em outro lugar e abre espaço para o pedido
    const pers = $('[data-pers]', plan), local = $('[data-desloc-local]', plan);
    const mostraPers = () => {
      pers.hidden = plan.roteiro.value !== 'Personalizado';
      local.hidden = pers.hidden || plan.desloc.value !== 'sim';
    };
    $$('input[name="roteiro"], input[name="desloc"]', plan).forEach((r) => r.addEventListener('change', mostraPers));
    mostraPers();
    $('[data-limite-ajuda]', plan).addEventListener('click', () => { sel.value = ''; confere(); sel.focus(); });
    plan.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!limite.hidden) { limite.classList.remove('is-chamando'); void limite.offsetWidth; limite.classList.add('is-chamando'); return; }
      const roteiro = plan.roteiro.value;
      const dia = data.value ? data.value.split('-').reverse().join('/') : null;
      const pessoas = n === 1 ? '1 pessoa' : `${n} pessoas`;
      let trecho;
      if (roteiro === 'Personalizado') {
        const ondeBuscar = plan.desloc.value === 'sim' ? (plan.local.value.trim() || 'a combinar') : '';
        const pedido = plan.pedido.value.trim();
        trecho = 'Quero um passeio personalizado.'
          + (ondeBuscar ? ` Preciso que a lancha busque o grupo em outro lugar: ${ondeBuscar}.` : ' Podemos embarcar no ponto de vocês.')
          + (pedido ? ` Como quero o passeio: ${pedido}` + (/[.!?]$/.test(pedido) ? '' : '.') : '');
      } else trecho = `Quero consultar um passeio para a ${roteiro === 'Costa da Lagoa' ? 'Costa da Lagoa' : 'Ilha do Campeche'}.`;
      const barco = sel.value ? `Lancha: ${sel.value}.` : 'Quero ajuda da equipe para escolher a lancha.';
      const texto = `Olá! Vim pelo site da Barra Boat. ${trecho} ${barco} Data: ${dia || 'ainda a definir'}. Somos ${pessoas}.`;
      (window.dataLayer = window.dataLayer || []).push({ event: 'clique_whatsapp', origem, pagina: location.pathname, formulario: 'planejar' });
      window.open(linkWa(texto), '_blank', 'noopener');
    });
  }

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

    const faixas = { 0: [1, 99], 7: [1, 7], 10: [8, 10], 13: [11, 13] };
    const contagem = $('[data-contagem]');
    $$('[data-filtro] button').forEach((b) => b.addEventListener('click', () => {
      $$('[data-filtro] button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const [min, max] = faixas[b.dataset.pax];
      cards.forEach((c) => { const p = +c.dataset.pax; c.hidden = p < min || p > max; });
      if (contagem) {
        const n = cards.filter((c) => !c.hidden).length;
        contagem.textContent = n === 1 ? '1 lancha' : n + ' lanchas';
      }
      if (trilho) trilho.scrollTo({ left: 0 });
      setas();
    }));
  }

  /* ---------- rodapé: o sorriso da assinatura aparece ao chegar ---------- */
  const rodape = $('[data-rodape]');
  if (rodape && 'IntersectionObserver' in window) {
    new IntersectionObserver((ent, obs) => {
      if (ent[0].isIntersecting) { rodape.classList.add('is-visivel'); obs.disconnect(); }
    }, { threshold: .25 }).observe(rodape);
  }
})();
