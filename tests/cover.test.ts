import { expect, it } from "vitest";
import { createCover } from "../src/cover";
import { readItems, type RelatedItem } from "../src/protocol";

const item: RelatedItem = {
  id: "post",
  locale: "ko",
  title: "글",
  url: "https://example.com/post",
  excerpt: "요약",
  blog: { name: "개발 노트", repo: "owner/blog" },
  publishedAt: "2026-01-01",
  commonTags: [],
};

it("loads a cover without leaking the referrer and retains a fallback after an image error", () => {
  const cover = createCover({
    ...item,
    coverUrl: "https://example.com/cover.png",
  });
  const image = cover.querySelector("img")!;
  expect(image.src).toBe("https://example.com/cover.png");
  expect(image.referrerPolicy).toBe("no-referrer");
  expect(image.loading).toBe("lazy");
  image.dispatchEvent(new Event("error"));
  expect(cover.querySelector("img")).toBeNull();
  expect(cover.querySelector("strong")?.textContent).toBe("개");
  expect(cover.querySelector("small")?.textContent).toBe("개발 노트");
});

it("keeps articles with missing, malformed or unsafe covers using the fallback", () => {
  for (const coverUrl of [
    undefined,
    null,
    "javascript:alert(1)",
    "http://example.com/x",
    "https://user:pass@example.com/x",
    42,
  ]) {
    const [result] = readItems({ version: 1, items: [{ ...item, coverUrl }] });
    expect(result.id).toBe(item.id);
    expect(result.coverUrl).toBeNull();
    expect(createCover(result).querySelector("img")).toBeNull();
  }
  expect(
    readItems({
      version: 1,
      items: [{ ...item, coverUrl: "https://example.com/x.png" }],
    })[0].coverUrl,
  ).toBe("https://example.com/x.png");
});
