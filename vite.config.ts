import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import express from 'express';
import { defineConfig, type Plugin } from 'vite';
import { apiRouter } from './src/server/routes';

function backendApiPlugin(): Plugin {
  return {
    name: 'backend-api-plugin',
    configureServer(server) {
      // Critical Security: Block direct static access to private data files and dotfiles
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/data') || url.startsWith('/.env') || url.startsWith('/.git') || url.startsWith('/package.json')) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: false,
            error: 'Access Denied: Direct access to data vault and confidential files is forbidden.',
            code: 'DATA_VAULT_RESTRICTED'
          }));
          return;
        }
        next();
      });

      const app = express();
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use('/api', apiRouter);
      server.middlewares.use(app);
    },
  };
}

export default defineConfig(({ command }) => {
  return {
    plugins: [
      tailwindcss(),
      ...(command === 'serve' ? [backendApiPlugin()] : [])
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

