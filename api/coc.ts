// Vercel serverless function equivalent of the vite.config.ts dev proxy:
// forwards /api/coc/* to the Clash of Clans API with the bearer token
// injected server-side, so the token never reaches the browser bundle.
// vercel.json rewrites /api/coc/:path* here with the remainder in ?path=.
// Set CLASH_API_TOKEN in the Vercel project's Environment Variables
// (Settings → Environment Variables) — do not commit it to the repo.
export default async function handler(req: any, res: any) {
  const token = process.env.CLASH_API_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'CLASH_API_TOKEN não configurado nas variáveis de ambiente do Vercel.' });
    return;
  }

  const upstreamPath = String(req.query.path ?? '');
  const upstream = await fetch(`https://api.clashofclans.com/v1/${upstreamPath}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  const body = Buffer.from(await upstream.arrayBuffer());
  res.status(upstream.status);
  res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
  res.send(body);
}
