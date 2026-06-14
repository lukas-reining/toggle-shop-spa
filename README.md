# ToggleShop SPA + Nest.js

A port of the [OpenFeature ToggleShop demo](https://github.com/open-feature/toggle-shop)
from a single Next.js app to a **classical SPA + REST backend** architecture.

This is an npm-workspaces monorepo:

| Package | Stack | Description |
| ------- | ----- | ----------- |
| `apps/web` | Vite + React + React Router | The single-page application frontend. Uses `@openfeature/react-sdk` with the OFREP web provider. |
| `apps/api` | Nest.js | The REST backend. Uses `@openfeature/nestjs-sdk` with the flagd in-process provider. |
| `packages/shared` | TypeScript | Shared types and runtime-agnostic OpenFeature helpers. |

Feature flags are served by a **standalone flagd** instance (see the `Makefile`):
the SPA talks to it over OFREP, and the API uses it as an in-process flag source.

## Getting started

Install dependencies:

```sh
npm install
```

Start the flag server (in its own terminal):

```sh
make start-flagd
```

Configure environment:

```sh
cp apps/api/.env.example apps/api/.env
```

Run both apps:

```sh
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

The SPA reads its backend endpoints at runtime from `window.spaConfig`
(see `apps/web/public/spa_config.js`), so the same build can be configured per
environment when deployed with the
[codecentric single-page-application-server](https://github.com/codecentric/single-page-application-server).

## Feature flags

| Feature Flag        | Type    | Default Variant | Variants |
| ------------------- | ------- | --------------- | -------- |
| offer-free-shipping | boolean | on              | on, off  |
| sticky-header       | boolean | off             | on, off  |
| use-distributed-db  | boolean | off             | on, off  |
| use-secure-protocol | boolean | off             | on, off  |

Typed OpenFeature accessors are generated from [`flags.json`](./flags.json) via
`make generate-flags` into `apps/web/src/generated/react` and
`apps/api/src/generated/nodejs`.
