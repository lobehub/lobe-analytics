import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    'index': 'src/index.ts', // 客户端入口
    'react/index': 'src/react/index.ts',
    'server': 'src/server.ts', // 服务端入口
  },
  external: [
    'posthog-node', // 仍然需要！避免服务端包过大
  ],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  sourcemap: true,
  splitting: false,
});
