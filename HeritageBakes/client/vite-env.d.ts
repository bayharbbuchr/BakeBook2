/// <reference types="vite/client" />
/// <reference lib="webworker" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PUBLIC_URL: string;
  // Add other environment variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend the Window interface to include any global browser APIs you're using
declare interface Window {
  // Add any global window properties here
}

// Type definitions for service worker events
interface ExtendableEvent extends Event {
  waitUntil(f: Promise<any>): void;
}

interface ExtendableMessageEvent extends ExtendableEvent {
  readonly data: any;
  readonly lastEventId: string;
  readonly origin: string;
  readonly ports: ReadonlyArray<MessagePort>;
  readonly source: Client | ServiceWorker | MessagePort | null;
}

// Augment the global scope for service workers
declare const self: ServiceWorkerGlobalScope;

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.less' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.styl' {
  const classes: { [key: string]: string };
  export default classes;
}
