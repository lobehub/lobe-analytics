// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Guards the published entry points: every file referenced by the `exports`
 * map in package.json must be produced by `tsup` (see lobe-analytics#13, where
 * `require` pointed at `dist/*.cjs` while tsup emitted CJS as `dist/*.js`).
 */

type ConditionMap = { [condition: string]: ConditionMap | string };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  exports: Record<string, ConditionMap>;
};

const resolveTarget = (conditions: ConditionMap, path: string[]): string => {
  const value = path.reduce<ConditionMap | string | undefined>(
    (node, key) => (typeof node === 'object' ? node[key] : undefined),
    conditions,
  );
  if (typeof value !== 'string') throw new Error(`exports is missing ${path.join('.')}`);
  return value;
};

const entries = Object.entries(pkg.exports).map(([subpath, conditions]) => ({
  cjs: resolveTarget(conditions, ['require', 'default']),
  cjsTypes: resolveTarget(conditions, ['require', 'types']),
  esm: resolveTarget(conditions, ['import', 'default']),
  esmTypes: resolveTarget(conditions, ['import', 'types']),
  subpath,
}));

let outDir: string;
const toBuilt = (target: string) => join(outDir, target.replace(/^\.\/dist\//, ''));

beforeAll(() => {
  // Build inside node_modules so the bundles can resolve their dependencies.
  const cacheDir = join(root, 'node_modules', '.cache');
  mkdirSync(cacheDir, { recursive: true });
  outDir = mkdtempSync(join(cacheDir, 'exports-test-'));

  const tsupBin = join(
    dirname(createRequire(import.meta.url).resolve('tsup/package.json')),
    'dist/cli-default.js',
  );
  execFileSync(process.execPath, [tsupBin, '--out-dir', outDir, '--silent'], {
    cwd: root,
    stdio: 'pipe',
  });
}, 120_000);

afterAll(() => {
  if (outDir) rmSync(outDir, { force: true, recursive: true });
});

describe('package.json exports', () => {
  it.each(entries)('$subpath points at files tsup emits', (entry) => {
    for (const target of [entry.cjs, entry.cjsTypes, entry.esm, entry.esmTypes]) {
      expect(existsSync(toBuilt(target)), `${entry.subpath} -> ${target}`).toBe(true);
    }
  });

  it.each(entries)('$subpath types match the module format', (entry) => {
    // Without `"type": "module"`, `.d.ts` is read as CommonJS and `.d.mts` as ESM.
    expect(entry.cjsTypes).toMatch(/\.d\.c?ts$/);
    expect(entry.esmTypes).toMatch(/\.d\.mts$/);
  });

  it.each(entries)('$subpath loads through require() and import()', (entry) => {
    const script = `
      const cjs = require(${JSON.stringify(toBuilt(entry.cjs))});
      import(${JSON.stringify(toBuilt(entry.esm))}).then((esm) => {
        process.stdout.write(JSON.stringify([Object.keys(cjs).length, Object.keys(esm).length]));
      });
    `;
    const output = execFileSync(process.execPath, ['-e', script], { cwd: root, encoding: 'utf8' });
    const [cjsCount, esmCount] = JSON.parse(output) as [number, number];

    expect(cjsCount).toBeGreaterThan(0);
    expect(esmCount).toBeGreaterThan(0);
  });
});
