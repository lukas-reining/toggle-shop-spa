/// <reference types="vite/client" />

interface SpaConfig {
  endpoints: {
    /** Nest.js API base URL, including the /api prefix. */
    api: string;
    /** flagd OFREP base URL. */
    ofrep: string;
  };
}

declare global {
  interface Window {
    spaConfig?: SpaConfig;
  }
}

export {};
