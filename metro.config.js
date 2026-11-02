const http = require('http');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

const BACKEND_HOST = process.env.BACKEND_HOST || '127.0.0.1';
const BACKEND_PORT = Number(process.env.BACKEND_PORT || 8000);

// Reverse-proxy /api/v1/* through Metro Dev Server (:8081 -> :8000)
// Eliminates browser CORS blocks when testing Expo Web against the FastAPI Gateway.
config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware) => {
    return (req, res, next) => {
      if (req.url && req.url.startsWith('/api/v1')) {
        // Handle CORS preflight directly if any browser sends OPTIONS
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods':
              'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers':
              'Content-Type, Authorization, Idempotency-Key',
          });
          res.end();
          return;
        }

        const proxyHeaders = { ...req.headers, host: `${BACKEND_HOST}:${BACKEND_PORT}` };
        const proxyReq = http.request(
          {
            hostname: BACKEND_HOST,
            port: BACKEND_PORT,
            path: req.url,
            method: req.method,
            headers: proxyHeaders,
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 500, {
              ...proxyRes.headers,
              'Access-Control-Allow-Origin': '*',
            });
            proxyRes.pipe(res, { end: true });
          }
        );

        proxyReq.on('error', (err) => {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              detail: `Backend Gateway (:8000) unreachable: ${err.message}`,
            })
          );
        });

        req.pipe(proxyReq, { end: true });
        return;
      }

      return metroMiddleware(req, res, next);
    };
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
