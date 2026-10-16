import { cp, mkdir, readdir } from "node:fs/promises";
import { resolve } from "node:path";
const destination = resolve("../gitblog/static/related/v1");
await mkdir(destination, { recursive: true });
// Retain hashed previous releases so already-open panels can finish loading.
for (const entry of await readdir("dist", { withFileTypes: true })) {
  if (entry.isFile())
    await cp(`dist/${entry.name}`, `${destination}/${entry.name}`);
}
console.log(`Exported browser assets to ${destination}`);
