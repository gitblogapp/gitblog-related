export type Theme = "auto" | "light" | "dark";
export type State = "loading" | "ready" | "empty" | "error";
export interface Options {
  repo: string;
  /** Original post UUID from the blog, not the Hub's derived ID. */
  postId: string;
  lang?: string;
  showThumbnail?: boolean;
  theme?: Theme;
  limit?: number;
  loading?: "lazy" | "eager";
  /** Directory containing embed.html; defaults to the GitBlog hosted v1 release. */
  baseUrl?: string;
  onState?: (state: State) => void;
}
export type Config = Required<Omit<Options, "onState">> &
  Pick<Options, "onState">;
export function normalize(options: Options): Config {
  if (
    !/^[a-z0-9-]{1,39}\/[a-z0-9_.-]{1,100}$/i.test(options.repo) ||
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(options.postId)
  )
    throw new Error("Invalid repo or original post UUID.");
  const lang = (options.lang ?? "").trim();
  const showThumbnail = options.showThumbnail ?? true;
  const theme = options.theme ?? "auto";
  const limit = options.limit ?? 4;
  const loading = options.loading ?? "lazy";
  if (
    lang.length > 35 ||
    (lang !== "" && !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(lang)) ||
    typeof showThumbnail !== "boolean" ||
    !["auto", "light", "dark"].includes(theme) ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 8 ||
    !["lazy", "eager"].includes(loading)
  )
    throw new Error("Invalid related panel options.");
  const base = new URL(options.baseUrl ?? "https://gitblog.app/related/v1/");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
  if (
    (base.protocol !== "https:" && !(local && base.protocol === "http:")) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  )
    throw new Error("Embed host must be HTTPS (or local HTTP).");
  if (!base.pathname.endsWith("/")) base.pathname += "/";
  return {
    ...options,
    repo: options.repo.toLowerCase(),
    postId: options.postId.toLowerCase(),
    lang: lang.toLowerCase(),
    showThumbnail,
    theme,
    limit,
    loading,
    baseUrl: base.href,
  };
}
export interface RelatedItem {
  id: string;
  locale: string;
  title: string;
  url: string;
  /** Optional for compatibility with earlier v1 API responses. */
  coverUrl?: string | null;
  excerpt: string;
  blog: { name: string; repo: string };
  publishedAt: string;
  commonTags: string[];
  commonTopics?: string[];
}
export function readItems(data: unknown): RelatedItem[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("version" in data) ||
    data.version !== 1 ||
    !("items" in data) ||
    !Array.isArray(data.items)
  )
    throw new Error("Invalid related API response.");
  return data.items
    .slice(0, 8)
    .filter((item): item is RelatedItem => {
      if (
        !item ||
        typeof item !== "object" ||
        typeof item.id !== "string" ||
        typeof item.title !== "string" ||
        typeof item.excerpt !== "string" ||
        typeof item.locale !== "string" ||
        typeof item.publishedAt !== "string" ||
        !item.blog ||
        typeof item.blog.name !== "string" ||
        typeof item.blog.repo !== "string" ||
        !Array.isArray(item.commonTags) ||
        !item.commonTags.every((tag: unknown) => typeof tag === "string") ||
        (item.commonTopics !== undefined &&
          (!Array.isArray(item.commonTopics) ||
            !item.commonTopics.every(
              (topic: unknown) => typeof topic === "string",
            )))
      )
        return false;
      try {
        const url = new URL(item.url);
        return url.protocol === "https:" && !url.username && !url.password;
      } catch {
        return false;
      }
    })
    .map((item) => ({ ...item, coverUrl: safeCoverUrl(item.coverUrl) }));
}

export function safeCoverUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
