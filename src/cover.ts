import { safeCoverUrl, type RelatedItem } from "./protocol";

/** Reserve the image ratio before loading; retain the GitBlog fallback on failure. */
export function createCover(item: RelatedItem): HTMLElement {
  const visual = document.createElement("div");
  visual.className = "card-visual";
  visual.setAttribute("aria-hidden", "true");
  const fallback = document.createElement("div");
  fallback.className = "cover-fallback";
  const initial = document.createElement("strong");
  initial.textContent =
    Array.from(item.blog.name.trim())[0]?.toUpperCase() || "G";
  const name = document.createElement("small");
  name.textContent = item.blog.name;
  fallback.append(initial, name);
  visual.append(fallback);
  const url = safeCoverUrl(item.coverUrl);
  if (url) {
    const image = document.createElement("img");
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => image.remove(), { once: true });
    image.src = url;
    visual.append(image);
  }
  return visual;
}
