/* Barra Boat Floripa | reels.js
   Seção do Instagram: vídeos em carrossel com play, pausa, som, volume e tela cheia.
   O vídeo só baixa quando a pessoa dá o play (preload="none"). Um toca por vez,
   e ele pausa sozinho quando sai da tela. */
(function () {
  'use strict';
  // Textos no idioma da página: nas páginas traduzidas o PHP põe as traduções em window.BB_T
  // (a chave é o texto em português, que tools/i18n.php acha procurando T('...') nestes arquivos).
  const T = (s, v) => { let t = (window.BB_T && window.BB_T[s]) || s; if (v) t = t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)); return t; };
  const IDIOMA = document.documentElement.lang || 'pt-BR';
  const EM_PT = IDIOMA.indexOf('pt') === 0;
  const sec = document.getElementById('instagram');
  if (!sec) return;
  const reels = Array.from(sec.querySelectorAll('.reel'));
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let volume = 0.8;

  const emTelaCheia = () => document.fullscreenElement || document.webkitFullscreenElement;

  reels.forEach((r) => {
    const v = r.querySelector('video');
    const quadro = r.querySelector('.reel__quadro');
    const botoesPlay = r.querySelectorAll('[data-reel-play]');
    const som = r.querySelector('[data-reel-som]');
    const faixa = r.querySelector('[data-reel-vol]');
    const ampliar = r.querySelector('[data-reel-ampliar]');
    const progresso = r.querySelector('.reel__progresso');

    function toca() {
      reels.forEach((o) => { if (o !== r) { const ov = o.querySelector('video'); if (!ov.paused) ov.pause(); } });
      v.muted = false;
      v.volume = volume;
      const p = v.play();
      // se o navegador barrar o som, toca mudo e o botão de som fica disponível
      if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(() => {}); });
    }
    const alterna = () => (v.paused ? toca() : v.pause());

    function atualiza() {
      const mudo = v.muted || v.volume === 0;
      r.classList.toggle('is-mudo', mudo);
      som.setAttribute('aria-label', mudo ? T('Ativar som') : T('Desativar som'));
      som.setAttribute('aria-pressed', String(mudo));
      if (faixa) faixa.value = mudo ? 0 : v.volume;
      botoesPlay.forEach((b) => b.setAttribute('aria-label', v.paused ? T('Reproduzir vídeo') : T('Pausar vídeo')));
    }

    botoesPlay.forEach((b) => b.addEventListener('click', alterna));
    v.addEventListener('click', alterna);
    v.addEventListener('play', () => { r.classList.add('is-tocando'); atualiza(); });
    v.addEventListener('pause', () => { r.classList.remove('is-tocando'); atualiza(); });
    v.addEventListener('ended', () => { v.currentTime = 0; });
    v.addEventListener('volumechange', atualiza);
    v.addEventListener('timeupdate', () => {
      if (v.duration) progresso.style.setProperty('--p', (v.currentTime / v.duration) * 100 + '%');
    });

    som.addEventListener('click', () => {
      if (v.muted || v.volume === 0) { v.muted = false; v.volume = volume || 0.8; }
      else v.muted = true;
    });
    if (faixa) faixa.addEventListener('input', () => {
      const x = Number(faixa.value);
      v.volume = x;
      v.muted = x === 0;
      if (x > 0) volume = x;
    });

    ampliar.addEventListener('click', () => {
      if (emTelaCheia()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      if (quadro.requestFullscreen) {
        quadro.requestFullscreen().then(() => { if (v.paused) toca(); }).catch(() => {});
      } else if (v.webkitEnterFullscreen) { // iPhone: tela cheia nativa do vídeo
        if (v.paused) toca();
        v.webkitEnterFullscreen();
      }
    });
    quadro.addEventListener('fullscreenchange', () => {
      ampliar.setAttribute('aria-label', emTelaCheia() ? T('Sair da tela cheia') : T('Ver em tela cheia'));
    });
  });

  // pausa o vídeo que saiu da tela
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      const v = e.target.querySelector('video');
      if (!e.isIntersecting && !v.paused && !emTelaCheia()) v.pause();
    }), { threshold: 0.2 });
    reels.forEach((r) => io.observe(r));
  }

  // setas do carrossel
  const trilho = sec.querySelector('[data-insta-trilho]');
  const volta = sec.querySelector('[data-insta-volta]');
  const vai = sec.querySelector('[data-insta-vai]');
  const setas = () => {
    volta.disabled = trilho.scrollLeft < 8;
    vai.disabled = trilho.scrollLeft + trilho.clientWidth > trilho.scrollWidth - 8;
  };
  [[volta, -1], [vai, 1]].forEach(([b, dir]) => b.addEventListener('click', () => {
    trilho.scrollBy({ left: dir * (reels[0].offsetWidth + 20) * 2, behavior: reduz ? 'auto' : 'smooth' });
  }));
  trilho.addEventListener('scroll', setas, { passive: true });
  window.addEventListener('resize', setas);
  setas();
})();
