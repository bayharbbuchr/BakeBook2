/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Extend the global scope with additional types
interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
  readonly lastChance: boolean;
  waitUntil(f: Promise<any>): void;
}

interface SyncManager {
  getTags(): Promise<string[]>;
  register(tag: string): Promise<void>;
}

declare global {
  interface ServiceWorkerGlobalScope {
    __precacheManifest: Array<{
      url: string;
      revision: string | null;
    }>;
    registration: ServiceWorkerRegistration;
  }

  interface ServiceWorkerRegistration {
    sync: SyncManager;
  }

  interface Window {
    __precacheManifest: Array<{
      url: string;
      revision: string;
    }>;
  }

  interface Navigator {
    serviceWorker: ServiceWorkerContainer;
  }
}

const CACHE_NAME = 'heritage-bakes-v6';
const API_CACHE_NAME = 'heritage-bakes-api-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/static/js/bundle.js',
  '/static/js/main.chunk.js',
  '/static/js/vendors~main.chunk.js',
  '/login',
  '/signup'
];

// Install - Cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - Clean up old caches and enable navigation preload
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => 
      Promise.all([
        // Enable navigation preload if available
        self.registration.navigationPreload?.enable(),
        // Clean up old caches
        ...cacheNames
          .filter(name => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map(name => caches.delete(name))
      ])
    ).then(() => self.clients.claim())
  );
});

// Helper function to cache API responses
const cacheApiResponse = async (request: Request, response: Response) => {
  if (request.method === 'GET') {
    const cache = await caches.open(API_CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
};

// Network first, falling back to cache for API requests
const handleApiRequest = async (request: Request) => {
  try {
    const response = await fetch(request);
    if (response.ok) {
      return cacheApiResponse(request, response);
    }
    throw new Error('Network response was not ok');
  } catch (error) {
    // If network fails, try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// Handle sync events for background sync
self.addEventListener('sync', (event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === 'sync-recipes') {
    syncEvent.waitUntil(handleSyncRecipes());
  }
});

// Handle background sync for recipes
const handleSyncRecipes = async () => {
  // This would be called when the device comes back online
  // We'll let the client-side code handle the actual sync
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_RECIPES' });
  });
};

// Fetch handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isApiRequest = url.pathname.startsWith('/api/');
  const isGetRequest = event.request.method === 'GET';

  // Skip non-GET requests for API
  if (isApiRequest && !isGetRequest) {
    return;
  }

  event.respondWith(
    (async () => {
      // For API requests, use network first, then cache
      if (isApiRequest) {
        return handleApiRequest(event.request);
      }

      // For static assets, try cache first, then network
      try {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (error) {
        console.error('Fetch failed:', error);
        // If both network and cache fail, return a fallback response
        return new Response('Network error', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    })()
  );
});

// Skip waiting when a new service worker is waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Export an empty object to satisfy TypeScript module system
export {};
