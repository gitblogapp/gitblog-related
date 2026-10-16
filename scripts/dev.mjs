import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("dist");
const apiOrigin = process.env.RELATED_API_ORIGIN;
const port = Number(process.env.PORT || 4400);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};
const tech = [
  [
    "느슨하게 연결하는 Svelte 컴포넌트",
    "컴포넌트의 책임을 나누고 인터페이스를 단순하게 유지하는 방법.",
    "작은 개발 노트",
    "svelte",
  ],
  [
    "iframe으로 만드는 독립적인 위젯",
    "호스트 스타일과 충돌하지 않는 임베드 UI를 설계합니다.",
    "인터페이스 연구소",
    "웹 컴포넌트",
  ],
  [
    "프런트엔드 성능을 측정하는 기준",
    "체감 성능을 관찰하고 불필요한 네트워크 요청을 줄입니다.",
    "오후의 코드",
    "성능",
  ],
  [
    "디자인 시스템은 경계에서 시작된다",
    "여러 서비스가 함께 사용할 수 있는 작은 UI의 원칙.",
    "형태와 기능",
    "컴포넌트",
  ],
];
const coffee = [
  [
    "한 잔의 커피를 기록하는 노트",
    "원두와 물의 온도, 추출 시간을 바꾸며 찾은 나만의 기준.",
    "아침의 기록",
    "커피",
  ],
  [
    "동네의 작은 로스터리",
    "매일 지나치던 골목에서 만난 새로운 향과 사람들.",
    "산책하는 사람",
    "커피",
  ],
];
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/demo-config") {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ live: !!apiOrigin }));
      return;
    }
    if (url.pathname === "/v1/related") {
      res.setHeader("content-type", "application/json");
      res.setHeader("cache-control", "no-store");
      if (apiOrigin) {
        const upstream = await fetch(
          new URL(url.pathname + url.search, apiOrigin),
          { signal: AbortSignal.timeout(12000) },
        );
        res.statusCode = upstream.status;
        res.end(await upstream.text());
        return;
      }
      const id = url.searchParams.get("postId") || "";
      if (id.endsWith("4")) {
        res.statusCode = 503;
        res.end(JSON.stringify({ error: "Demo unavailable" }));
        return;
      }
      const source = id.endsWith("3") ? [] : id.endsWith("2") ? coffee : tech;
      const en = url.searchParams.get("locale") === "en";
      res.end(
        JSON.stringify({
          version: 1,
          locale: en ? "en" : "ko",
          items: source
            .slice(0, Number(url.searchParams.get("limit") || 4))
            .map(([title, excerpt, name, tag], i) => ({
              id: `demo-${i}`,
              locale: en ? "en" : "ko",
              title: en
                ? [
                    "Designing loosely coupled components",
                    "Building independent embedded widgets",
                    "Measuring frontend performance",
                    "Boundaries of a design system",
                  ][i]
                : title,
              excerpt: en
                ? "An independent perspective from the GitBlog community."
                : excerpt,
              url: "https://example.com/",
              coverUrl: i % 2 === 0 ? "https://gitblog.app/og-image.png" : null,
              blog: { name, repo: `demo/blog-${i}` },
              publishedAt: "2026-10-01",
              commonTags: [tag],
              commonTopics: [tag],
            })),
          ...(source.length ? {} : { emptyReason: "no-matches" }),
        }),
      );
      return;
    }
    if (url.pathname === "/") {
      res.writeHead(302, { location: "/demo/" });
      res.end();
      return;
    }
    let path = decodeURIComponent(url.pathname).replace(
      /^\/related\/v1\//,
      "/",
    );
    if (path.endsWith("/")) path += "index.html";
    const file = resolve(root, "." + path);
    if (!file.startsWith(root + sep)) {
      res.statusCode = 403;
      res.end();
      return;
    }
    res.setHeader(
      "content-type",
      mime[extname(file)] || "application/octet-stream",
    );
    res.setHeader("cache-control", "no-store");
    res.end(await readFile(file));
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(
    `Related demo: http://127.0.0.1:${port}/demo/ (${apiOrigin ? "live API" : "sample data"})`,
  ),
);
