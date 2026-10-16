import { normalize, type Config, type Options, type State } from "./protocol";
export type { Options, State, Theme } from "./protocol";
export interface Panel {
  update(options: Partial<Options>): void;
  destroy(): void;
}
const mounted = new WeakMap<HTMLElement, Panel>();

/** Mount one independently themed iframe. All listeners are scoped to its lifecycle. */
export function mount(target: HTMLElement, options: Options): Panel {
  let input = { ...options };
  function resolveConfig() {
    const pageLang = document.documentElement.lang.trim();
    const lang =
      input.lang?.trim() ||
      (/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(pageLang) &&
      pageLang.length <= 35
        ? pageLang
        : "");
    return normalize({ ...input, lang });
  }
  let config = resolveConfig();
  mounted.get(target)?.destroy();
  let dispose = () => {};
  let destroyed = false;
  function render(current: Config) {
    dispose();
    const origin = new URL(current.baseUrl).origin;
    const instance = crypto.randomUUID();
    const frame = document.createElement("iframe");
    frame.title = current.lang.startsWith("ko")
      ? "함께 읽으면 좋은 글"
      : "Related articles";
    frame.referrerPolicy = "no-referrer";
    frame.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox",
    );
    frame.style.cssText =
      "display:block;width:100%;height:0;border:0;color-scheme:normal;visibility:hidden";
    target.append(frame);
    const media = matchMedia("(prefers-color-scheme: dark)");
    function theme() {
      if (current.theme !== "auto") return current.theme;
      const root = document.documentElement;
      if (root.classList.contains("dark") || root.dataset.theme === "dark")
        return "dark";
      if (root.classList.contains("light") || root.dataset.theme === "light")
        return "light";
      return media.matches ? "dark" : "light";
    }
    function syncTheme() {
      frame.contentWindow?.postMessage(
        { gitblogRelated: { version: 1, instance, theme: theme() } },
        origin,
      );
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let previous: State | undefined;
    function state(next: State) {
      if (previous !== next) {
        previous = next;
        current.onState?.(next);
      }
    }
    function receive(event: MessageEvent) {
      if (event.origin !== origin || event.source !== frame.contentWindow)
        return;
      const data = event.data?.gitblogRelated;
      if (
        data?.version !== 1 ||
        data.instance !== instance ||
        !["ready", "empty", "error"].includes(data.state)
      )
        return;
      if (
        data.state === "ready" &&
        (!Number.isFinite(data.height) || data.height <= 0)
      )
        return;
      clearTimeout(timer);
      frame.style.display = data.state === "ready" ? "block" : "none";
      frame.style.visibility = data.state === "ready" ? "visible" : "hidden";
      frame.style.height =
        data.state === "ready"
          ? `${Math.min(5000, Math.ceil(data.height))}px`
          : "0px";
      state(data.state);
    }
    window.addEventListener("message", receive);
    frame.addEventListener("load", syncTheme);
    const mutation = new MutationObserver(() => {
      const next = resolveConfig();
      if (next.lang !== current.lang) {
        config = next;
        render(config);
      } else syncTheme();
    });
    mutation.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "lang"],
    });
    media.addEventListener("change", syncTheme);
    let started = false;
    function start() {
      if (started) return;
      started = true;
      observer?.disconnect();
      const url = new URL("embed.html", current.baseUrl);
      url.search = new URLSearchParams({
        repo: current.repo,
        postId: current.postId,
        lang: current.lang,
        showThumbnail: String(current.showThumbnail),
        limit: String(current.limit),
        theme: theme(),
        parentOrigin: location.origin,
        instance,
      }).toString();
      frame.src = url.href;
      state("loading");
      timer = setTimeout(() => {
        frame.style.display = "none";
        frame.style.height = "0px";
        state("error");
      }, 15000);
    }
    const observer =
      current.loading === "lazy" && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) start();
            },
            { rootMargin: "600px" },
          )
        : undefined;
    dispose = () => {
      clearTimeout(timer);
      observer?.disconnect();
      mutation.disconnect();
      media.removeEventListener("change", syncTheme);
      window.removeEventListener("message", receive);
      frame.remove();
    };
    if (observer) observer.observe(target);
    else start();
  }
  const panel: Panel = {
    update(next) {
      if (destroyed) throw new Error("Panel is destroyed.");
      const previous = input;
      input = { ...input, ...next };
      try {
        config = resolveConfig();
      } catch (error) {
        input = previous;
        throw error;
      }
      render(config);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      dispose();
      if (mounted.get(target) === panel) mounted.delete(target);
    },
  };
  mounted.set(target, panel);
  render(config);
  return panel;
}
