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
  // Personalizado: pergunta se a lancha busca o grupo em outro lugar e pede para contar o passeio
  const pers = form.querySelector('[data-pers]'), local = form.querySelector('[data-desloc-local]');
  const rotulo = form.querySelector('[data-rotulo-msg]');
  const mostraPers = () => {
    const p = form.elements.roteiro.value === 'Personalizado';
    pers.hidden = !p;
    local.hidden = !p || form.elements.desloc.value !== 'sim';
    rotulo.textContent = p ? 'Conte como você quer o passeio' : 'Mensagem';
    form.elements.mensagem.placeholder = p ? 'Paradas, horário, ocasião especial...' : 'Alguma dúvida ou pedido especial?';
  };
  form.elements.roteiro.addEventListener('change', mostraPers);
  form.elements.desloc.addEventListener('change', mostraPers);
  mostraPers();

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
    if (form.elements.roteiro.value === 'Personalizado') {
      partes.push('Quero um passeio personalizado.');
      if (form.elements.desloc.value === 'sim') partes.push('Preciso que a lancha busque o grupo em outro lugar: ' + (form.elements.local.value.trim() || 'a combinar') + '.');
    } else partes.push('Roteiro: ' + form.elements.roteiro.value + '.');
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
