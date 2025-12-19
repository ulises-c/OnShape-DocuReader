# Quick Start Guide

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
npm run build # Compile TypeScript and bundle frontend
npm run dev # Development server with auto-reload

# 4. Visit http://localhost:5173 and connect your OnShape account.
# Automatically launches as part of `npm run dev`
```

## What to Expect

After `npm run dev`, you should see:

- Server running on http://localhost:3000
- OnShape OAuth configured
- Session storage initialized

## Troubleshooting

- **Port conflict?** Change `PORT` in `.env`
- **OAuth errors?** Verify `.env` credentials and permissions are properly set
- **Session issues?** Clear `.sessions.json` file

See project docs for detailed configuration and deployment options.
