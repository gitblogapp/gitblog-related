import { afterEach, expect, it, vi } from "vitest";

const item = {
  id: "post",
  locale: "en",
  title: "Shared topics",
  url: "https://example.com/post",
  coverUrl: "https://example.com/image.png",
  excerpt: "Article excerpt",
  blog: { name: "Blog", repo: "owner/blog" },
  publishedAt: "2026-01-01",
  commonTags: [],
  commonTopics: ["svelte"],
};
afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
  history.replaceState({}, "", "/");
});
async function embed(query: string, items = [item]) {
  vi.resetModules();
  document.body.innerHTML = '<section id="related"></section>';
  document.documentElement.lang = "ko";
  history.replaceState(
    {},
    "",
    `/?repo=owner/blog&postId=00000000-0000-4000-8000-000000000001&theme=light&${query}`,
  );
  const fetch = vi
    .fn()
    .mockResolvedValue({
      ok: true,
      json: async () => ({ version: 1, locale: "en", items }),
    });
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
    },
  );
  await import("../src/embed");
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  return fetch;
}
it("omits all image elements when thumbnails are disabled and renders shared categories as topics", async () => {
  const fetch = await embed("showThumbnail=false&lang=en");
  await vi.waitFor(() =>
    expect(document.querySelector(".article-title")?.textContent).toBe(
      item.title,
    ),
  );
  expect(document.querySelector(".card-visual")).toBeNull();
  expect(document.querySelector("img")).toBeNull();
  expect(document.querySelector(".tag")?.textContent).toBe("#svelte");
  expect(new URL(fetch.mock.calls[0][0]).searchParams.get("locale")).toBe("en");
});
it("leaves unknown language to the API and uses its resulting article language", async () => {
  const fetch = await embed("");
  await vi.waitFor(() => expect(document.querySelector("img")).not.toBeNull());
  expect(new URL(fetch.mock.calls[0][0]).searchParams.has("locale")).toBe(
    false,
  );
  expect(document.documentElement.lang).toBe("en");
  expect(document.querySelector("h2")?.textContent).toBe("Related articles");
});
it("does not display another language when an explicit article language was supplied", async () => {
  await embed("lang=ko");
  expect(document.querySelector(".card")).toBeNull();
});
