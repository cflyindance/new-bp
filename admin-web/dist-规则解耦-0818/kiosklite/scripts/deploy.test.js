import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { deployArtifacts, listFilesWithHashes } from './deploy.mjs';

const tempRoots = [];

async function pathExists(pathname) {
  try {
    await access(pathname);
    return true;
  } catch {
    return false;
  }
}

async function writeArtifactFile(rootDir, relativePath, contents) {
  const filePath = join(rootDir, ...relativePath.split('/'));
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, contents);
}

async function createTempRoot() {
  const tempRoot = await mkdtemp(join(tmpdir(), 'kiosklite-deploy-'));
  tempRoots.push(tempRoot);
  return tempRoot;
}

async function createValidArtifact(tempRoot, name = 'dist') {
  const sourceDir = join(tempRoot, name);

  await writeArtifactFile(sourceDir, 'index.html', '<main>KIOSK</main>\n');
  await writeArtifactFile(
    sourceDir,
    'version.json',
    JSON.stringify({ name: 'KIOSK', version: 'test' })
  );
  await writeArtifactFile(
    sourceDir,
    'public/version.json',
    JSON.stringify({ name: 'KIOSK', version: 'test' })
  );
  await writeArtifactFile(
    sourceDir,
    'static/js/main.js',
    'const kiosk = true;\n'
  );
  await writeArtifactFile(
    sourceDir,
    'static/css/main.css',
    '.root { color: #123; }\n'
  );
  await writeArtifactFile(sourceDir, 'static/media/logo.png', 'logo\n');
  await writeArtifactFile(
    sourceDir,
    'asset-manifest.json',
    `${JSON.stringify(
      {
        files: {
          'main.js': './static/js/main.js',
          'main.css': './static/css/main.css',
          'static/media/logo.png': './static/media/logo.png',
        },
        entrypoints: ['static/css/main.css', 'static/js/main.js'],
      },
      null,
      2
    )}\n`
  );

  return sourceDir;
}

async function createExistingTarget(tempRoot, name = 'target') {
  const targetDir = join(tempRoot, name);
  await writeArtifactFile(targetDir, 'index.html', '<main>OLD</main>\n');
  await writeArtifactFile(targetDir, 'keep.txt', 'keep me\n');
  return targetDir;
}

function allowedPath(pathname) {
  return resolve(pathname).toLowerCase();
}

afterEach(async () => {
  await Promise.all(
    tempRoots
      .splice(0)
      .map((tempRoot) => rm(tempRoot, { recursive: true, force: true }))
  );
});

describe('deployArtifacts', () => {
  test('rejects a target directory that does not match the allowed target', async () => {
    const tempRoot = await createTempRoot();
    const sourceDir = await createValidArtifact(tempRoot);
    const targetDir = await createExistingTarget(tempRoot);
    const allowedTarget = allowedPath(targetDir);

    await expect(
      deployArtifacts({
        sourceDir,
        targetDir: join(tempRoot, 'wrong'),
        allowedTarget,
      })
    ).rejects.toThrow('does not match allowed target');
  });

  test('leaves the target unchanged when the source artifact contract is incomplete', async () => {
    const tempRoot = await createTempRoot();
    const sourceDir = join(tempRoot, 'dist');
    const targetDir = await createExistingTarget(tempRoot);
    const before = await listFilesWithHashes(targetDir);

    await writeArtifactFile(
      sourceDir,
      'index.html',
      '<main>incomplete</main>\n'
    );

    await expect(
      deployArtifacts({
        sourceDir,
        targetDir,
        allowedSource: allowedPath(sourceDir),
        allowedTarget: allowedPath(targetDir),
      })
    ).rejects.toThrow();

    expect(await listFilesWithHashes(targetDir)).toEqual(before);
    expect(await readFile(join(targetDir, 'keep.txt'), 'utf8')).toBe(
      'keep me\n'
    );
  });

  test('rejects a target directory that is a symlink or junction', async () => {
    const tempRoot = await createTempRoot();
    const sourceDir = await createValidArtifact(tempRoot);
    const realTargetDir = await createExistingTarget(tempRoot, 'real-target');
    const targetDir = join(tempRoot, 'target-link');

    await symlink(
      realTargetDir,
      targetDir,
      process.platform === 'win32' ? 'junction' : 'dir'
    );

    await expect(
      deployArtifacts({
        sourceDir,
        targetDir,
        allowedSource: allowedPath(sourceDir),
        allowedTarget: allowedPath(targetDir),
      })
    ).rejects.toThrow('must not be a symlink or reparse point');
  });

  test('rolls back when the promoted target hashes do not match the source', async () => {
    const tempRoot = await createTempRoot();
    const sourceDir = await createValidArtifact(tempRoot);
    const targetDir = await createExistingTarget(tempRoot);
    const before = await listFilesWithHashes(targetDir);

    await expect(
      deployArtifacts({
        sourceDir,
        targetDir,
        allowedSource: allowedPath(sourceDir),
        allowedTarget: allowedPath(targetDir),
        hooks: {
          afterPromote: async ({ targetDir: promotedTargetDir }) => {
            await writeFile(
              join(promotedTargetDir, 'index.html'),
              'corrupted\n'
            );
          },
        },
      })
    ).rejects.toThrow();

    expect(await listFilesWithHashes(targetDir)).toEqual(before);
    expect(await readFile(join(targetDir, 'keep.txt'), 'utf8')).toBe(
      'keep me\n'
    );
  });

  test('switches the target to the source file set and leaves a backup for manual cleanup', async () => {
    const tempRoot = await createTempRoot();
    const sourceDir = await createValidArtifact(tempRoot);
    const targetDir = await createExistingTarget(tempRoot);

    const summary = await deployArtifacts({
      sourceDir,
      targetDir,
      allowedSource: allowedPath(sourceDir),
      allowedTarget: allowedPath(targetDir),
    });

    expect(await listFilesWithHashes(targetDir)).toEqual(
      await listFilesWithHashes(sourceDir)
    );
    expect(summary.files).toBe((await listFilesWithHashes(sourceDir)).length);
    expect(summary.bytes).toBeGreaterThan(0);
    expect(summary.backupDir).toContain('kiosklite.backup-');
    expect(await pathExists(summary.backupDir)).toBe(true);
  });
});
