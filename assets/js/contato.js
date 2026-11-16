/* Barra Boat Floripa | contato.js
   O formulário de contato monta a mensagem e abre a conversa no WhatsApp.
   Na produção o PHP também grava o lead no painel antes de abrir o WhatsApp. */
(function () {
  'use strict';
  const form = document.querySelector('[data-form-contato]');
  if (!form) return;
  const erro = form.querySelector('[data-form-erro]');
  const hoje = new Date();
  const dataCampo = form.elements.data;
  dataCampo.min = hoje.toISOString().slice(0, 10);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = form.elements.nome.value.trim();
    if (!nome) {
      erro.hidden = false;
      form.elements.nome.setAttribute('aria-invalid', 'true');
      form.elements.nome.focus();
      return;
    }
    erro.hidden = true;
    form.elements.nome.removeAttribute('aria-invalid');
    const partes = ['Olá! Meu nome é ' + nome + '. Vim pelo site da Barra Boat.'];
    partes.push('Roteiro: ' + form.elements.roteiro.value + '.');
    if (dataCampo.value) {
      const [a, m, d] = dataCampo.value.split('-');
      partes.push('Data: ' + d + '/' + m + '/' + a + '.');
    }
    const p = form.elements.pessoas.value;
    if (p) partes.push('Somos ' + p + ' pessoas.');
    const msg = form.elements.mensagem.value.trim();
    if (msg) partes.push(msg);
    const url = 'https://wa.me/5548991153172?text=' + encodeURIComponent(partes.join(' '));
    (window.dataLayer = window.dataLayer || []).push({ event: 'clique_whatsapp', pagina: location.pathname, formulario: 'contato' });
    window.open(url, '_blank', 'noopener');
  });
})();
