# 🎲 Tavla Online

A polished multiplayer Backgammon (Tavla) game built with React + Vite, powered by Ably for real-time multiplayer.

## Features

- Full Backgammon / Tavla rules
  - Bar re-entry
  - Bearing off
  - Hitting blots
  - Doubles (4 moves)
  - Auto-skip when no moves available
- Real-time multiplayer via Ably WebSockets
- In-game chat
- Room codes for easy sharing
- Rematch system
- Deep link joining via URL (`?room=XXXXXX`)
- Beautiful classic board design

## Setup

### 1. Get an Ably API Key

1. Sign up at [ably.com](https://ably.com) (free tier available)
2. Create a new App
3. Copy your API Key from the dashboard

### 2. Local Development

```bash
# Install dependencies
npm install

# Create env file
cp .env.example .env
# Edit .env and add your Ably API key

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variable in Vercel dashboard:
# VITE_ABLY_API_KEY = your_key_here
```

Or deploy via the Vercel dashboard — import the repo and set `VITE_ABLY_API_KEY` in Environment Variables.

## How to Play

1. Player 1 clicks **Create New Game** → gets a 6-character room code
2. Player 2 enters the code and clicks **Join Game**
3. Game starts! White (Cream) moves first
4. Click **Roll Dice** on your turn, then click a checker to select it
5. Valid destination points are highlighted in green
6. First to bear off all 15 checkers wins!

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_ABLY_API_KEY` | Your Ably API key (required) |

> ⚠️ **Security Note**: For production, use [Ably Token Authentication](https://ably.com/docs/auth/token) instead of exposing your API key. Create a serverless function (`/api/ably-token`) to issue tokens.

## Tech Stack

- **React 18** + **Vite 5** 
- **Ably** — real-time WebSocket messaging
- **Playfair Display** + **Space Mono** fonts
- Deployed on **Vercel**
