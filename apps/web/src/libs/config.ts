/**
 * Runtime configuration accessor. Reads endpoints from `window.spaConfig`,
 * which is provided at runtime by the codecentric SPA server (or the local
 * dev shim in `public/spa_config.js`).
 */

const DEFAULTS = {
  api: "http://localhost:3001/api",
  ofrep: "http://localhost:8016",
};

export function getApiBaseUrl(): string {
  return window.spaConfig?.endpoints?.api ?? DEFAULTS.api;
}

export function getOfrepBaseUrl(): string {
  return window.spaConfig?.endpoints?.ofrep ?? DEFAULTS.ofrep;
}
