import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mount, type Panel } from "../src/index";
import { normalize, readItems } from "../src/protocol";
const options = {
  repo: "owner/blog",
  postId: "00000000-0000-4000-8000-000000000001",
  loading: "eager" as const,
};
let target: HTMLDivElement;
const panels: Panel[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  const create = document.createElement.bind(document);
  // Keep a real iframe WindowProxy while avoiding network navigation in unit tests.
  vi.spyOn(document, "createElement").mockImplementation((tag, options) => {
    const element = create(tag, options);
    if (tag === "iframe")
      element.setAttribute(
        "srcdoc",
        "<!doctype html><html><body></body></html>",
      );
    return element;
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  target = document.createElement("div");
  document.body.append(target);
});
afterEach(() => {
  panels.splice(0).forEach((panel) => panel.destroy());
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function panel(custom = {}) {
  const value = mount(target, { ...options, ...custom });
  panels.push(value);
  vi.spyOn(
    target.querySelector("iframe")!.contentWindow!,
    "postMessage",
  ).mockImplementation(() => {});
  return value;
}
function message(
  frame: HTMLIFrameElement,
  change = {},
  origin = "https://gitblog.app",
  source = frame.contentWindow,
) {
  const instance = new URL(frame.src).searchParams.get("instance");
  window.dispatchEvent(
    new MessageEvent("message", {
      origin,
      source,
      data: {
        gitblogRelated: {
          version: 1,
          instance,
          state: "ready",
          height: 400,
          ...change,
        },
      },
    }),
  );
}
it("scopes messages by origin, frame and instance, and bounds resize messages", () => {
  const onState = vi.fn();
  panel({ onState });
  const frame = target.querySelector("iframe")!;
  message(frame, {}, "https://evil.example");
  message(frame, {}, "https://gitblog.app", window);
  message(frame, { instance: "old" });
  expect(onState).toHaveBeenCalledTimes(1);
  message(frame, { height: Infinity });
  expect(frame.style.height).toBe("0px");
  message(frame, { height: 9000 });
  expect(frame.style.height).toBe("5000px");
  expect(onState).toHaveBeenLastCalledWith("ready");
  message(frame, { state: "empty" });
  expect(frame.style.display).toBe("none");
  expect(frame.style.height).toBe("0px");
});
it("replaces an old article on update and ignores its late messages", () => {
  const onState = vi.fn();
  const instance = panel({ onState });
  const old = target.querySelector("iframe")!;
  instance.update({ postId: "00000000-0000-4000-8000-000000000002" });
  const next = target.querySelector("iframe")!;
  expect(target.querySelectorAll("iframe")).toHaveLength(1);
  expect(next).not.toBe(old);
  message(old);
  expect(onState).toHaveBeenLastCalledWith("loading");
  expect(new URL(next.src).searchParams.get("postId")).toContain(
    "000000000002",
  );
});
it("updates themes in place without navigating or resetting a ready panel", () => {
  const onState = vi.fn();
  const instance = panel({ theme: "light", onState });
  const frame = target.querySelector("iframe")!;
  const src = frame.src;
  message(frame);
  const count = onState.mock.calls.length;
  for (const theme of ["dark", "light", "dark"] as const) {
    instance.update({ theme });
    expect(target.querySelector("iframe")).toBe(frame);
    expect(frame.src).toBe(src);
    expect(frame.style.height).toBe("400px");
    expect(frame.style.visibility).toBe("visible");
    expect(onState).toHaveBeenCalledTimes(count);
    expect(frame.contentWindow!.postMessage).toHaveBeenLastCalledWith(
      { gitblogRelated: { version: 1, instance: new URL(src).searchParams.get("instance"), theme } },
      "https://gitblog.app",
    );
  }
  frame.dispatchEvent(new Event("load"));
  expect(frame.contentWindow!.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({ gitblogRelated: expect.objectContaining({ theme: "dark" }) }),
    "https://gitblog.app",
  );
  instance.update({ limit: 2 });
  expect(target.querySelector("iframe")).not.toBe(frame);
  expect(new URL(target.querySelector("iframe")!.src).searchParams.get("limit")).toBe("2");
});
it("retains lazy loading when the theme changes before the panel enters view", () => {
  let enter = (_entries: { isIntersecting: boolean }[]) => {};
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: typeof enter) { enter = callback; }
    observe() {}
    disconnect() {}
  });
  const instance = panel({ loading: "lazy", theme: "light" });
  const frame = target.querySelector("iframe")!;
  instance.update({ theme: "dark" });
  expect(target.querySelector("iframe")).toBe(frame);
  expect(frame.getAttribute("src")).toBeNull();
  enter([{ isIntersecting: true }]);
  expect(new URL(frame.src).searchParams.get("theme")).toBe("dark");
});
it("cleans up on destroy and prevents duplicate mounts on one target", () => {
  const first = panel();
  panel();
  expect(target.querySelectorAll("iframe")).toHaveLength(1);
  first.destroy();
  expect(target.querySelectorAll("iframe")).toHaveLength(1);
  panels.at(-1)!.destroy();
  expect(target.children).toHaveLength(0);
  expect(() => first.update({ limit: 2 })).toThrow("destroyed");
});
it("keeps simultaneous panels independent", () => {
  const first = panel();
  const second = document.createElement("div");
  document.body.append(second);
  const secondPanel = mount(second, options);
  panels.push(secondPanel);
  message(target.querySelector("iframe")!);
  expect(second.querySelector("iframe")!.style.height).toBe("0px");
  first.destroy();
  expect(second.children).toHaveLength(1);
});
it("starts lazy loading only near the viewport and cleans up timeout failures", () => {
  let enter: (entries: { isIntersecting: boolean }[]) => void = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: typeof enter) {
        enter = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  const onState = vi.fn();
  panel({ loading: "lazy", onState });
  const frame = target.querySelector("iframe")!;
  expect(frame.getAttribute("src")).toBeNull();
  enter([{ isIntersecting: true }]);
  expect(frame.src).toContain("/embed.html?");
  vi.advanceTimersByTime(15000);
  expect(onState).toHaveBeenLastCalledWith("error");
  expect(frame.style.display).toBe("none");
  expect(disconnect).toHaveBeenCalled();
});
it("rejects unsafe host URLs and malformed options before mounting", () => {
  for (const baseUrl of [
    "javascript:alert(1)",
    "https://user:secret@evil.example/",
    "http://evil.example/",
  ])
    expect(() => normalize({ ...options, baseUrl })).toThrow();
  expect(
    normalize({ ...options, baseUrl: "http://127.0.0.1:4400/related/v1/" })
      .baseUrl,
  ).toContain("127.0.0.1");
  expect(() => normalize({ ...options, limit: 100 })).toThrow();
  expect(() => normalize({ ...options, postId: "bad" })).toThrow();
});
it("ignores unsafe or malformed article links returned by an API", () => {
  const item = {
    id: "x",
    locale: "ko",
    title: "title",
    url: "https://example.com",
    excerpt: "excerpt",
    blog: { name: "name", repo: "owner/blog" },
    commonTags: [],
    publishedAt: "2026-01-01",
  };
  expect(
    readItems({
      version: 1,
      items: [
        item,
        { ...item, url: "javascript:alert(1)" },
        { ...item, blog: null },
      ],
    }),
  ).toEqual([{ ...item, coverUrl: null }]);
  expect(() => readItems({ items: [] })).toThrow();
});

