import { defineConfig, loadEnv, type ProxyOptions } from 'vite';

// Proxies /api/coc/* to the Clash of Clans API, injecting the bearer token
// server-side so it never reaches the browser bundle. Only works while
// `vite dev` / `vite preview` (a Node process) is running from the IP
// allow-listed on developer.clashofclans.com.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const token = env.CLASH_API_TOKEN;

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

  return {
    server: { proxy },
    preview: { proxy },
  };
});
