import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

function git(command: string): string | undefined {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim() || undefined;
  } catch {
    return undefined;
  }
}

function healthPayload() {
  return {
    status: "ok",
    service: "agurateai",
    stage: "closed-beta",
    commit: git("git rev-parse HEAD") ?? process.env.GITHUB_SHA ?? "unknown",
    commitShort:
      git("git rev-parse --short HEAD") ??
      (process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : "unknown"),
    branch:
      git("git rev-parse --abbrev-ref HEAD") ??
      process.env.GITHUB_REF_NAME ??
      "unknown",
    builtAt: new Date().toISOString(),
  };
}

/**
 * Stamps /health.json with git identity:
 * - production build → dist/health.json
 * - vite dev → middleware so local/CI honesty smoke can assert commit fields
 */
export function healthBuildStamp(): Plugin {
  return {
    name: "health-build-stamp",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== "/health.json") {
          next();
          return;
        }
        const body = `${JSON.stringify(healthPayload(), null, 2)}\n`;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(body);
      });
    },
    closeBundle() {
      const outDir = path.resolve(process.cwd(), "dist");
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, "health.json"),
        `${JSON.stringify(healthPayload(), null, 2)}\n`
      );
    },
  };
}
