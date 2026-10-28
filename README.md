# RelayDeck API

RelayDeck is a TypeScript/Express API for managing webhook subscriptions and
dispatching signed webhook deliveries with bounded exponential-backoff retries.

## Requirements

- Node.js 20+
- MongoDB

## Getting started

```sh
npm install
cp .env.example .env
# Set API_HMAC_SECRET to a long, random value and configure MONGODB_URI.
npm run dev
```

The API listens on `PORT` (default `3000`). OpenAPI documentation is available at
`/api-docs`; liveness and database diagnostics are available at `/health` and
`/ready`.

## API

- `GET /health` — process liveness.
- `GET /ready` — database readiness.
- `GET /api/v1/subscriptions` — list subscriptions (secrets are never returned).
- `POST /api/v1/subscriptions` — create a subscription. The generated signing
  secret is returned only in this response; store it securely.
- `DELETE /api/v1/subscriptions/:id` — deactivate a subscription.
- `POST /api/v1/webhooks/dispatch` — deliver `{ "event": "...", "data": {} }`
  to matching active subscriptions.

Dispatch requests must include `x-relaydeck-signature: sha256=<hex HMAC-SHA256>`
computed over the exact request body bytes using `API_HMAC_SECRET`. Outbound
deliveries contain a JSON body with `id`, `event`, `createdAt`, and `data`, plus
an `x-relaydeck-signature` header signed with that subscription's generated
secret. Retries are limited to three attempts and apply to network errors,
HTTP 429, and HTTP 5xx responses.

Subscription signing secrets are needed by the dispatcher and are stored in the
database. Protect the database with appropriate access controls and encryption
at rest; the API does not expose stored secrets after creation.

## Scripts

- `npm run dev` — run with `ts-node-dev` hot reload.
- `npm run build` — type-check and compile to `dist/`.
- `npm start` — run the compiled service.
