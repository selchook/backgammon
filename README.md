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

### 1. Ably (token auth)

Realtime messaging uses [Ably](https://ably.com) with **token auth**: the API key stays on the
server, and `/api/ably-token` hands each player a short-lived token that can only publish/subscribe
to its own room channel (`backgammon-<CODE>`).

- **Vercel**: Project → Settings → Environment Variables → add `ABLY_API_KEY`
- **Local**: copy `.env.example` to `.env.local` and set `ABLY_API_KEY`

Never prefix it with `VITE_`: that would bundle the key into the client.

### 2. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite dev server also serves `/api/ably-token`.

### 3. Deploy to Vercel

Import the repo in the Vercel dashboard (or run `vercel`) and set `ABLY_API_KEY` in Environment Variables.

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
| `ABLY_API_KEY` | Your Ably API key (server-side only, required) |

## Tech Stack

- **React 18** + **Vite 5** 
- **Ably** — real-time WebSocket messaging
- **Playfair Display** + **Space Mono** fonts
- Deployed on **Vercel**
