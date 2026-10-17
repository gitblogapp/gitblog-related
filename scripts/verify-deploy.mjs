import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";

const base = "https://gitblog.app/related/v1/";
for (let attempt = 0; ; attempt++) {
  try {
    for (const name of ["release.json", "index.js", "client.js", "embed.html"]) {
      const response = await fetch(`${base}${name}?revision=${process.env.EXPECTED_REVISION}`, { signal: AbortSignal.timeout(15_000) });
      assert.equal(response.status, 200, name);
      assert.equal(response.headers.get("access-control-allow-origin"), "*", name);
      assert.equal(response.headers.get("x-gitblog-related"), "standalone", name);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(`.deploy/related/v1/${name}`), name);
    }
    console.log("Production assets match this release.");
    break;
  } catch (error) {
    if (attempt === 5) throw error;
    await setTimeout(10_000);
  }
}
