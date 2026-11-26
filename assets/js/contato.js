/* Barra Boat Floripa | contato.js
   O formulário de contato monta a mensagem e abre a conversa no WhatsApp.
   Na produção o PHP também grava o lead no painel antes de abrir o WhatsApp. */
(function () {
  'use strict';
  // Textos no idioma da página: nas páginas traduzidas o PHP põe as traduções em window.BB_T
  // (a chave é o texto em português, que tools/i18n.php acha procurando T('...') nestes arquivos).
  const T = (s, v) => { let t = (window.BB_T && window.BB_T[s]) || s; if (v) t = t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)); return t; };
  const IDIOMA = document.documentElement.lang || 'pt-BR';
  const EM_PT = IDIOMA.indexOf('pt') === 0;
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
    rotulo.textContent = p ? T('Conte como você quer o passeio') : T('Mensagem');
    form.elements.mensagem.placeholder = p ? T('Paradas, horário, ocasião especial...') : T('Alguma dúvida ou pedido especial?');
  };
  if (new URLSearchParams(location.search).get('roteiro') === 'personalizado') form.elements.roteiro.value = 'Personalizado';
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
    const pers = form.elements.roteiro.value === 'Personalizado';
    const buscar = pers && form.elements.desloc.value === 'sim' ? (form.elements.local.value.trim() || T('a combinar')) : '';
    const partes = [T('Olá! Meu nome é {nome}. Vim pelo site da Barra Boat.', { nome })];
    if (pers) {
      partes.push(T('Quero um passeio personalizado.'));
      if (buscar) partes.push(T('Preciso que a lancha busque o grupo em outro lugar: {local}.', { local: buscar }));
    } else partes.push(T('Roteiro: {roteiro}.', { roteiro: form.elements.roteiro.value }));
    if (dataCampo.value) partes.push(T('Data: {data}.', { data: window.BBdataLonga ? window.BBdataLonga(dataCampo.value) : dataCampo.value.split('-').reverse().join('/') }));
    const p = form.elements.pessoas.value;
    if (p) partes.push(T('Somos {pessoas}.', { pessoas: T('{n} pessoas', { n: p }) }));
    const msg = form.elements.mensagem.value.trim();
    if (msg) partes.push(msg);
    let texto = partes.join(' ');
    if (!EM_PT && window.BBresumoPt) texto += '\n\n' + window.BBresumoPt([['Nome', nome], ['Roteiro', form.elements.roteiro.value], ['Data', dataCampo.value ? dataCampo.value.split('-').reverse().join('/') : 'a definir'], ['Pessoas', p], ['Buscar o grupo em', buscar]]);
    const url = 'https://wa.me/5548991153172?text=' + encodeURIComponent(texto);
    (window.dataLayer = window.dataLayer || []).push({ event: 'clique_whatsapp', pagina: location.pathname, formulario: 'contato' });
    window.open(url, '_blank', 'noopener');
  });
})();
