import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from 'vite';
import Anthropic from '@anthropic-ai/sdk';

// Proxies /api/coc/* to the Clash of Clans API, injecting the bearer token
// server-side so it never reaches the browser bundle. Only works while
// `vite dev` / `vite preview` (a Node process) is running from the IP
// allow-listed on developer.clashofclans.com.
//
// /api/strategy is handled by a dev-only middleware below, mirroring
// server/strategy-proxy.cjs (the process that serves it in production on
// the VPS), so the AI war-strategy feature also works under `vite dev`.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const token = env.CLASH_API_TOKEN;
  const anthropicKey = env.ANTHROPIC_API_KEY;

  const cocProxy: ProxyOptions = {
    target: 'https://api.clashofclans.com/v1',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/coc/, ''),
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        if (token) proxyReq.setHeader('Authorization', `Bearer ${token}`);
      });
    },
  };

  const proxy = { '/api/coc': cocProxy };

  const strategyDevPlugin: Plugin = {
    name: 'dev-strategy-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/strategy', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Método não permitido.' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');

          if (!anthropicKey) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurado no .env local.' }));
            return;
          }

          try {
            const { prompt } = JSON.parse(body || '{}');
            if (!prompt || typeof prompt !== 'string') {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Campo "prompt" é obrigatório.' }));
              return;
            }

            const client = new Anthropic({ apiKey: anthropicKey });
            const message = await client.messages.create({
              model: 'claude-haiku-4-5',
              max_tokens: 400,
              messages: [{ role: 'user', content: prompt }],
            });

            const textBlock = message.content.find((block) => block.type === 'text');
            res.end(JSON.stringify({ text: textBlock?.type === 'text' ? textBlock.text : '' }));
          } catch (err) {
            console.error('dev strategy endpoint error:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Falha ao gerar estratégia com IA.' }));
          }
        });
      });
    },
  };

  return {
    plugins: [strategyDevPlugin],
    server: { proxy },
    preview: { proxy },
  };
});
