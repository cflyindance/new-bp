import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import {
  assertArtifactContract,
  gzipBuildAssets,
  runPostbuild,
} from './postbuild.mjs';

const tempRoots = [];

function createViteManifest() {
  return {
    'src/index.js': {
      file: 'static/js/main.abc.js',
      src: 'src/index.js',
      isEntry: true,
      css: ['static/css/main.abc.css'],
      assets: [
        'static/media/logo.abc.png',
        'static/js/already-compressed.js.gz',
        '.vite/manifest.json',
        'asset-manifest.json',
        'public/version.json',
      ],
      imports: ['src/shared.js'],
      dynamicImports: ['src/chunk.js'],
    },
    'src/shared.js': {
      file: 'static/js/shared.ghi.chunk.js',
      src: 'src/shared.js',
    },
    'src/chunk.js': {
      file: 'static\\js\\chunk.def.chunk.js',
      src: 'src/chunk.js',
      isDynamicEntry: true,
    },
    'src/orphan.js': {
      file: 'static/js/orphan.jkl.chunk.js',
      src: 'src/orphan.js',
    },
  };
}

async function writeFixtureFile(distDir, relativePath, contents) {
  const filePath = join(distDir, ...relativePath.split('/'));
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, contents);
}

async function createFixture({ mutateManifest } = {}) {
  const tempRoot = await mkdtemp(join(tmpdir(), 'kiosklite-postbuild-'));
  tempRoots.push(tempRoot);

  const distDir = join(tempRoot, 'dist');
  const manifest = createViteManifest();
  mutateManifest?.(manifest);

  await writeFixtureFile(
    distDir,
    '.vite/manifest.json',
    JSON.stringify(manifest)
  );
  await writeFixtureFile(
    distDir,
    'index.html',
    '<main>KIOSK</main>\n'.repeat(300)
  );
  await writeFixtureFile(
    distDir,
    'version.json',
    JSON.stringify({ name: 'KIOSK', version: 'test' })
  );
  await writeFixtureFile(
    distDir,
    'static/js/main.abc.js',
    'const kiosk = "ready";\n'.repeat(400)
  );
  await writeFixtureFile(
    distDir,
    'static/js/main.abc.js.map',
    JSON.stringify({
      version: 3,
      sources: ['src/index.js'],
      mappings: 'AAAA;'.repeat(400),
    })
  );
  await writeFixtureFile(
    distDir,
    'static/js/chunk.def.chunk.js',
    'export const chunk = "ready";\n'.repeat(400)
  );
  await writeFixtureFile(
    distDir,
    'static/js/shared.ghi.chunk.js',
    'export const shared = "ready";\n'.repeat(400)
  );
  await writeFixtureFile(
    distDir,
    'static/js/orphan.jkl.chunk.js',
    'export const orphan = "ready";\n'.repeat(400)
  );
  await writeFixtureFile(
    distDir,
    'static/css/main.abc.css',
    '.root { color: #123456; }\n'.repeat(400)
  );
  await writeFixtureFile(
    distDir,
    'static/media/logo.abc.png',
    Buffer.alloc(2048, 1)
  );
  await writeFixtureFile(
    distDir,
    'static/js/unrelated.js',
    'const unrelated = true;\n'.repeat(400)
  );

  return distDir;
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

afterEach(async () => {
  await Promise.all(
    tempRoots
      .splice(0)
      .map((tempRoot) => rm(tempRoot, { recursive: true, force: true }))
  );
});

describe('runPostbuild', () => {
  test('creates a CRA-compatible manifest from the Vite entry graph', async () => {
    const distDir = await createFixture();

    const summary = await runPostbuild({ distDir, mode: 'production' });
    const manifest = JSON.parse(
      await readFile(join(distDir, 'asset-manifest.json'), 'utf8')
    );

    expect(manifest.entrypoints).toEqual([
      'static/css/main.abc.css',
      'static/js/main.abc.js',
    ]);
    expect(manifest.files['main.css']).toBe('./static/css/main.abc.css');
    expect(manifest.files['main.js']).toBe('./static/js/main.abc.js');
    expect(manifest.files['static/js/chunk.def.chunk.js']).toBe(
      './static/js/chunk.def.chunk.js'
    );
    expect(manifest.files['static/js/shared.ghi.chunk.js']).toBe(
      './static/js/shared.ghi.chunk.js'
    );
    expect(manifest.files['static/media/logo.abc.png']).toBe(
      './static/media/logo.abc.png'
    );
    expect(manifest.files['static/js/main.abc.js.map']).toBe(
      './static/js/main.abc.js.map'
    );
    expect(
      Object.values(manifest.files).every((value) => value.startsWith('./'))
    ).toBe(true);
    for (const excludedFile of [
      '.vite/manifest.json',
      'asset-manifest.json',
      'public/version.json',
      'static/js/already-compressed.js.gz',
    ]) {
      expect(excludedFile in manifest.files).toBe(false);
    }
    expect(summary.files).toEqual(manifest.files);
    expect(summary.entrypoints).toEqual(manifest.entrypoints);
  });

  test('copies both versions, keeps gzip sources, and removes Vite internals', async () => {
    const distDir = await createFixture();
    const expectedVersion = { name: 'KIOSK', version: 'test' };

    const summary = await runPostbuild({ distDir, mode: 'integration' });

    expect(
      JSON.parse(await readFile(join(distDir, 'version.json'), 'utf8'))
    ).toEqual(expectedVersion);
    expect(
      JSON.parse(await readFile(join(distDir, 'public/version.json'), 'utf8'))
    ).toEqual(expectedVersion);
    expect(summary.gzipFiles.length).toBeGreaterThan(0);
    expect(summary.gzipFiles.every((file) => file.endsWith('.gz'))).toBe(true);
    for (const gzipFile of summary.gzipFiles) {
      expect(await pathExists(join(distDir, gzipFile))).toBe(true);
      expect(await pathExists(join(distDir, gzipFile.slice(0, -3)))).toBe(true);
    }
    for (const excludedGzip of [
      'static/js/unrelated.js.gz',
      'static/js/orphan.jkl.chunk.js.gz',
      'public/version.json.gz',
      '.vite/manifest.json.gz',
    ]) {
      expect(summary.gzipFiles).not.toContain(excludedGzip);
    }
    expect(await pathExists(join(distDir, 'static/js/unrelated.js.gz'))).toBe(
      false
    );
    expect(await pathExists(join(distDir, 'public/version.json.gz'))).toBe(
      false
    );
    expect(await pathExists(join(distDir, '.vite'))).toBe(false);
  });

  test('scrubs production source map contents and browser source map hints', async () => {
    const distDir = await createFixture();
    await writeFixtureFile(
      distDir,
      'static/js/main.abc.js',
      'const kiosk = "ready";\n//# sourceMappingURL=main.abc.js.map\n'
    );
    await writeFixtureFile(
      distDir,
      'static/js/main.abc.js.map',
      JSON.stringify({
        version: 3,
        sources: ['src/index.js'],
        sourcesContent: ['console.log("source body");'],
        mappings: 'AAAA;',
      })
    );
    await writeFixtureFile(
      distDir,
      'static/js/unrelated.js',
      'const unrelated = "sourceMappingURL";\n'
    );
    await writeFixtureFile(
      distDir,
      'static/js/unrelated.js.map',
      JSON.stringify({
        version: 3,
        sources: ['src/unrelated.js'],
        sourcesContent: ['console.log("unrelated source body");'],
        mappings: 'AAAA;',
      })
    );

    await runPostbuild({ distDir, mode: 'production' });

    const reachableMap = JSON.parse(
      await readFile(join(distDir, 'static/js/main.abc.js.map'), 'utf8')
    );
    const unrelatedMap = JSON.parse(
      await readFile(join(distDir, 'static/js/unrelated.js.map'), 'utf8')
    );
    const reachableJs = await readFile(
      join(distDir, 'static/js/main.abc.js'),
      'utf8'
    );
    const unrelatedJs = await readFile(
      join(distDir, 'static/js/unrelated.js'),
      'utf8'
    );

    expect(reachableMap).not.toHaveProperty('sourcesContent');
    expect(unrelatedMap).not.toHaveProperty('sourcesContent');
    expect(reachableJs).not.toContain('sourceMappingURL');
    expect(unrelatedJs).not.toContain('sourceMappingURL');
  });

  test('keeps non-production source map contents and browser source map hints', async () => {
    const distDir = await createFixture();
    await writeFixtureFile(
      distDir,
      'static/js/main.abc.js',
      'const kiosk = "ready";\n//# sourceMappingURL=main.abc.js.map\n'
    );
    await writeFixtureFile(
      distDir,
      'static/js/main.abc.js.map',
      JSON.stringify({
        version: 3,
        sources: ['src/index.js'],
        sourcesContent: ['console.log("source body");'],
        mappings: 'AAAA;',
      })
    );

    await runPostbuild({ distDir, mode: 'integration' });

    const reachableMap = JSON.parse(
      await readFile(join(distDir, 'static/js/main.abc.js.map'), 'utf8')
    );
    const reachableJs = await readFile(
      join(distDir, 'static/js/main.abc.js'),
      'utf8'
    );

    expect(reachableMap.sourcesContent).toEqual([
      'console.log("source body");',
    ]);
    expect(reachableJs).toContain('sourceMappingURL');
  });

  test('reports the required static/css directory when it is missing', async () => {
    const distDir = await createFixture();
    await rm(join(distDir, 'static/css'), { recursive: true });

    await expect(
      runPostbuild({ distDir, mode: 'development' })
    ).rejects.toThrow(/static[\\/]css/);
  });

  test('rejects an absolute manifest output path', async () => {
    const distDir = await createFixture({
      mutateManifest(manifest) {
        manifest['src/index.js'].file = 'C:\\escape\\main.js';
      },
    });

    await expect(runPostbuild({ distDir, mode: 'production' })).rejects.toThrow(
      /absolute/i
    );
  });

  test('rejects a manifest output path containing a parent segment', async () => {
    const distDir = await createFixture({
      mutateManifest(manifest) {
        manifest['src/index.js'].css = ['../outside.css'];
      },
    });

    await expect(runPostbuild({ distDir, mode: 'production' })).rejects.toThrow(
      /\.\./
    );
  });

  test('rejects a Vite manifest without an entry', async () => {
    const distDir = await createFixture({
      mutateManifest(manifest) {
        delete manifest['src/index.js'].isEntry;
      },
    });

    await expect(runPostbuild({ distDir, mode: 'production' })).rejects.toThrow(
      /entry/i
    );
  });

  test('accepts only the three build modes', async () => {
    const distDir = await createFixture();

    await expect(runPostbuild({ distDir, mode: 'staging' })).rejects.toThrow(
      /staging/
    );
  });

  test('rejects a manifest entrypoint that does not exist', async () => {
    const distDir = await createFixture();
    await runPostbuild({ distDir, mode: 'production' });
    const manifestPath = join(distDir, 'asset-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.entrypoints = ['static/css/main.abc.css', 'static/js/missing.js'];
    await writeFile(manifestPath, JSON.stringify(manifest));

    await expect(assertArtifactContract(distDir)).rejects.toThrow(
      /static[\\/]js[\\/]missing\.js/
    );
  });
});

describe('gzipBuildAssets', () => {
  test('does not create gzip when compression is not worthwhile', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'kiosklite-postbuild-'));
    tempRoots.push(tempRoot);
    const distDir = join(tempRoot, 'dist');
    const source = Buffer.alloc(4096);
    let state = 0x12345678;
    for (let index = 0; index < source.length; index += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      source[index] = state >>> 24;
    }
    await writeFixtureFile(distDir, 'static/js/random.js', source);

    const gzipFiles = await gzipBuildAssets({
      distDir,
      relativeFiles: ['static/js/random.js'],
    });

    expect(gzipFiles).toEqual([]);
    expect(await readFile(join(distDir, 'static/js/random.js'))).toEqual(
      source
    );
    expect(await pathExists(join(distDir, 'static/js/random.js.gz'))).toBe(
      false
    );
  });
});
