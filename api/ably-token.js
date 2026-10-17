import { createAblyTokenRequest } from '../server/ablyToken.js';

// Vercel serverless function: GET /api/ably-token?room=CODE&player=CLIENT_ID
export default async function handler(req, res) {
  try {
    const { status, body } = await createAblyTokenRequest(process.env.ABLY_API_KEY, req.query.room, req.query.player);
    res.setHeader('Cache-Control', 'no-store');
    res.status(status).json(body);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create Ably token' });
  }
}
