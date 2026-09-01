#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultProjectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function createPitDevCoordinator({
  spawnChild = spawn,
  runtimeProcess = process,
  projectRoot = defaultProjectRoot,
  logger = console,
  forceAfterMs = 5_000,
  installSignalHandlers = true,
} = {}) {
  const nodePath = runtimeProcess.execPath || process.execPath;
  const inheritedEnv = runtimeProcess.env || process.env;
  const viteEntry = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");
  const definitions = [
    {
      name: "api",
      entry: path.join(projectRoot, "server", "pit-api-server.mjs"),
      env: { PIT_PORT: "3020" },
      ipc: true,
    },
    {
      name: "vite",
      entry: viteEntry,
      env: { PIT_USE_API_PROXY: "1" },
      ipc: false,
    },
  ];
  const children = definitions.map((definition) => ({
    ...definition,
    process: spawnChild(nodePath, [definition.entry], {
      cwd: projectRoot,
      env: { ...inheritedEnv, ...definition.env },
      stdio: definition.ipc ? ["inherit", "inherit", "inherit", "ipc"] : "inherit",
      windowsHide: true,
    }),
  }));
  const exited = new Set();
  const signalHandlers = new Map();
  let terminating = false;
  let externalTermination = false;
  let unexpectedExit = false;
  let forcedTimer = null;
  let resolveDone;
  const done = new Promise((resolve) => { resolveDone = resolve; });

  function terminate(signal = "SIGTERM", external = false) {
    if (external) externalTermination = true;
    if (terminating) return;
    terminating = true;
    for (const child of children) {
      if (exited.has(child)) continue;
      if (child.name === "api" && child.process.connected) {
        try {
          child.process.send({ type: "pit:shutdown", signal }, (error) => {
            if (error && !exited.has(child)) child.process.kill(signal);
          });
        } catch {
          child.process.kill(signal);
        }
      } else child.process.kill(signal);
    }
    forcedTimer = setTimeout(() => {
      for (const child of children) {
        if (!exited.has(child)) child.process.kill("SIGKILL");
      }
    }, forceAfterMs);
    forcedTimer.unref?.();
  }

  function finishIfDone() {
    if (exited.size !== children.length) return;
    if (forcedTimer) clearTimeout(forcedTimer);
    for (const [signal, handler] of signalHandlers) runtimeProcess.off?.(signal, handler);
    signalHandlers.clear();
    const exitCode = unexpectedExit ? 1 : 0;
    runtimeProcess.exitCode = exitCode;
    resolveDone(exitCode);
  }

  if (installSignalHandlers) {
    for (const signal of ["SIGINT", "SIGTERM"]) {
      const handler = () => terminate(signal, true);
      signalHandlers.set(signal, handler);
      runtimeProcess.on(signal, handler);
    }
  }

  for (const child of children) {
    child.process.once("error", (error) => {
      logger?.error?.(`[pit-dev] ${child.name} failed to start:`, error?.message || error);
      unexpectedExit = true;
      terminate();
    });
    child.process.once("close", (code, signal) => {
      exited.add(child);
      if (!terminating) {
        unexpectedExit = true;
        logger?.error?.(`[pit-dev] ${child.name} exited unexpectedly (${code ?? signal ?? "unknown"}).`);
        terminate();
      } else if (!externalTermination && code !== 0) {
        unexpectedExit = true;
      }
      finishIfDone();
    });
  }

  return {
    children,
    done,
    terminate,
    get terminating() { return terminating; },
  };
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) createPitDevCoordinator();
