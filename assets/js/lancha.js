/* Barra Boat Floripa | lancha.js
   Página da lancha: galeria de fotos e calendário de datas livres.
   O calendário lê as datas reservadas de data-fonte (na produção, o PHP entrega o que está no painel).
   Ao escolher um dia livre, o botão do WhatsApp já leva a lancha e a data escritas. */
(function () {
  'use strict';
  const WA = '5548991153172';

  /* ---------------- galeria ---------------- */
  const gal = document.querySelector('[data-galeria]');
  if (gal) {
    const total = Number(gal.dataset.total) || 1;
    const pasta = gal.dataset.pasta;
    // no servidor a lista vem do banco (fotos enviadas pelo painel têm qualquer nome);
    // na prévia estática as fotos são 01.webp, 02.webp...
    let lista = null;
    try { lista = gal.dataset.fotos ? JSON.parse(gal.dataset.fotos) : null; } catch (e) { lista = null; }
    const img = gal.querySelector('[data-galeria-img]');
    const n = gal.querySelector('[data-galeria-n]');
    const minis = Array.from(gal.querySelectorAll('[data-foto]'));
    const nome = img.alt.split(',')[0];
    let atual = 1;
    function mostra(k) {
      atual = ((k - 1 + total) % total) + 1;
      img.src = (lista && lista[atual - 1]) || (pasta + String(atual).padStart(2, '0') + '.webp');
      img.alt = nome + ', foto ' + atual + ' de ' + total;
      n.textContent = atual;
      minis.forEach((b) => {
        const sim = Number(b.dataset.foto) === atual;
        if (sim) { b.setAttribute('aria-current', 'true'); b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
        else b.removeAttribute('aria-current');
      });
    }
    minis.forEach((b) => b.addEventListener('click', () => mostra(Number(b.dataset.foto))));
    gal.querySelectorAll('[data-galeria-passo]').forEach((b) => b.addEventListener('click', () => mostra(atual + Number(b.dataset.galeriaPasso))));
    gal.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') mostra(atual + 1);
      else if (e.key === 'ArrowLeft') mostra(atual - 1);
    });
    // arrastar com o dedo no celular
    let x0 = null;
    img.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    img.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) mostra(atual + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* ---------------- calendário ---------------- */
  const ag = document.querySelector('[data-agenda]');
  if (!ag) return;
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const dias = ag.querySelector('[data-agenda-dias]');
  const titulo = ag.querySelector('[data-agenda-titulo]');
  const aviso = ag.querySelector('[data-agenda-aviso]');
  const cta = document.querySelector('[data-agenda-cta]');
  const ctaTxt = document.querySelector('[data-agenda-cta-txt]');
  const base = cta.dataset.waBase;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const br = (d) => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  let ocupadas = new Set();
  let mes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  let escolhida = null;
  const limite = new Date(hoje.getFullYear(), hoje.getMonth() + 12, 1); // um ano de agenda

  function desenha() {
    titulo.textContent = MESES[mes.getMonth()] + ' de ' + mes.getFullYear();
    ag.querySelector('[data-agenda-mes="-1"]').disabled = mes <= new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    ag.querySelector('[data-agenda-mes="1"]').disabled = new Date(mes.getFullYear(), mes.getMonth() + 1, 1) >= limite;
    dias.innerHTML = '';
    const primeiro = mes.getDay();
    for (let i = 0; i < primeiro; i++) dias.appendChild(document.createElement('span'));
    const fim = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= fim; d++) {
      const data = new Date(mes.getFullYear(), mes.getMonth(), d);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'agenda__dia';
      b.textContent = d;
      const k = iso(data);
      const passado = data < hoje;
      const ocupada = ocupadas.has(k);
      const rotulo = d + ' de ' + MESES[mes.getMonth()];
      if (passado) { b.disabled = true; b.classList.add('is-passado'); b.setAttribute('aria-label', rotulo + ', já passou'); }
      else if (ocupada) { b.disabled = true; b.classList.add('is-ocupada'); b.setAttribute('aria-label', rotulo + ', reservada'); }
      else {
        b.setAttribute('aria-label', rotulo + ', livre');
        if (escolhida && iso(escolhida) === k) { b.classList.add('is-escolhida'); b.setAttribute('aria-pressed', 'true'); }
        else b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => escolhe(data));
      }
      if (+data === +hoje) b.classList.add('is-hoje');
      dias.appendChild(b);
    }
  }

  function escolhe(data) {
    escolhida = data;
    const texto = base + ' Data: ' + br(data) + '.';
    cta.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(texto);
    cta.dataset.dia = iso(data);   // o popup de reserva já abre com este dia
    ctaTxt.textContent = 'Consultar o dia ' + br(data).slice(0, 5);
    aviso.hidden = false;
    aviso.textContent = 'Dia ' + br(data) + ' livre no calendário. A nossa equipe confirma a reserva pelo WhatsApp.';
    desenha();
  }

  ag.querySelectorAll('[data-agenda-mes]').forEach((b) => b.addEventListener('click', () => {
    mes = new Date(mes.getFullYear(), mes.getMonth() + Number(b.dataset.agendaMes), 1);
    desenha();
  }));

  desenha();
  fetch(ag.dataset.fonte, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      if (!j) return;
      ocupadas = new Set((j.ocupadas && j.ocupadas[ag.dataset.lancha]) || []);
      desenha();
    })
    .catch(() => {});
})();
