import { normalize, readItems, type State } from "./protocol";
import { createCover } from "./cover";
import "./tokens.css";
import "./embed.css";
const params = new URLSearchParams(location.search);
const parentOrigin = params.get("parentOrigin") ?? "";
const instance = params.get("instance") ?? "";
const root = document.querySelector<HTMLElement>("#related")!;
let state: State = "loading";
function notify() {
  if (!/^https?:\/\//.test(parentOrigin) || parent === window) return;
  parent.postMessage(
    {
      gitblogRelated: {
        version: 1,
        instance,
        state,
        height:
          state === "ready"
            ? Math.ceil(document.body.getBoundingClientRect().height)
            : 0,
      },
    },
    parentOrigin,
  );
}
function setTheme(value: string) {
  document.documentElement.dataset.theme = value === "dark" ? "dark" : "light";
}
window.addEventListener("message", (event) => {
  if (event.origin !== parentOrigin || event.source !== parent) return;
  const data = event.data?.gitblogRelated;
  if (
    data?.version === 1 &&
    data.instance === instance &&
    ["light", "dark"].includes(data.theme)
  )
    setTheme(data.theme);
});
function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
async function load() {
  try {
    const config = normalize({
      repo: params.get("repo") ?? "",
      postId: params.get("postId") ?? "",
      lang: params.get("lang") ?? "",
      showThumbnail: params.get("showThumbnail") !== "false",
      limit: Number(params.get("limit") ?? 4),
      theme: params.get("theme") as "light" | "dark",
    });
    setTheme(config.theme);
    const url = new URL("/v1/related", location.origin);
    url.search = new URLSearchParams({
      repo: config.repo,
      postId: config.postId,
      ...(config.lang ? { locale: config.lang } : {}),
      limit: String(config.limit),
    }).toString();
    const response = await fetch(url, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    const received = readItems(data);
    const locale = config.lang || received[0]?.locale || "";
    const items = received.filter((item) => item.locale === locale);
    document.documentElement.lang = locale;
    const ko = locale.startsWith("ko");
    if (!items.length) {
      state = "empty";
      notify();
      return;
    }
    const header = node("header", "heading");
    header.append(
      node("h2", "title", ko ? "함께 읽으면 좋은 글" : "Related articles"),
    );
    const brand = node("a", "brand", "gitblog");
    brand.href = "https://gitblog.app";
    brand.target = "_blank";
    brand.rel = "noopener noreferrer";
    header.append(brand);
    const intro = node(
      "p",
      "intro",
      ko
        ? "GitBlog에 공개된 글에서 비슷한 이야기를 찾았어요."
        : "Related perspectives from across the GitBlog community.",
    );
    const list = node("ul", "cards");
    for (const item of items) {
      const li = node("li", "");
      const card = node("a", "card");
      card.href = item.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.setAttribute(
        "aria-label",
        `${item.title} (${ko ? "새 탭" : "new tab"})`,
      );
      if (config.showThumbnail) card.append(createCover(item));
      const content = node("div", "card-content");
      const context = node("div", "repo-context");
      const icon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      icon.setAttribute("viewBox", "0 0 16 16");
      icon.setAttribute("aria-hidden", "true");
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute(
        "d",
        "M2.75 2.25h8.5a1 1 0 0 1 1 1v9.5h-8.5a1.5 1.5 0 0 1 0-3h8.5M3.75 2.25v7.5",
      );
      icon.append(path);
      context.append(
        icon,
        node("span", "blog", item.blog.name),
        node("span", "locale", item.locale.toUpperCase()),
      );
      content.append(
        context,
        node("h3", "article-title", item.title),
        node("p", "excerpt", item.excerpt),
      );
      const footer = node("div", "card-footer");
      const tagList = node("span", "tags");
      for (const tag of (item.commonTopics ?? item.commonTags).slice(0, 3))
        tagList.append(node("span", "tag", `#${tag}`));
      footer.append(tagList, node("span", "arrow", "↗"));
      content.append(footer);
      card.append(content);
      li.append(card);
      list.append(li);
    }
    root.replaceChildren(header, intro, list);
    state = "ready";
    new ResizeObserver(notify).observe(document.body);
    notify();
  } catch {
    state = "error";
    root.replaceChildren();
    notify();
  }
}
void load();
