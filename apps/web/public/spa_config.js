// Local development runtime configuration.
// In production this file is overwritten by the codecentric SPA server at
// container startup, generated from the YAML `spa_config.endpoints` map.
window.spaConfig = {
  endpoints: {
    // The Nest.js API base URL (includes the /api prefix).
    api: "http://localhost:3001/api",
    // The standalone flagd OFREP base URL (the OFREP web provider appends
    // /ofrep/v1/evaluate/flags).
    ofrep: "http://localhost:8016",
  },
};
