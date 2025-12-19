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
- **OAuth errors?** Verify `.env` credentials and permissions are properly set
- **Session issues?** Clear `.sessions.json` file

See project docs for detailed configuration and deployment options.
