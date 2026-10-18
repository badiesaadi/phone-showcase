import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; import apiPlugin from './dev/api-plugin.mjs';
export default defineConfig({ plugins: [react(), apiPlugin()], build: { target: 'es2020' } });
