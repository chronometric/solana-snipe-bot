# Solana Snipe Bot

Node.js automation for **Solana** on-chain actions: token purchase flows, transaction helpers, and database-backed user records. The stack uses `@solana/web3.js`, Axios, Azure Key Vault clients (for secret management in supported deployments), and a Sequelize-style **PostgreSQL** layer under `db/` (dialect `postgres` in `db/config/config.js`).

## Prerequisites

- Node.js 18+  
- A Solana RPC endpoint and funded wallet (testnet or mainnet—use test assets first)  
- PostgreSQL if you use the bundled migrations  
- Environment variables for RPC URLs, keys (prefer Key Vault in production), and database connection strings

## Install

```bash
npm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run buy` | Runs `buy.js` (entry point for the snipe/purchase flow—verify flags and config locally) |
| `npm run rebuild` | Windows-oriented clean reinstall of `node_modules` (review before use) |

## Configuration

- Use `config/` and `db/config/` for environment-specific settings.  
- Never commit private keys, mnemonics, or `.env` files with production secrets.

## Database

Migrations under `db/migrations/` define a `User` model (`db/models/user.js`). Run your Sequelize (or equivalent) migration workflow before relying on persistent state.

## Disclaimer

Automated trading and sniping bots are high-risk. This code is for education and research. You are responsible for compliance with laws, exchange rules, and Solana network costs. Test on devnet.

## License

See the repository root or `package.json` for license information.
