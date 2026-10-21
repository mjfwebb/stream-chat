import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import { defineConfig } from 'vite';
const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(packageJson.version),
  },
});
