import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import {
  access,
  cp,
  lstat,
  readdir,
  rename,
  rm,
} from 'node:fs/promises';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { assertArtifactContract } from './postbuild.mjs';

export const DEPLOY_TARGET =
  'C:\\Wisdomount\\Menusifu\\application\\1.8.0.30.10\\tomcat\\webapps\\kpos\\kiosklite';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(moduleDir, '..');
const DEPLOY_SOURCE = resolve(repoRoot, 'dist');
const BACKUP_PREFIX = 'kiosklite.backup-';
const STAGING_PREFIX = 'kiosklite.staging-';

function allowedPath(pathname) {
  return resolve(pathname).toLowerCase();
}

async function pathExists(pathname) {
  try {
    await access(pathname);
    return true;
  } catch {
    return false;
  }
}

function getPowerShellPath() {
  if (process.platform !== 'win32') return null;
  if (process.env.SystemRoot) {
    return join(
      process.env.SystemRoot,
      'System32',
      'WindowsPowerShell',
      'v1.0',
      'powershell.exe'
    );
  }
  return 'powershell.exe';
}

async function assertNoWindowsReparsePoint(pathname, label) {
  const powershellPath = getPowerShellPath();
  if (!powershellPath) return;

  const script = [
    '& { param([string] $literalPath)',
    '$ErrorActionPreference = "Stop"',
    '$item = Get-Item -LiteralPath $literalPath -Force',
    'if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { "ReparsePoint" }',
    '}',
  ].join('; ');

  const output = await new Promise((resolveOutput, rejectOutput) => {
    execFile(
      powershellPath,
      ['-NoProfile', '-NonInteractive', '-Command', script, pathname],
      { windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          error.message = stderr.trim() || error.message;
          rejectOutput(error);
          return;
        }
        resolveOutput(stdout.trim());
      }
    );
  });

  if (output === 'ReparsePoint') {
    throw new Error(
      `${label} directory must not be a symlink or reparse point`
    );
  }
}

export async function assertSafeDirectory(
  pathname,
  expectedPath,
  label = 'target'
) {
  const actualPath = allowedPath(pathname);
  if (actualPath !== expectedPath) {
    throw new Error(`${label} directory does not match allowed ${label}`);
  }

  const directoryStat = await lstat(pathname);
  if (directoryStat.isSymbolicLink()) {
    throw new Error(
      `${label} directory must not be a symlink or reparse point`
    );
  }
  if (!directoryStat.isDirectory()) {
    throw new Error(`${label} must be a directory`);
  }

  await assertNoWindowsReparsePoint(pathname, label);
}

async function hashFile(pathname) {
  const hash = createHash('sha256');
  await new Promise((resolveStream, rejectStream) => {
    createReadStream(pathname)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', rejectStream)
      .on('end', resolveStream);
  });
  return hash.digest('hex');
}

function toRelativeFilePath(rootDir, pathname) {
  return relative(rootDir, pathname).split(sep).join('/');
}

export async function listFilesWithHashes(rootDir) {
  const files = [];

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const entryPath = join(currentDir, entry.name);
      const entryStat = await lstat(entryPath);

      if (entryStat.isSymbolicLink()) {
        throw new Error(
          'artifact entries must not be a symlink or reparse point'
        );
      }
      if (entryStat.isDirectory()) {
        await walk(entryPath);
      } else if (entryStat.isFile()) {
        files.push({
          path: toRelativeFilePath(rootDir, entryPath),
          sha256: await hashFile(entryPath),
          bytes: entryStat.size,
        });
      }
    }
  }

  await walk(rootDir);
  return files;
}

async function createUniqueSiblingPath(targetDir, prefix) {
  const parentDir = dirname(resolve(targetDir));

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = join(parentDir, `${prefix}${Date.now()}-${randomUUID()}`);
    if (!(await pathExists(candidate))) return candidate;
  }

  throw new Error(`Unable to create a unique ${prefix} directory name`);
}

function assertSiblingWithPrefix(pathname, targetDir, prefix, label) {
  const resolvedPath = resolve(pathname);
  const resolvedTarget = resolve(targetDir);

  if (
    dirname(resolvedPath).toLowerCase() !==
    dirname(resolvedTarget).toLowerCase()
  ) {
    throw new Error(`${label} must be in the same parent directory as target`);
  }
  if (!basename(resolvedPath).startsWith(prefix)) {
    throw new Error(`${label} must start with ${prefix}`);
  }
}

