// NeuroLab — Service Worker
// Cache offline do app shell (index.html)

const CACHE = 'neurolab-v1';
const SHELL = ['./index.html', './'];

// Instala: faz cache do index.html
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Ativa: remove caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first para garantir conteúdo atualizado;
// fallback para cache se offline
self.addEventListener('fetch', e => {
  // Ignora requisições Firebase e fontes externas — deixa passar normalmente
  const url = e.request.url;
  if (url.includes('firebaseio.com') ||
      url.includes('firebaseapp.com') ||
      url.includes('gstatic.com') ||
      url.includes('googleapis.com') ||
      url.includes('fonts.g')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // Atualiza cache com versão mais recente
        if (resp && resp.status === 200 && e.request.method === 'GET') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
