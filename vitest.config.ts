import dotenv from 'dotenv';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
  },
});
