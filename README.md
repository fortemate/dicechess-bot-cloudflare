# Dice Chess Bot — Cloudflare Workers (Engine-Powered)

[![CI](https://github.com/fortemate/dicechess-bot-cloudflare/actions/workflows/ci.yml/badge.svg)](https://github.com/fortemate/dicechess-bot-cloudflare/actions/workflows/ci.yml)
[![Play Live](https://img.shields.io/badge/Play-Live-success)](https://play.jc.id.lv/)
[![Leaderboard](https://img.shields.io/badge/Ladder-Leaderboard-1E90FF)](https://play.jc.id.lv/leaderboard)
[![Engine](https://img.shields.io/badge/Engine-dicechess--engine-8A2BE2)](https://github.com/fortemate/dicechess-engine)
[![Bot API](https://img.shields.io/badge/Docs-Bot%20API-orange)](https://bots.jc.id.lv/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-lightgrey)](./LICENSE)

Serverless webhook bot for the [Dice Chess](https://play.jc.id.lv/) platform running on **Cloudflare Workers**.

The bot executes the official rules and search engine ([`@rabestro/dicechess-engine`](https://github.com/fortemate/dicechess-engine)) compiled to **Scala.js**. It plays using the engine's **aggressive** king-hunt search algorithm combined with the curated **opening book** (`aggressive-book`).

### Key Highlights

- ⚡ **Zero Cold Starts**: Runs on Cloudflare's lightweight V8 isolates (`workerd`) at edge latency.
- ♟️ **Full Game Engine**: Embeds the real Scala engine in JavaScript — no external compute servers or containers needed.
- 📖 **Opening Book Support**: Fast-paths through common opening rolls using an in-memory opening book.
- 🔒 **Secure HMAC Verification**: Built with WebCrypto API for high-performance request signing and replay prevention.

---

## Performance & Free Tier Compatibility

Cloudflare Workers Free Tier provides **10 ms CPU time per request**. The Scala.js engine's evaluation is heavily optimized for zero allocation and sub-millisecond execution:

| Search Strategy | Median CPU Time (p50) | 99th Percentile (p99) |
| --- | --- | --- |
| `aggressive-book` (Book Hit) | `< 0.05 ms` | `~ 0.1 ms` |
| `aggressive-book` (Search) | `~ 0.4 ms` | `~ 3.4 ms` |

The median request consumes well under 1 ms of CPU time, operating comfortably within free tier constraints.

---

## Project Structure

```
├── .github/workflows/ci.yml  # Automated typecheck, tests, and deployment
├── opening_book.json         # Bundled opening book database
├── src/
│   ├── index.ts              # Cloudflare Workers fetch handler & routing
│   ├── strategy.ts           # Move selection strategy using Scala.js engine
│   ├── strategy.test.ts      # Unit tests for legal move generation
│   ├── webhook.ts            # Webhook HMAC-SHA256 signature verification & dispatch
│   ├── webhook.test.ts       # Webhook & signature vector test suite
│   └── engine.d.ts           # TypeScript type definitions for @rabestro/dicechess-engine
├── tsconfig.json             # TypeScript configuration
├── wrangler.toml             # Cloudflare Workers deployment configuration
└── package.json
```

---

## Local Development

### Prerequisites

- **Node.js**: v24+ (Node 26 recommended)
- **GitHub Packages Auth**: `@rabestro/dicechess-engine` is hosted on GitHub Packages. Set `NODE_AUTH_TOKEN` before installing:

```bash
export NODE_AUTH_TOKEN=$(gh auth token)
```

### Setup & Commands

```bash
# Install dependencies
npm install

# Run test suite (Node test runner)
npm test

# Type-check TypeScript code
npm run typecheck

# Run local Worker simulator with Wrangler
npm run dev
```

---

## Deployment to Cloudflare Workers

### 1. Deploy Worker

```bash
# Authenticate with Cloudflare
npx wrangler login

# Deploy to Cloudflare Workers
npm run deploy
```

Wrangler will output your public worker URL:
`https://dicechess-bot-cloudflare.<your-subdomain>.workers.dev`

### 2. Connect to the Dice Chess Platform

You can register and link your bot using `curl` or any API client:

```bash
BASE=https://play-api.jc.id.lv
URL=https://dicechess-bot-cloudflare.<your-subdomain>.workers.dev

# Step 1: Register a bot identity (Bearer token is returned once)
curl -X POST "$BASE/bot/register" \
  -H "Content-Type: application/json" \
  -d '{"team":"cloudflare","name":"scala-aggressive-book"}'

# Step 2: Register webhook URL (Platform performs ownership handshake)
# Returns the webhook signing secret (save this!)
curl -X POST "$BASE/bot/webhook" \
  -H "Authorization: Bearer <BOT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"$URL\"}"

# Step 3: Configure signing secret in Cloudflare Workers
npx wrangler secret put DICECHESS_WEBHOOK_SECRET
# (Paste the webhook secret when prompted)

# Step 4: Join the competitive rating ladder
curl -X POST "$BASE/bot/ladder/join" \
  -H "Authorization: Bearer <BOT_TOKEN>"
```

Once registered, your bot will automatically receive match challenges and compete on the global ladder at [play.jc.id.lv/leaderboard](https://play.jc.id.lv/leaderboard).

---

## License

Distributed under the **GNU Affero General Public License v3.0** ([AGPL-3.0](./LICENSE)) due to linking with the AGPL-3.0 `@rabestro/dicechess-engine`.
