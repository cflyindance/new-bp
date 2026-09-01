import path from "node:path";

export function resolvePitConfig(env = process.env, projectRoot = process.cwd()) {
  const dataDir = path.resolve(env.PIT_DATA_DIR || path.join(projectRoot, ".data", "pit"));

  return {
    host: env.PIT_HOST || "0.0.0.0",
    port: Number(env.PIT_PORT || 3020),
    dataDir,
    dbPath: path.join(dataDir, "pit.sqlite3"),
    importsDir: path.join(dataDir, "imports"),
    exportsDir: path.join(dataDir, "exports"),
    backupsDir: path.join(dataDir, "backups"),
    distDir: path.resolve(env.PIT_DIST_DIR || path.join(projectRoot, "dist")),
  };
}
