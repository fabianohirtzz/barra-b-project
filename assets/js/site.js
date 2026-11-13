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
     MAR: carta de profundidade + lancha cruzando
     ========================================================= */
  const canvas = $('.mar');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const carta = document.createElement('canvas');
    const cctx = carta.getContext('2d');
    let W = 0, H = 0, dpr = 1;

    // aleatório determinístico: a carta é sempre a mesma
    const semente = (n) => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };

    function desenhaCarta() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      [canvas, carta].forEach((c) => { c.width = W * dpr; c.height = H * dpr; });
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cctx.clearRect(0, 0, W, H);

      const passo = W < 700 ? 58 : 46;
      const linhas = Math.ceil(H / passo) + 4;
      for (let i = -2; i < linhas; i++) {
        const mestra = i % 4 === 0;
        cctx.beginPath();
        cctx.lineWidth = mestra ? 1.1 : .8;
        cctx.strokeStyle = mestra ? 'rgba(24,96,140,.085)' : 'rgba(24,96,140,.05)';
        for (let x = -20; x <= W + 20; x += 8) {
          const y = i * passo
            + Math.sin(x * .0042 + i * .55) * 26
            + Math.sin(x * .011 + i * 1.3) * 9
            + Math.sin(x * .0016 - i * .3) * 40;
          x === -20 ? cctx.moveTo(x, y) : cctx.lineTo(x, y);
        }
        cctx.stroke();
      }
      // sondagens: as profundidades soltas de uma carta náutica
      cctx.font = '500 10px Archivo, sans-serif';
      cctx.fillStyle = 'rgba(24,96,140,.16)';
      const qtd = Math.round((W * H) / 52000);
      for (let k = 0; k < qtd; k++) {
        const prof = 4 + Math.floor(semente(k + 3) * 34);
        cctx.fillText(String(prof), semente(k) * W, semente(k + 101) * H);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(carta, 0, 0);
    }

    /* a lancha: cruza a tela de vez em quando, como a estrela cadente */
    let viagem = null;
    function novaViagem() {
      const daEsquerda = Math.random() > .5;
      const y0 = H * (.15 + Math.random() * .7);
      const y1 = y0 + (Math.random() - .5) * H * .35;
      viagem = {
        x0: daEsquerda ? -60 : W + 60, x1: daEsquerda ? W + 60 : -60,
        y0, y1, curva: (Math.random() - .5) * 140,
        inicio: performance.now(), dur: 10000 + Math.random() * 4000,
        rastro: [], fim: null,
      };
      requestAnimationFrame(quadro);
    }
    function posicao(v, t) {
      const e = t; // velocidade constante, como cruzeiro
      const x = v.x0 + (v.x1 - v.x0) * e;
      const y = v.y0 + (v.y1 - v.y0) * e + Math.sin(e * Math.PI) * v.curva;
      return { x, y };
    }
    function quadro(agora) {
      if (!viagem) return;
      const v = viagem;
      const t = Math.min((agora - v.inicio) / v.dur, 1);
      const p = posicao(v, t);
      if (t < 1) v.rastro.push({ ...p, t: agora });
      else if (!v.fim) v.fim = agora;
      // a esteira dura ~3,2 s
      while (v.rastro.length && agora - v.rastro[0].t > 3200) v.rastro.shift();

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(carta, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const R = v.rastro;
      if (R.length > 2) {
        // esteira em V: abre com a idade de cada ponto
        for (const lado of [-1, 1]) {
          ctx.beginPath();
          for (let i = 0; i < R.length - 1; i++) {
            const a = R[i], b = R[i + 1];
            const idade = (agora - a.t) / 3200;
            const ang = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
            const abre = 4 + idade * 70;
            const x = a.x + Math.cos(ang) * abre * lado, y = a.y + Math.sin(ang) * abre * lado;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          const g = ctx.createLinearGradient(R[0].x, R[0].y, R[R.length - 1].x, R[R.length - 1].y);
          g.addColorStop(0, 'rgba(24,96,140,0)');
          g.addColorStop(1, 'rgba(24,96,140,.22)');
          ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.stroke();
        }
        // espuma central
        ctx.beginPath();
        R.forEach((a, i) => (i ? ctx.lineTo(a.x, a.y) : ctx.moveTo(a.x, a.y)));
        const g2 = ctx.createLinearGradient(R[0].x, R[0].y, R[R.length - 1].x, R[R.length - 1].y);
        g2.addColorStop(0, 'rgba(24,96,140,0)');
        g2.addColorStop(1, 'rgba(24,96,140,.3)');
        ctx.strokeStyle = g2; ctx.lineWidth = 1.6; ctx.stroke();
      }
      if (t < 1) {
        // o casco visto de cima
        const q = posicao(v, Math.min(t + .002, 1));
        const ang = Math.atan2(q.y - p.y, q.x - p.x);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.bezierCurveTo(9, -6, -4, -6.5, -12, -5.5);
        ctx.lineTo(-12, 5.5);
        ctx.bezierCurveTo(-4, 6.5, 9, 6, 15, 0);
        ctx.fillStyle = 'rgba(8,51,89,.32)'; ctx.fill();
        ctx.fillStyle = 'rgba(243,247,250,.7)';
        ctx.fillRect(-5, -2.6, 6, 5.2);
        ctx.restore();
      }
      if (v.fim && agora - v.fim > 3300) {
        viagem = null;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(carta, 0, 0);
        agenda();
        return;
      }
      requestAnimationFrame(quadro);
    }
    function agenda(primeira) {
      if (reduz) return;
      setTimeout(() => {
        if (document.hidden || document.body.classList.contains('menu-aberto')) return agenda();
        novaViagem();
      }, primeira ? 3500 : 14000 + Math.random() * 12000);
    }

    let espera;
    window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(desenhaCarta, 150); });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { desenhaCarta(); agenda(true); });
  }

  /* =========================================================
     CABEÇALHO
     ========================================================= */
  const topo = $('[data-topo]');
  const hero = $('.hero');
  const flutuante = $('.wa-flutuante');
  let ultimoY = window.scrollY;
  function aoRolar() {
    const y = window.scrollY;
    const limite = hero ? Math.min(hero.offsetHeight * .55, 520) : 80;
    topo.classList.toggle('is-solido', y > limite);
    if (!document.body.classList.contains('menu-aberto')) {
      topo.classList.toggle('is-escondido', y > 600 && y > ultimoY + 4);
      if (y < ultimoY - 4) topo.classList.remove('is-escondido');
    }
    if (flutuante) flutuante.classList.toggle('is-oculto', hero && y < hero.offsetHeight * .7);
    ultimoY = y;
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
      const y = link.getBoundingClientRect().top - trilha.getBoundingClientRect().top + link.offsetHeight / 2 - 17;
      barco.style.setProperty('--barco-y', Math.max(0, y) + 'px');
    }
    paradas.forEach((p) => {
      p.addEventListener('mouseenter', () => navegaAte(p));
      p.addEventListener('focusin', () => navegaAte(p));
    });

    function abrir() {
      const r = abre.getBoundingClientRect();
      rota.style.setProperty('--ox', r.left + r.width / 2 + 'px');
      rota.style.setProperty('--oy', r.top + r.height / 2 + 'px');
      rota.hidden = false;
      document.body.classList.add('menu-aberto');
      abre.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        rota.classList.add('is-aberta');
        const atual = paradas.find((p) => p.querySelector('[aria-current]')) || paradas[0];
        setTimeout(() => navegaAte(atual), 60);
        rota.querySelector('.rota__parada a').focus({ preventScroll: true });
      }));
    }
    function fechar() {
      rota.classList.remove('is-aberta');
      abre.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-aberto');
      setTimeout(() => { rota.hidden = true; }, reduz ? 0 : 650);
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
    const muda = (d) => { n = Math.min(13, Math.max(1, n + d)); out.textContent = n; };
    $('[data-menos]', plan).addEventListener('click', () => muda(-1));
    $('[data-mais]', plan).addEventListener('click', () => muda(1));
    plan.addEventListener('submit', (e) => {
      e.preventDefault();
      const roteiro = plan.roteiro.value;
      const dia = data.value ? data.value.split('-').reverse().join('/') : null;
      const pessoas = n === 1 ? '1 pessoa' : `${n} pessoas`;
      const trecho = roteiro === 'ainda não sei'
        ? 'Ainda não escolhi o roteiro.'
        : `Quero consultar um passeio para a ${roteiro === 'Costa da Lagoa' ? 'Costa da Lagoa' : 'Ilha do Campeche'}.`;
      const texto = `Olá! Vim pelo site da Barra Boat. ${trecho} Data: ${dia || 'ainda a definir'}. Somos ${pessoas}.`;
      (window.dataLayer = window.dataLayer || []).push({ event: 'clique_whatsapp', origem, pagina: location.pathname, formulario: 'planejar' });
      window.open(linkWa(texto), '_blank', 'noopener');
    });
  }

  /* =========================================================
     LANCHAS: filtro por grupo + setas do trilho
     ========================================================= */
  const trilho = $('[data-trilho]');
  if (trilho) {
    const cards = $$('.lancha', trilho);
    const volta = $('[data-trilho-volta]');
    const vai = $('[data-trilho-vai]');
    const setas = () => {
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

    const faixas = { 0: [1, 99], 7: [1, 7], 10: [8, 10], 13: [11, 13] };
    $$('[data-filtro] button').forEach((b) => b.addEventListener('click', () => {
      $$('[data-filtro] button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const [min, max] = faixas[b.dataset.pax];
      cards.forEach((c) => { const p = +c.dataset.pax; c.hidden = p < min || p > max; });
      trilho.scrollTo({ left: 0 });
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
