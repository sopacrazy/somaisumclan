const http = require('http');

const TOKEN = process.env.CLASH_API_TOKEN;
const PORT = process.env.PORT || 3003;

const server = http.createServer(async (req, res) => {
  if (!TOKEN) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'CLASH_API_TOKEN não configurado.' }));
    return;
  }

  const upstreamPath = req.url.replace(/^\//, '');
  try {
    const upstream = await fetch(`https://api.clashofclans.com/v1/${upstreamPath}`, {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
    });
    const body = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' });
    res.end(body);
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Falha ao conectar à API do Clash of Clans.' }));
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`coc-proxy listening on ${PORT}`));
