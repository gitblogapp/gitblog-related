import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";

const origin = "https://gitblog.app/related/v1/";
const destination = ".deploy/related/v1";
const hashedAsset = /^embed-[A-Z0-9]+\.(js|css)$/;
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function get(name, allowMissing = false) {
  const response = await fetch(new URL(name, origin), {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (allowMissing && response.status === 404) return null;
  if (!response.ok) throw new Error(`Cannot preserve ${name}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

// Keep older content-addressed assets so panels opened before a deployment still load.
// Downloaded files are served as assets only; they are never executed by the build.
await rm(".deploy", { recursive: true, force: true });
await mkdir(destination, { recursive: true });
const manifestBytes = await get("release.json", true);
let previous = [];
if (manifestBytes) {
  const manifest = JSON.parse(manifestBytes.toString());
  if (manifest.version !== 1 || !Array.isArray(manifest.assets) || manifest.assets.length > 10_000)
    throw new Error("Invalid deployed asset manifest");
  previous = manifest.assets;
} else {
  // Bootstrap from the existing embed before the first independent deployment.
  const html = (await get("embed.html")).toString();
  previous = [...new Set(html.match(/embed-[A-Z0-9]+\.(?:js|css)/g) ?? [])].map((name) => ({ name }));
  if (previous.length < 2) throw new Error("Cannot discover existing embed assets");
}
for (const { name, sha256 } of previous) {
  if (typeof name !== "string" || !hashedAsset.test(name)) throw new Error("Invalid asset name");
  if (manifestBytes && !/^[a-f0-9]{64}$/.test(sha256 ?? "")) throw new Error("Invalid asset digest");
  const bytes = await get(name);
  if (sha256 && digest(bytes) !== sha256) throw new Error(`Asset checksum mismatch: ${name}`);
  await writeFile(`${destination}/${name}`, bytes);
}
for (const entry of await readdir("dist", { withFileTypes: true })) {
  if (entry.isFile() && (hashedAsset.test(entry.name) || ["client.js", "index.js", "embed.html"].includes(entry.name)))
    await writeFile(`${destination}/${entry.name}`, await readFile(`dist/${entry.name}`));
}
const assets = [];
for (const name of (await readdir(destination)).sort()) {
  if (hashedAsset.test(name)) assets.push({ name, sha256: digest(await readFile(`${destination}/${name}`)) });
}
await writeFile(`${destination}/release.json`, JSON.stringify({ version: 1, revision: process.env.GITHUB_SHA ?? "local", assets }, null, 2) + "\n");
await writeFile(".deploy/_headers", `/related/v1/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=0, must-revalidate
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-GitBlog-Related: standalone
`);
console.log(`Prepared deployment with ${assets.length} versioned assets.`);
