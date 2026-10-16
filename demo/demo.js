const field = (id) => document.getElementById(id);
let panel;
let live = false;
function render() {
  document.documentElement.lang = field("lang").value;
  const options = {
    repo: field("repo").value,
    postId: field("postId").value,
    theme: field("theme").value,
    // Simulate the host article's language; the SDK reads <html lang> automatically.
    showThumbnail: field("showThumbnail").value === "true",
    limit: Number(field("limit").value),
    loading: "eager",
    baseUrl: new URL("/related/v1/", location.href).href,
    onState: (state) => {
      field("state").textContent = `패널 상태: ${state}`;
    },
  };
  field("preview").dataset.theme =
    options.theme === "auto"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : options.theme;
  try {
    if (panel) panel.update(options);
    else panel = window.GitBlogRelated.mount(field("panel"), options);
  } catch (error) {
    field("state").textContent = error.message;
  }
}
field("settings").addEventListener("submit", (event) => {
  event.preventDefault();
  render();
});
field("sample").addEventListener("change", () => {
  if (live) return;
  const value = field("sample").value;
  field("postId").value = `00000000-0000-4000-8000-${value.padStart(12, "0")}`;
  field("article-title").textContent =
    value === "2"
      ? "매일 마시는 커피에도 이야기가 있다"
      : "작게 나누고, 느슨하게 연결하기";
  render();
});
for (const id of ["theme", "lang", "limit", "showThumbnail"])
  field(id).addEventListener("change", render);
field("destroy").addEventListener("click", () => {
  panel?.destroy();
  panel = undefined;
  field("state").textContent = "패널 상태: destroyed";
});
fetch("/demo-config")
  .then((response) => response.json())
  .then((config) => {
    live = config.live;
    field("sample").disabled = live;
    field("mode").textContent = live
      ? "실제 API 모드: 등록된 저장소와 원본 글 UUID를 입력하세요."
      : "샘플 데이터 모드: GitHub 연결이나 로그인이 필요 없습니다.";
    if (!live) render();
  })
  .catch(() => {
    field("mode").textContent = "npm run dev로 데모 서버를 실행하세요.";
  });
