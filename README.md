# Aesthetik

An interactive aesthetic explorer and design system playground for browsing, customizing, mixing, and exporting visual styles.

Built with [Builddy](https://builddy.dev) — AI-powered app builder using GLM 5.1.

## Features

- Aesthetic gallery with 6+ curated visual styles
- Live component showcase with buttons, cards, inputs, typography
- Real-time customization panel for colors and effects
- Aesthetic mixer combining elements from different styles
- Export CSS variables, Tailwind config, and color palettes
- Randomize button for design inspiration
- Save and manage favorite combinations
- Dark mode with system preference detection

## Quick Start

### Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Docker

```bash
docker compose up
```

### Deploy to Railway/Render

1. Push this directory to a GitHub repo
2. Connect to Railway or Render
3. It auto-detects the Dockerfile
4. Done!

## Tech Stack

- **Frontend**: HTML/CSS/JS + Tailwind CSS
- **Backend**: Express.js
- **Database**: SQLite
- **Deployment**: Docker