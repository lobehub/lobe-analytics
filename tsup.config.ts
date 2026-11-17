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
  // Match the `exports` map in package.json: without `"type": "module"` tsup
  // would emit the CJS build as `.js`, so `require` found no `.cjs` file.
  // tsup does not apply this to declarations: they stay `.d.mts` (ESM) and
  // `.d.ts` (CJS), and package.json points `require.types` at the `.d.ts`.
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.mjs' }),
  sourcemap: true,
  splitting: false,
});