async function assertSafeSiblingDirectory(pathname, targetDir, prefix, label) {
  assertSiblingWithPrefix(pathname, targetDir, prefix, label);
  await assertSafeDirectory(pathname, allowedPath(pathname), label);
}

function summarizeFiles(files) {
  return {
    files: files.length,
    bytes: files.reduce((total, file) => total + file.bytes, 0),
  };
}

async function removePathIfExists(pathname) {
  if (await pathExists(pathname)) {
    await rm(pathname, { recursive: true, force: true });
  }
}

export async function deployArtifacts({
  sourceDir,
  targetDir,
  allowedSource,
  allowedTarget,
  hooks = {},
}) {
  await assertSafeDirectory(targetDir, allowedTarget, 'target');
  await assertSafeDirectory(sourceDir, allowedSource, 'source');
  await assertArtifactContract(sourceDir);

  const stagingDir = await createUniqueSiblingPath(targetDir, STAGING_PREFIX);
  const backupDir = await createUniqueSiblingPath(targetDir, BACKUP_PREFIX);
  assertSiblingWithPrefix(stagingDir, targetDir, STAGING_PREFIX, 'staging');
  assertSiblingWithPrefix(backupDir, targetDir, BACKUP_PREFIX, 'backup');

  const sourceFiles = await listFilesWithHashes(sourceDir);

  try {
    await cp(sourceDir, stagingDir, {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
    await hooks.afterStageCopy?.({
      sourceDir,
      stagingDir,
      targetDir,
      backupDir,
    });
    assert.deepEqual(await listFilesWithHashes(stagingDir), sourceFiles);

    await rename(targetDir, backupDir);

    try {
      await hooks.afterBackup?.({
        sourceDir,
        stagingDir,
        targetDir,
        backupDir,
      });
      await rename(stagingDir, targetDir);
      await hooks.afterPromote?.({
        sourceDir,
        stagingDir,
        targetDir,
        backupDir,
      });
      assert.deepEqual(await listFilesWithHashes(targetDir), sourceFiles);
    } catch (error) {
      await removePathIfExists(targetDir);
      await rename(backupDir, targetDir);
      throw error;
    }
  } catch (error) {
    await removePathIfExists(stagingDir);
    throw error;
  }

  return {
    backupDir,
    ...summarizeFiles(sourceFiles),
  };
}

export async function rollbackDeployment({
  targetDir,
  backupDir,
  allowedTarget,
}) {
  await assertSafeDirectory(targetDir, allowedTarget, 'target');
  await assertSafeSiblingDirectory(
    backupDir,
    targetDir,
    BACKUP_PREFIX,
    'backup'
  );

  await rm(targetDir, { recursive: true, force: true });
  await rename(backupDir, targetDir);

  return { targetDir };
}

export async function removeVerifiedBackup(backupDir, targetDir) {
  await assertSafeDirectory(targetDir, allowedPath(targetDir), 'target');
  await assertSafeSiblingDirectory(
    backupDir,
    targetDir,
    BACKUP_PREFIX,
    'backup'
  );
  await rm(backupDir, { recursive: true, force: false });

  return { backupDir };
}

export async function deployFromCli(argv = process.argv.slice(2)) {
  const allowedSource = allowedPath(DEPLOY_SOURCE);
  const allowedTarget = allowedPath(DEPLOY_TARGET);

  if (argv.length === 0) {
    const summary = await deployArtifacts({
      sourceDir: DEPLOY_SOURCE,
      targetDir: DEPLOY_TARGET,
      allowedSource,
      allowedTarget,
    });
    console.log(JSON.stringify(summary, null, 2));
    return summary;
  }

  const [action, backupDir] = argv;
  if (!backupDir || argv.length !== 2) {
    throw new Error(
      'Usage: node upload.js [--rollback <backupDir> | --cleanup-backup <backupDir>]'
    );
  }

  if (action === '--rollback') {
    const result = await rollbackDeployment({
      targetDir: DEPLOY_TARGET,
      backupDir,
      allowedTarget,
    });
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  if (action === '--cleanup-backup') {
    await assertSafeDirectory(DEPLOY_TARGET, allowedTarget, 'target');
    const result = await removeVerifiedBackup(backupDir, DEPLOY_TARGET);
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  throw new Error(`Unsupported deploy action: ${action}`);
}

const isCliEntrypoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCliEntrypoint) {
  await deployFromCli();
}
