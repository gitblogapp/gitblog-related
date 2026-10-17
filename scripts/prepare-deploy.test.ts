// Exercise deployment preparation in an isolated directory with mocked HTTP responses.
import { afterEach, expect, test } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const directories: string[] = [];
afterEach(() => directories.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true })));
function prepare(responses: Record<string, { status?: number; body: string }>) {
  const directory = mkdtempSync(join(tmpdir(), "related-deploy-"));
  directories.push(directory);
  mkdirSync(join(directory, "dist"));
  for (const name of ["client.js", "index.js", "embed.html", "embed-NEW.js", "embed-NEW.css"])
    writeFileSync(join(directory, "dist", name), `new ${name}`);
  writeFileSync(join(directory, "mock.mjs"), `const responses = ${JSON.stringify(responses)};
    globalThis.fetch = async (url) => {
      if (!String(url).startsWith('https://gitblog.app/related/v1/')) throw new Error('Unexpected origin');
      const key = new URL(url).pathname.split('/').pop();
      const data = responses[key];
      if (!data) throw new Error('Unexpected request: ' + key);
      return new Response(data.body, { status: data.status ?? 200 });
    };`);
  const result = spawnSync(process.execPath, ["--import", join(directory, "mock.mjs"), resolve("scripts/prepare-deploy.mjs")], {
    cwd: directory, encoding: "utf8", env: { ...process.env, GITHUB_SHA: "test-revision" },
  });
  return { ...result, directory };
}
const checksum = (body: string) => createHash("sha256").update(body).digest("hex");

test("preserves older hashed assets and publishes the newly built entry points", () => {
  const result = prepare({
    "release.json": { body: JSON.stringify({ version: 1, assets: [{ name: "embed-OLD.js", sha256: checksum("old") }] }) },
    "embed-OLD.js": { body: "old" },
  });
  expect(result.status, result.stderr).toBe(0);
  const base = join(result.directory, ".deploy/related/v1");
  expect(readFileSync(join(base, "embed-OLD.js"), "utf8")).toBe("old");
  expect(readFileSync(join(base, "index.js"), "utf8")).toBe("new index.js");
  const manifest = JSON.parse(readFileSync(join(base, "release.json"), "utf8"));
  expect(manifest.revision).toBe("test-revision");
  expect(manifest.assets).toHaveLength(3);
});

test("bootstraps from the live embed when no manifest exists", () => {
  const result = prepare({
    "release.json": { status: 404, body: "missing" },
    "embed.html": { body: '<link href="./embed-OLD.css"><script src="./embed-OLD.js"></script>' },
    "embed-OLD.js": { body: "old js" }, "embed-OLD.css": { body: "old css" },
  });
  expect(result.status, result.stderr).toBe(0);
});

test("refuses a release if an older asset fails its checksum", () => {
  const result = prepare({
    "release.json": { body: JSON.stringify({ version: 1, assets: [{ name: "embed-OLD.js", sha256: checksum("original") }] }) },
    "embed-OLD.js": { body: "modified" },
  });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("Asset checksum mismatch");
});

test("rejects paths outside versioned assets", () => {
  const result = prepare({
    "release.json": { body: JSON.stringify({ version: 1, assets: [{ name: "../../package.json", sha256: checksum("x") }] }) },
  });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("Invalid asset name");
});

test("aborts on production failure instead of deleting previously deployed assets", () => {
  const result = prepare({ "release.json": { status: 503, body: "unavailable" } });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("HTTP 503");
});
