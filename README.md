# SleepWell

A comprehensive sleep tracking app with clock-style time picker, visual sleep charts, goal tracking, streaks, and sleep debt indicators

Built with [Builddy](https://builddy.app) — AI-powered app builder using GLM 5.1.

## Features

- Clock-style time picker with draggable hour/minute hands and AM/PM toggle
- Visual sleep chart with 7/14/30 day views and color-coded quality bars
- Customizable sleep goal (4-12 hours) with animated circular progress ring
- Streak tracking for consecutive nights meeting sleep goal
- Sleep debt/surplus indicator showing cumulative balance
- Dashboard with weekly averages, best/worst days, and 7-day sparkline
- Export sleep data to CSV format
- Dark mode with calming indigo/cyan nighttime color palette
- Smooth animations for data entry, page transitions, and chart interactions

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