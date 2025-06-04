// Simple service worker registration
type ServiceWorkerConfig = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.VITE_PUBLIC_URL || ''}/service-worker.js`;
      
      navigator.serviceWorker.register(swUrl).then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content is available
                  console.log('New content is available; please refresh.');
                  if (config?.onUpdate) {
                    config.onUpdate(registration);
                  }
                } else {
                  // Content is now cached for offline use
                  console.log('Content is cached for offline use.');
                  if (config?.onSuccess) {
                    config.onSuccess(registration);
                  }
                }
              }
            };
          }
        };
      }).catch(error => {
        console.error('Error during service worker registration:', error);
      });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}

export function getRegistration() {
  return 'serviceWorker' in navigator ? navigator.serviceWorker.ready : null;
}
