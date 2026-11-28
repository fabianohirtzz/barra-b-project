/* Service worker do painel (PWA). Só guarda os arquivos do próprio painel, as fontes e o supabase-js,
   para o app abrir rápido e mostrar a casca sem internet. Dados (Supabase) e /api/ nunca passam por aqui:
   tudo o que é da Michele vem sempre da rede. Mudou algo no painel? Os arquivos já levam ?v=, e a página
   é buscada na rede primeiro, então não é preciso mexer neste arquivo. */
const CACHE = 'bb-painel-1';
const CASCA = ['./', 'painel.css?v=29', 'config.js?v=1', 'app.js?v=28', 'manifest.webmanifest', 'icones/icone-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CASCA)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith('bb-painel-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const guarda = (req, res) => {
  if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
    const copia = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
  }
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const mesmo = u.origin === self.location.origin;

  // Página do painel: rede primeiro (sempre a versão nova); sem internet, a última guardada.
  if (req.mode === 'navigate') {
    if (!mesmo || !u.pathname.startsWith('/painel/')) return;
    e.respondWith(fetch(req).then((r) => guarda(new Request('./'), r))
      .catch(() => caches.match('./').then((r) => r || caches.match(req))));
    return;
  }

  // Arquivos do painel: rede primeiro, cópia guardada se cair a conexão.
  if (mesmo && u.pathname.startsWith('/painel/')) {
    e.respondWith(fetch(req).then((r) => guarda(req, r)).catch(() => caches.match(req)));
    return;
  }

  // Fontes do Google e supabase-js (versão fixa): guardados, a rede só na primeira vez.
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com' ||
      (u.hostname === 'cdn.jsdelivr.net' && u.pathname.startsWith('/npm/@supabase/'))) {
    e.respondWith(caches.match(req).then((c) => c || fetch(req).then((r) => guarda(req, r))));
  }
  // Todo o resto (Supabase, /api/, fotos, Windguru) segue direto para a rede.
});