it("defaults to the current page language, follows SPA language changes and transmits the thumbnail option", async () => {
  document.documentElement.lang = "ko";
  const instance = panel({ showThumbnail: false });
  const before = target.querySelector("iframe")!;
  expect(new URL(before.src).searchParams.get("lang")).toBe("ko");
  expect(new URL(before.src).searchParams.get("showThumbnail")).toBe("false");
  document.documentElement.lang = "en";
  await vi.advanceTimersByTimeAsync(0);
  const next = target.querySelector("iframe")!;
  expect(next).not.toBe(before);
  expect(new URL(next.src).searchParams.get("lang")).toBe("en");
  instance.update({
    postId: "00000000-0000-4000-8000-000000000002",
    showThumbnail: true,
  });
  expect(
    new URL(target.querySelector("iframe")!.src).searchParams.get(
      "showThumbnail",
    ),
  ).toBe("true");
  document.documentElement.removeAttribute("lang");
});

it("prioritizes the actual article locale and leaves fallback selection to the server when unknown", async () => {
  document.documentElement.lang = "ko";
  const instance = panel({ lang: "ja" });
  document.documentElement.lang = "en";
  await vi.advanceTimersByTimeAsync(0);
  expect(
    new URL(target.querySelector("iframe")!.src).searchParams.get("lang"),
  ).toBe("ja");
  document.documentElement.removeAttribute("lang");
  instance.update({ lang: undefined });
  expect(
    new URL(target.querySelector("iframe")!.src).searchParams.get("lang"),
  ).toBe("");
  expect(() =>
    normalize({ ...options, showThumbnail: "false" as unknown as boolean }),
  ).toThrow();
});
