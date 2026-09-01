import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { gzip } from 'node:zlib';

const gzipAsync = promisify(gzip);

const ALLOWED_MODES = new Set(['development', 'integration', 'production']);
const SOURCE_MAP_HINT = 'sourceMapping' + 'URL';
const DISABLED_SOURCE_MAP_HINT = 'source-map-url-disabled';
const PATH_ARRAY_FIELDS = ['assets', 'css', 'dynamicImports', 'imports'];
const PATH_FIELDS = ['file', 'src'];
const EXCLUDED_MANIFEST_FILES = new Set([
  '.vite/manifest.json',
  'asset-manifest.json',
  'public/version.json',
]);

function normalizeManifestPath(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty path`);
  }

  const slashPath = value.replaceAll('\\', '/');
  if (
    slashPath.startsWith('/') ||
    slashPath.startsWith('//') ||
    /^[A-Za-z]:\//.test(slashPath)
  ) {
    throw new Error(`${label} must not be an absolute path: ${value}`);
  }

  const segments = slashPath.split('/');
  if (segments.includes('..')) {
    throw new Error(`${label} must not contain "..": ${value}`);
  }

  const normalizedPath = segments
    .filter((segment) => segment !== '' && segment !== '.')
    .join('/');
  if (normalizedPath.length === 0) {
    throw new Error(`${label} must be a non-empty path`);
  }
  return normalizedPath;
}

function normalizeViteManifest(viteManifest) {
  if (
    viteManifest === null ||
    typeof viteManifest !== 'object' ||
    Array.isArray(viteManifest)
  ) {
    throw new Error('Vite manifest must be an object');
  }

  const normalizedManifest = {};
  for (const [rawKey, rawRecord] of Object.entries(viteManifest)) {
    const key = normalizeManifestPath(rawKey, 'Vite manifest key');
    if (
      rawRecord === null ||
      typeof rawRecord !== 'object' ||
      Array.isArray(rawRecord)
    ) {
      throw new Error(`Vite manifest record must be an object: ${rawKey}`);
    }

    const record = { ...rawRecord };
    for (const field of PATH_FIELDS) {
      if (record[field] !== undefined) {
        record[field] = normalizeManifestPath(
          record[field],
          `Vite manifest ${key}.${field}`
        );
      }
    }
    for (const field of PATH_ARRAY_FIELDS) {
      if (record[field] === undefined) continue;
      if (!Array.isArray(record[field])) {
        throw new Error(`Vite manifest ${key}.${field} must be an array`);
      }
      record[field] = record[field].map((value, index) =>
        normalizeManifestPath(value, `Vite manifest ${key}.${field}[${index}]`)
      );
    }

    if (normalizedManifest[key]) {
      throw new Error(`Duplicate normalized Vite manifest key: ${key}`);
    }
    normalizedManifest[key] = record;
  }
  return normalizedManifest;
}

function shouldIncludeManifestFile(relativePath) {
  return (
    !relativePath.endsWith('.gz') && !EXCLUDED_MANIFEST_FILES.has(relativePath)
  );
}

function shouldGzipFile(relativePath) {
  return (
    !relativePath.endsWith('.gz') &&
    !relativePath.startsWith('.vite/') &&
    relativePath !== 'public/version.json'
  );
}

function collectReachableManifestFiles(viteManifest) {
  const entryKeys = Object.keys(viteManifest).filter(
    (key) => viteManifest[key].isEntry === true
  );
  if (entryKeys.length === 0) {
    throw new Error('Vite manifest must contain an entry');
  }

  const relativeFiles = [];
  const seenFiles = new Set();
  const visitedRecords = new Set();
  const queue = [...entryKeys];
  const addFile = (relativePath) => {
    if (
      relativePath &&
      shouldIncludeManifestFile(relativePath) &&
      !seenFiles.has(relativePath)
    ) {
      seenFiles.add(relativePath);
      relativeFiles.push(relativePath);
    }
  };

  while (queue.length > 0) {
    const key = queue.shift();
    if (visitedRecords.has(key)) continue;
    const record = viteManifest[key];
    if (!record) {
      throw new Error(`Vite manifest reference does not exist: ${key}`);
    }
    if (!record.file) {
      throw new Error(`Vite manifest entry is missing file: ${key}`);
    }

    visitedRecords.add(key);
    addFile(record.file);
    for (const relativePath of record.css ?? []) addFile(relativePath);
    for (const relativePath of record.assets ?? []) addFile(relativePath);
    queue.push(...(record.imports ?? []), ...(record.dynamicImports ?? []));
  }

  return { entryKeys, relativeFiles };
}

function resolveArtifactPath(distDir, relativePath) {
  return join(distDir, ...relativePath.split('/'));
}

async function artifactExists(distDir, relativePath) {
  try {
    await stat(resolveArtifactPath(distDir, relativePath));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function assertRequiredArtifact(distDir, relativePath, expectedType) {
  let artifactStat;
  try {
    artifactStat = await stat(resolveArtifactPath(distDir, relativePath));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`Missing required ${expectedType}: ${relativePath}`);
    }
    throw error;
  }

  const hasExpectedType =
    expectedType === 'directory'
      ? artifactStat.isDirectory()
      : artifactStat.isFile();
  if (!hasExpectedType) {
    throw new Error(`Required ${expectedType} has wrong type: ${relativePath}`);
  }
}

async function assertBuildInputs(distDir) {
  await Promise.all([
    assertRequiredArtifact(distDir, 'index.html', 'file'),
    assertRequiredArtifact(distDir, 'version.json', 'file'),
    assertRequiredArtifact(distDir, 'static/js', 'directory'),
    assertRequiredArtifact(distDir, 'static/css', 'directory'),
    assertRequiredArtifact(distDir, 'static/media', 'directory'),
  ]);
}

async function findSourceMaps(distDir, relativeFiles) {
  const sourceMaps = [];
  for (const relativePath of relativeFiles) {
    if (relativePath.endsWith('.map')) continue;
    const sourceMap = `${relativePath}.map`;
    if (await artifactExists(distDir, sourceMap)) sourceMaps.push(sourceMap);
  }
  return sourceMaps;
}

async function readJsonArtifact(distDir, relativePath) {
  let source;
  try {
    source = await readFile(resolveArtifactPath(distDir, relativePath), 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`Missing required file: ${relativePath}`);
    }
    throw error;
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
}

async function findArtifactsByExtension(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findArtifactsByExtension(entryPath, extension)));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(entryPath);
    }
  }

  return files;
}

async function scrubProductionSourceMapContents(distDir) {
  const sourceMapFiles = await findArtifactsByExtension(distDir, '.map');

  for (const sourceMapFile of sourceMapFiles) {
    const source = await readFile(sourceMapFile, 'utf8');
    const sourceMap = JSON.parse(source);
    if (
      sourceMap !== null &&
      typeof sourceMap === 'object' &&
      !Array.isArray(sourceMap) &&
      Object.hasOwn(sourceMap, 'sourcesContent')
    ) {
      delete sourceMap.sourcesContent;
      await writeFile(sourceMapFile, `${JSON.stringify(sourceMap)}\n`, 'utf8');
    }
  }
}

async function scrubProductionSourceMapHints(distDir) {
  const jsFiles = await findArtifactsByExtension(distDir, '.js');

  for (const jsFile of jsFiles) {
    const source = await readFile(jsFile, 'utf8');
    if (!source.includes(SOURCE_MAP_HINT)) continue;

    await writeFile(
      jsFile,
      source.replaceAll(SOURCE_MAP_HINT, DISABLED_SOURCE_MAP_HINT),
      'utf8'
    );
  }
}

async function scrubProductionSourceMaps(distDir) {
  await scrubProductionSourceMapContents(distDir);
  await scrubProductionSourceMapHints(distDir);
}

export async function readViteManifest(distDir) {
  const relativePath = '.vite/manifest.json';
  const viteManifest = await readJsonArtifact(distDir, relativePath);
  return normalizeViteManifest(viteManifest);
}

export function createCraManifest(viteManifest) {
  const normalizedManifest = normalizeViteManifest(viteManifest);
  const { entryKeys, relativeFiles } =
    collectReachableManifestFiles(normalizedManifest);
  const entry = normalizedManifest[entryKeys[0]];
  const mainCss = entry.css?.[0];
  const mainJs = entry.file;
  const files = {};

  for (const relativePath of relativeFiles) {
    let key = relativePath;
    if (relativePath === mainCss) key = 'main.css';
    if (relativePath === mainJs) key = 'main.js';
    files[key] = `./${relativePath}`;
  }

  return {
    files,
    entrypoints: [...(entry.css ?? []), entry.file],
  };
}

export async function gzipBuildAssets({ distDir, relativeFiles }) {
  const gzipFiles = [];
  const seenFiles = new Set();

  for (const candidate of relativeFiles) {
    const relativePath = normalizeManifestPath(candidate, 'Gzip candidate');
    if (seenFiles.has(relativePath) || !shouldGzipFile(relativePath)) continue;
    seenFiles.add(relativePath);

    let source;
    try {
      source = await readFile(resolveArtifactPath(distDir, relativePath));
    } catch (error) {
      if (error?.code === 'ENOENT') {
        throw new Error(`Missing gzip source: ${relativePath}`);
      }
      throw error;
    }

    const compressed = await gzipAsync(source);
    if (source.length > 0 && compressed.length / source.length <= 0.8) {
      const gzipFile = `${relativePath}.gz`;
      await writeFile(resolveArtifactPath(distDir, gzipFile), compressed);
      gzipFiles.push(gzipFile);
    }
  }

  return gzipFiles;
}

export async function assertArtifactContract(distDir) {
  await Promise.all([
    assertRequiredArtifact(distDir, 'index.html', 'file'),
    assertRequiredArtifact(distDir, 'asset-manifest.json', 'file'),
    assertRequiredArtifact(distDir, 'version.json', 'file'),
    assertRequiredArtifact(distDir, 'public/version.json', 'file'),
    assertRequiredArtifact(distDir, 'static/js', 'directory'),
    assertRequiredArtifact(distDir, 'static/css', 'directory'),
    assertRequiredArtifact(distDir, 'static/media', 'directory'),
  ]);

  const craManifest = await readJsonArtifact(distDir, 'asset-manifest.json');
  if (
    craManifest.files === null ||
    typeof craManifest.files !== 'object' ||
    Array.isArray(craManifest.files)
  ) {
    throw new Error('asset-manifest.json files must be an object');
  }
  if (!Array.isArray(craManifest.entrypoints)) {
    throw new Error('asset-manifest.json entrypoints must be an array');
  }

  for (const [key, value] of Object.entries(craManifest.files)) {
    if (typeof value !== 'string' || !value.startsWith('./')) {
      throw new Error(
        `asset-manifest.json files[${JSON.stringify(key)}] must start with ./`
      );
    }
    const relativePath = normalizeManifestPath(
      value.slice(2),
      `asset-manifest.json files[${JSON.stringify(key)}]`
    );
    if (value !== `./${relativePath}`) {
      throw new Error(
        `asset-manifest.json files[${JSON.stringify(key)}] must be normalized`
      );
    }
    await assertRequiredArtifact(distDir, relativePath, 'file');
  }

  for (const [index, value] of craManifest.entrypoints.entries()) {
    if (typeof value !== 'string') {
      throw new Error(
        `asset-manifest.json entrypoints[${index}] must be a relative path`
      );
    }
    const relativePath = normalizeManifestPath(
      value,
      `asset-manifest.json entrypoints[${index}]`
    );
    if (value !== relativePath) {
      throw new Error(
        `asset-manifest.json entrypoints[${index}] must not start with ./`
      );
    }
    await assertRequiredArtifact(distDir, relativePath, 'file');
  }
}

export async function runPostbuild({ distDir, mode }) {
  if (!ALLOWED_MODES.has(mode)) {
    throw new Error(`Unsupported postbuild mode: ${mode}`);
  }

  await assertBuildInputs(distDir);
  const viteManifest = await readViteManifest(distDir);
  const craManifest = createCraManifest(viteManifest);
  const { relativeFiles } = collectReachableManifestFiles(viteManifest);
  const sourceMaps = await findSourceMaps(distDir, relativeFiles);
  for (const sourceMap of sourceMaps) {
    craManifest.files[sourceMap] = `./${sourceMap}`;
  }

  await writeFile(
    resolveArtifactPath(distDir, 'asset-manifest.json'),
    `${JSON.stringify(craManifest, null, 2)}\n`,
    'utf8'
  );
  await mkdir(resolveArtifactPath(distDir, 'public'), { recursive: true });
  await copyFile(
    resolveArtifactPath(distDir, 'version.json'),
    resolveArtifactPath(distDir, 'public/version.json')
  );

  if (mode === 'production') {
    await scrubProductionSourceMaps(distDir);
  }

  const gzipFiles = await gzipBuildAssets({
    distDir,
    relativeFiles: [
      ...relativeFiles,
      ...sourceMaps,
      'index.html',
      'asset-manifest.json',
      'version.json',
    ],
  });
  await rm(resolveArtifactPath(distDir, '.vite'), {
    recursive: true,
    force: true,
  });
  await assertArtifactContract(distDir);

  return { ...craManifest, gzipFiles };
}

const isCliEntrypoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCliEntrypoint) {
  const modeIndex = process.argv.indexOf('--mode');
  const mode = process.argv[modeIndex + 1];
  await runPostbuild({ distDir: resolve('dist'), mode });
}
