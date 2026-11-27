/* Barra Boat Floripa | link.js
   Página da bio do Instagram (/link/). Avulsa: não carrega o site.js, mas repete dele o mar do
   fundo (a lancha cruzando com a esteira), a origem do visitante e o seletor de idioma.
   Mudou o mar ou o seletor no site.js? Copie para cá também. */
(() => {
  'use strict';
  // Textos no idioma da página (window.BB_T vem do PHP nas páginas traduzidas; tools/i18n.php acha os T('...')).
  const T = (s) => (window.BB_T && window.BB_T[s]) || s;
  const IDIOMA = document.documentElement.lang || 'pt-BR';
  const EM_PT = IDIOMA.indexOf('pt') === 0;
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- origem: quem chega por aqui veio da bio ----------
     Os links internos já levam utm_source=instagram&utm_medium=link (rastreia mesmo sem JS), que o
     site.js grava como "instagram/link". Aqui a mesma origem fica gravada antes de qualquer clique, para o
     WhatsApp desta página e para o resto da visita. Para usar na bio do TikTok: /link/?utm_source=tiktok */
  const p = new URLSearchParams(location.search);
  const limpa = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const fonte = limpa(p.get('utm_source')) || 'instagram';
  const origem = fonte + '/' + (limpa(p.get('utm_medium')) || 'link');
  try { sessionStorage.setItem('bb_origem', origem); } catch { /* sem armazenamento: a UTM dos links resolve */ }
  if (fonte !== 'instagram') {
    $$('a[href*="utm_source=instagram"]').forEach((a) => { a.href = a.href.replace('utm_source=instagram', 'utm_source=' + fonte); });
  }
  const camada = (dados) => (window.dataLayer = window.dataLayer || []).push(dados);

  /* WhatsApp: mensagem pronta (o PHP já traduz o texto do href); fora do português vai também um resumo para a equipe */
  const wa = $('[data-link-wa]');
  if (wa && !EM_PT) {
    const u = new URL(wa.href);
    u.searchParams.set('text', (u.searchParams.get('text') || '') + '\n\n[Resumo em português] Quer consultar uma data. Veio pelo link da bio (' + origem + ').');
    wa.href = u.toString().replace(/\+/g, '%20');
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (/wa\.me\//.test(a.href)) camada({ event: 'clique_whatsapp', origem, pagina: location.pathname, formulario: 'link' });
    else camada({ event: 'clique_link_bio', origem, destino: a.getAttribute('href') });
  });

  $$('[data-ano]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* =========================================================
     MAR (copiado do site.js): ondas em traço fino + uma lancha cruzando de vez em quando.
     Aqui a primeira passa mais cedo e perto do topo, onde quem chega da bio está olhando.
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
    function novaViagem(primeira) {
      const daEsquerda = Math.random() > .5;
      const y0 = primeira ? H * (.1 + Math.random() * .08) : H * (.18 + Math.random() * .64);
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
        if (document.hidden) return agenda();
        novaViagem(primeira);
      }, primeira ? 1400 : 9000 + Math.random() * 9000);
    }

    let espera;
    window.addEventListener('resize', () => {
      clearTimeout(espera);
      espera = setTimeout(() => { if (Math.abs(window.innerWidth - W) > 2 || Math.abs(window.innerHeight - H) > 120) desenhaMar(); }, 150);
    });
    desenhaMar(); agenda(true);
  }

  /* =========================================================
     ROTA DOS ATALHOS: a lancha desce pela linha tracejada até a parada em foco
     ========================================================= */
  const rota = $('[data-rota]');
  if (rota) {
    const barco = $('[data-rota-barco]', rota);
    const paradas = $$('.lk-rota__lista a', rota);
    let atual = null, solta;
    const vai = (a, marca = true) => {
      if (!a) return;
      const r = a.getBoundingClientRect(), base = rota.getBoundingClientRect();
      if (atual && atual !== a) {
        rota.classList.add('is-navegando');
        clearTimeout(solta);
        solta = setTimeout(() => rota.classList.remove('is-navegando'), reduz ? 0 : 750);
      }
      barco.style.setProperty('--y', (r.top - base.top + r.height / 2) + 'px');
      paradas.forEach((x) => x.classList.toggle('is-foco', marca && x === a));
      atual = a;
    };
    paradas.forEach((a) => {
      a.addEventListener('pointerenter', () => vai(a));
      a.addEventListener('focus', () => vai(a));
      a.addEventListener('pointerdown', () => vai(a));
    });
    const recoloca = () => { const a = atual || paradas[0]; atual = null; vai(a, false); };
    recoloca();
    requestAnimationFrame(() => rota.classList.add('is-pronta'));
    window.addEventListener('resize', recoloca);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(recoloca);
    rota.addEventListener('pointerleave', () => paradas.forEach((x) => x.classList.remove('is-foco')));
  }

  /* ---------- mapa do embarque: o Google Maps só carrega quando a pessoa pede ---------- */
  const mapa = $('[data-mapa]');
  if (mapa) {
    $('[data-mapa-abrir]', mapa).addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = 'https://maps.google.com/maps?q=-27.5745,-48.4251&z=15&output=embed&hl=' + encodeURIComponent(IDIOMA);
      f.title = T('Mapa do embarque no Canal da Barra da Lagoa');
      f.setAttribute('allowfullscreen', '');
      mapa.appendChild(f);
      mapa.classList.add('is-mapa');
      camada({ event: 'abre_mapa', origem, pagina: location.pathname });
    });
  }

  /* =========================================================
     IDIOMA (como no site.js): o botão abre a lista (os links são montados pelo PHP); em português,
     quem tem o navegador em outro idioma do site recebe a sugestão logo abaixo do topo (uma vez).
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
      if (e.key === 'Escape') { e.preventDefault(); fecha(true); }
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
    const doNavegador = (navigator.languages || [navigator.language || '']).map((x) => String(x).toLowerCase().slice(0, 2)).find((c) => c === 'pt' || SUGESTAO[c]);
    const alvo = doNavegador && SUGESTAO[doNavegador] && $(`a[data-idioma-cod="${doNavegador}"]`, lista);
    if (EM_PT && !escolheu && alvo) {
      const [frase, botao, fechar] = SUGESTAO[doNavegador];
      const caixa = document.createElement('div');
      caixa.className = 'lk-sugere';
      caixa.lang = alvo.lang;
      caixa.setAttribute('role', 'region');
      caixa.setAttribute('aria-label', botao);
      caixa.innerHTML = `<span>${frase}</span><a href="${alvo.getAttribute('href')}">${botao}</a><button type="button" aria-label="${fechar}">&times;</button>`;
      $('a', caixa).addEventListener('click', () => guarda(doNavegador));
      $('button', caixa).addEventListener('click', () => { guarda('pt'); caixa.hidden = true; });
      $('.lk-topo').after(caixa);
    }
  }
})();
