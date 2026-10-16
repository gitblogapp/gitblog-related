import { build } from "esbuild";
import { mkdir, rm, writeFile, copyFile } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist/demo", { recursive: true });
const common = { bundle: true, minify: true, target: "es2022" };
await build({
  ...common,
  entryPoints: ["src/client.ts"],
  outfile: "dist/client.js",
  format: "iife",
});
await build({
  ...common,
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  format: "esm",
});
const result = await build({
  ...common,
  entryPoints: ["src/embed.ts"],
  outdir: "dist",
  entryNames: "[name]-[hash]",
  format: "esm",
  metafile: true,
});
const entries = Object.keys(result.metafile.outputs);
const js = entries.find((file) => file.endsWith(".js")).replace("dist/", "");
const css = entries.find((file) => file.endsWith(".css")).replace("dist/", "");
await writeFile(
  "dist/embed.html",
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="referrer" content="no-referrer"><title>GitBlog Related</title><link rel="stylesheet" href="./${css}"><script type="module" src="./${js}"></script></head><body><section id="related" aria-label="Related articles"></section></body></html>`,
);
await copyFile("demo/index.html", "dist/demo/index.html");
await copyFile("demo/demo.js", "dist/demo/demo.js");
await copyFile("demo/snippet.html", "dist/demo/snippet.html");
console.log("Built script embed, ESM SDK, iframe and HTML demo.");
