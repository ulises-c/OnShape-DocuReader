# Quick Start

## Prerequisites

- Node.js 18+ and npm

## Install & Run

```sh
# 1. Install dependencies
npm install

# 2. Configure environment
cp examples/.env.example .env
# Edit .env with your OnShape credentials
# Example file provides links and required permissions during configuration

# 3. Build and start
npm run build
npm run dev
```

Visit **http://localhost:3000** and connect your OnShape account.

## Troubleshooting

- **Port conflict?** Change `PORT` in `.env`
- **OAuth errors?** Verify redirect URI matches your OnShape app config
- **Session issues?** Clear `sessions/` directory

See project docs for detailed configuration and deployment options.
