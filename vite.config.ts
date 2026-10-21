import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { publicClientDefaults } from './public-client-defaults';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    define: Object.fromEntries(
      Object.entries(publicClientDefaults).map(([key, fallback]) => [
        `import.meta.env.${key}`,
        JSON.stringify(env[key] || fallback),
      ]),
    ),
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'unsafe-none',
      },
      host: '0.0.0.0',
      port: 5173,
    },
  };
});
