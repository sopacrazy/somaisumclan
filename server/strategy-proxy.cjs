const http = require('http');
const Anthropic = require('@anthropic-ai/sdk');

const PORT = process.env.STRATEGY_PORT || 3005;
const client = new Anthropic(); // lê ANTHROPIC_API_KEY do ambiente

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Método não permitido.' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', async () => {
    let prompt;
    try {
      ({ prompt } = JSON.parse(body || '{}'));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'JSON inválido.' }));
      return;
    }

    if (!prompt || typeof prompt !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Campo "prompt" é obrigatório.' }));
      return;
    }

    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = message.content.find((block) => block.type === 'text');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text: textBlock?.text ?? '' }));
    } catch (err) {
      console.error('strategy-proxy error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Falha ao gerar estratégia com IA.' }));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => console.log(`strategy-proxy listening on ${PORT}`));
