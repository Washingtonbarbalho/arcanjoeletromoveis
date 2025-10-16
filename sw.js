// CORREÇÃO: A versão do cache foi incrementada para forçar a atualização do Service Worker.
const CACHE_NAME = 'carne-arcanjo-v2';

// CORREÇÃO: Os caminhos dos arquivos foram alterados para relativos (iniciando com './')
// para funcionar corretamente no ambiente do GitHub Pages.
// Também adicionei o manifest.json e os ícones à lista de cache.
const urlsToCache = [
    '.',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/app.js',
    './js/firebase-config.js',
    './images/icon-192x192.png',
    './images/icon-512x512.png',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-solid-900.woff2'
];

// Evento de instalação: abre o cache e adiciona os arquivos da app shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Evento de fetch: responde com o cache se disponível, senão busca na rede
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se encontrar no cache, retorna
                if (response) {
                    return response;
                }
                // Senão, busca na rede
                return fetch(event.request);
            })
    );
});

// Evento de ativação: limpa caches antigos
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
