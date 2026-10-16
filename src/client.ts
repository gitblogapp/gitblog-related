import { mount } from "./index";
import type { Options } from "./protocol";
const script = document.currentScript as HTMLScriptElement | null;
Object.assign(window, { GitBlogRelated: { mount } });
if (script?.dataset.postId) {
  const target = document.createElement("div");
  target.className = "gitblog-related";
  script.before(target);
  try {
    if (
      script.dataset.showThumbnail !== undefined &&
      !["true", "false"].includes(script.dataset.showThumbnail)
    )
      throw new Error("Invalid thumbnail option.");
    mount(target, {
      repo: script.dataset.repo ?? "",
      postId: script.dataset.postId,
      lang: script.dataset.lang,
      showThumbnail: script.dataset.showThumbnail !== "false",
      theme: script.dataset.theme as Options["theme"],
      limit: script.dataset.limit ? Number(script.dataset.limit) : undefined,
      loading: script.dataset.loading as Options["loading"],
      baseUrl: new URL("./", script.src).href,
    });
  } catch {
    target.remove();
    console.warn("[gitblog-related] Invalid embed configuration.");
  }
}
