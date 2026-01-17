import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const logEnvPlugin = () => {
  return {
    name: 'log-env',
    config: (_, env) => {
      const loaded = loadEnv(env.mode, process.cwd(), '');
      console.log('--- VITE ENVIRONMENT VARIABLES ---');
      console.log('VITE_SUPABASE_URL:', loaded.VITE_SUPABASE_URL ? 'FOUND' : 'MISSING');
      console.log('VITE_SUPABASE_ANON_KEY:', loaded.VITE_SUPABASE_ANON_KEY ? 'FOUND' : 'MISSING');
      console.log('Full Keys:', Object.keys(loaded).filter(k => k.startsWith('VITE_')));
      console.log('VITE_GEMINI_API_KEY:', loaded.VITE_GEMINI_API_KEY ? `FOUND (starts with ${loaded.VITE_GEMINI_API_KEY.substring(0, 4)}...)` : 'MISSING');
      console.log('----------------------------------');
    }
  }
}

export default defineConfig({
  plugins: [react(), logEnvPlugin()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || '')
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          utils: ['xlsx', '@google/generative-ai']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
});