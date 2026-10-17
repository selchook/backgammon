import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Serves /api/ably-token during `npm run dev` so local dev works without `vercel dev`
const ablyTokenDevApi = (apiKey) => ({
  name: 'ably-token-dev-api',
  apply: 'serve', // dev only; production builds never load the Ably SDK
  configureServer(server) {
    server.middlewares.use('/api/ably-token', async (req, res) => {
      const params = new URL(req.url, 'http://localhost').searchParams;
      let result;
      try {
        const { createAblyTokenRequest } = await import('./server/ablyToken.js');
        result = await createAblyTokenRequest(apiKey, params.get('room'), params.get('player'));
      } catch {
        result = { status: 500, body: { error: 'Failed to create Ably token' } };
      }
      res.statusCode = result.status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(result.body));
    });
  },
});

export default defineConfig(({ mode }) => {
  // Empty prefix loads non-VITE_ vars too; they stay server-side and are never bundled
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), ablyTokenDevApi(env.ABLY_API_KEY)],
    server: { port: 5173 },
  };
});
