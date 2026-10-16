# GitBlog Related

GitBlog 전체 공개 글에서 현재 글과 비슷한 글을 표시하는 독립 임베드입니다. 프레임워크 없는 TypeScript 로더와 iframe 패널로 구성되며, GitBlog의 글 DB를 사용하는 `GET /v1/related` API에 연결합니다. 블로그 템플릿과 giscus에 의존하지 않습니다.

브라우저 라이브러리는 GitBlog의 `/related/v1/` 경로에 배포합니다. npm 패키지 게시와 블로그 템플릿 적용은 별도 단계입니다. 로컬 데모의 기본 데이터는 샘플입니다.

## 빠른 데모

```sh
npm ci
npm run dev
```

`http://127.0.0.1:4400/demo/`에서 테마, 현재 글 언어, 썸네일 표시 여부, 개수, 글 전환, 빈 결과와 API 오류를 확인할 수 있습니다. 기본 데모는 샘플 데이터이며 실제 추천 품질을 나타내지 않습니다. `http://127.0.0.1:4400/demo/snippet.html`은 선언형 스크립트 두 개를 사용한 독립 패널 예제입니다.

## 스크립트 임베드

아래 URL은 GitBlog에 호스팅하는 브라우저 라이브러리의 배포 주소입니다.

```html
<script
  async
  src="https://gitblog.app/related/v1/client.js"
  data-repo="owner/blog"
  data-post-id="00000000-0000-4000-8000-000000000001"
  data-lang="ko"
  data-show-thumbnail="true"
  data-theme="auto"
  data-limit="4"
></script>
```

- `data-post-id`: 템플릿 Markdown의 원본 UUID / RSS의 `hub:postId`. GitBlog 내부에서 파생한 글 ID가 아닙니다.
- 언어는 실제 조회한 글의 `post.locale`을 `data-lang` / `lang`에 전달하는 것이 우선입니다. 예: 한국어 기본 블로그에서 영어 번역 글을 보고 있다면 `en`.
- 언어 생략 시 호스트 `<html lang>`을 사용하고, 유효한 페이지 언어도 없으면 API가 등록된 블로그의 `source_locale`을 사용합니다. 명시한 언어의 원본 글이 없으면 다른 언어로 바꾸지 않고 패널을 접습니다.
- 페이지 언어를 자동 사용 중이면 SPA의 `<html lang>` 변경도 감지합니다. 명시한 `lang`은 유지되므로 글 이동 시 `panel.update({ postId: post.id, lang: post.locale })`로 함께 갱신하세요.
- 썸네일 기본값은 표시입니다. `data-show-thumbnail="false"` 또는 `showThumbnail: false`로 숨기면 이미지 요청과 이니셜 대체 영역 모두 생성하지 않습니다.
- 테마 `auto`, 개수 `4` (1–8), 로딩 `lazy` (`data-loading="eager"` 지원).
- `auto`는 부모 문서의 `dark`/`light` 클래스 또는 `data-theme`, 이후 OS 색상 설정 순으로 결정합니다.
- 한 페이지에 여러 스크립트를 사용할 수 있습니다. 각 패널의 상태와 메시지는 독립적입니다.
- 오류·관련 글 없음·미수집 글은 패널 영역을 접습니다. 관련 없는 인기 글을 대신 채우지 않습니다.
- 추천 링크는 새 탭에서 원문을 엽니다. 로그인·쿠키·사용자 활동 수집을 사용하지 않습니다.
- CSP를 사용하는 호스트는 로더의 `script-src`와 iframe의 `frame-src`에 배포 호스트를 허용해야 합니다.
- 로더는 화면 600px 이내에 접근하면 요청합니다. 별도 초기 높이는 확보하지 않으며 완료 후 콘텐츠 높이로 펼칩니다.

## SPA / 라이브러리 API

빌드된 `dist/index.js`는 의존성 없는 ESM이며 `dist/types/`에 타입이 포함됩니다. 패키지 설치 전에는 로컬 경로나 배포된 ESM URL로 가져올 수 있습니다.

```js
import { mount } from "./dist/index.js";

const panel = mount(document.querySelector("#related"), {
  repo: "owner/blog",
  postId: "00000000-0000-4000-8000-000000000001",
  lang: "ko", // 실제 조회한 post.locale을 전달
  showThumbnail: true,
  theme: "auto",
  limit: 4,
  onState: (state) => console.log(state), // loading | ready | empty | error
});

// 글 이동 시 호출. 이전 iframe, 타이머, 이벤트와 observer를 정리합니다.
panel.update({ postId: "00000000-0000-4000-8000-000000000002", lang: "en" });
panel.update({ showThumbnail: false });
// 페이지 컴포넌트가 해제될 때 반드시 호출합니다.
panel.destroy();
```

`client.js`를 먼저 불러온 경우 `window.GitBlogRelated.mount()`도 같습니다. `baseUrl`로 `embed.html`이 있는 디렉터리를 지정할 수 있습니다. HTTPS가 기본이며 로컬 테스트에서만 localhost HTTP를 허용합니다. 해당 호스트의 `/v1/related`가 API여야 합니다. 부모 문서의 본문은 읽거나 전송하지 않습니다.

## 실제 API 연결 및 GitBlog 호스팅

API 구현과 마이그레이션은 형제 `gitblog` 저장소에 있습니다.

- `migrations/0022_related_posts.sql`: FTS5 검색 인덱스와 동기화 트리거.
- `src/lib/server/related/`: 입력 검증, 후보 검색, 순위 계산.
- `src/routes/v1/related/+server.ts`: 공개 읽기 전용 API, CORS, 요청 제한.

브라우저 파일을 GitBlog의 정적 파일 디렉터리에 내보냅니다. 템플릿 소스는 변경하지 않습니다.

```sh
npm run export:gitblog
# ../gitblog/static/related/v1/ 에 client.js, index.js, embed.html, 해시된 JS/CSS 생성
```

배포 순서는 라이브러리 export → GitBlog 빌드 → D1 마이그레이션 → GitBlog Worker 배포입니다. GitBlog 루트의 `_headers`는 `/related/v1/*`에 외부 ESM 로딩을 위한 CORS와 재검증 캐시를 적용합니다. 해시된 JS/CSS는 추후 장기 캐시할 수 있습니다. 이전 해시 자산은 열린 페이지가 사용할 수 있어 export 시 보존합니다.

실제 로컬 API를 데모에 연결하려면:

```sh
RELATED_API_ORIGIN=http://127.0.0.1:8787 npm run dev
```

데모 서버가 `/v1/related`만 로컬 API로 프록시합니다. 샘플 선택은 비활성화되며 실제 등록된 저장소와 원본 글 UUID를 입력해야 합니다. `demo/seed.sql`은 **격리된 로컬 D1 테스트 DB 전용** 샘플입니다.

## 추천 계약

```http
GET /v1/related?repo=owner/blog&postId=원본UUID&locale=ko&limit=4
```

```json
{
  "version": 1,
  "locale": "ko",
  "items": [
    {
      "id": "GitBlog-내부ID",
      "locale": "ko",
      "title": "관련 글 제목",
      "url": "https://example.com/article",
      "coverUrl": "https://example.com/cover.png",
      "excerpt": "짧은 요약",
      "blog": { "name": "블로그명", "repo": "owner/another-blog" },
      "publishedAt": "2026-10-01T00:00:00Z",
      "commonTags": ["svelte"],
      "commonTopics": ["svelte", "성능"]
    }
  ]
}
```

`locale` 파라미터는 생략 가능하며 이때 블로그 기본 언어를 조회합니다. 응답의 `locale`은 실제 원본 글 언어이고, 원본을 찾을 수 없으면 요청 언어 또는 `null`입니다. 결과가 없으면 `items: []`, `emptyReason: "source-unavailable" | "no-matches"`입니다. 형식 오류는 400, 제한 초과는 429 (`Retry-After`), DB 미설정은 503입니다. 익명 요청만 필요하며 `Access-Control-Allow-Origin: *`, `Cache-Control: no-store`를 사용합니다.

숏츠의 `shorts_topics` 인덱스를 재사용해 카테고리와 태그를 합친 주제 후보와 FTS5 내용 후보를 각각 최대 80개 가져와 중복 제거합니다. 태그→카테고리, 카테고리→태그, 카테고리→카테고리 일치도 포함됩니다. `Notes`, `Uncategorized`는 주제 근거에서 제외합니다. 주제는 공유 인덱스와 동일하게 공백 제거·ASCII 소문자화로 정규화합니다.

희소 주제 일치에 높은 점수를 주고, 제목·본문도 함께 일치하면 추가 점수를 줍니다. 같은 블로그 반복은 감점하고 동점일 때 날짜·ID로 정렬합니다. `commonTopics`는 UI에 표시하는 공통 주제이며, 이전 클라이언트를 위해 실제 공통 태그만 담은 `commonTags`도 유지합니다. 같은 언어만 반환하고 자기 글/번역본, 미래 날짜, 비활성 글·블로그, 삭제 기록은 제외합니다. 후보 ID와 주제 빈도 숫자만 최대 60초/256항목으로 메모리에 캐시하고 응답마다 최신 데이터와 공개 상태를 다시 읽습니다. 요청 중 GitHub나 LLM 호출은 없습니다.

내용 추천은 저장된 제목·요약·본문 발췌(수집 시 최대 1,200자)에 대한 단어 기반 검색입니다. 검색어는 제목 최대 8개, 요약 6개, 본문 10개로 나누어 중복을 제거하므로 긴 제목·요약이 본문을 밀어내지 않습니다. 의미 임베딩이나 한국어 형태소 분석은 포함하지 않습니다. 현재 한국어/영어 패널 문구를 지원하며, 다른 콘텐츠 언어는 영어 UI로 표시합니다. 실제 글에 대한 관련성 평가와 대규모 데이터 부하는 배포 전 별도로 진행해야 합니다.

## 디자인 / 검증

`src/tokens.css`는 GitBlog 웹의 `src/app.css` 색상과 글꼴 토큰을 복사한 독립 스냅샷입니다. 패널은 동일한 6px 모서리, 파란 링크, 저장소 아이콘, 언어 배지, 태그 pill, 라이트/다크 표면색을 사용합니다. iframe 내부 520px 이하에서는 한 열로 바뀝니다. 디자인 토큰 변경 시 이 파일도 동기화하세요.

카드 상단에는 수집된 글의 `cover_url`을 `coverUrl`로 전달받아 16:9 썸네일로 표시합니다. HTTPS 이미지만 허용하고 지연 로딩 및 referrer 생략을 적용합니다. 이미지가 없거나 로딩에 실패하면 GitBlog 글 카드처럼 블로그 이니셜과 이름을 표시합니다. 이전 v1 응답에 `coverUrl`이 없어도 동작합니다. 샘플 데모는 GitBlog 대표 이미지와 이미지 없는 카드를 함께 보여줍니다.

```sh
npm run check
npm test
npm run build
```

SDK 테스트는 인스턴스별 메시지 검증, 글 전환, 중복 mount, destroy, lazy/timeout, 안전한 URL을 확인합니다. API 테스트는 GitBlog 저장소에서 실제 SQLite FTS5와 마이그레이션으로 실행합니다. 런타임 의존성은 없으며 개발 도구는 `package-lock.json`으로 고정합니다.

## 로컬 비용 검증

형제 GitBlog 저장소에서 `npx vitest run --config scripts/related-benchmark.config.ts`를 실행하면 격리된 임시 D1에 합성 글 10,000개를 넣고, 좁은 주제/넓은 주제의 첫 조회와 캐시 조회에 대한 `rows_read`, `rows_written`, 쿼리 수를 측정합니다. 결과는 `/tmp/gitblog-related-benchmark.json`에 저장합니다. 운영 DB와 인증 정보는 사용하지 않습니다.

이 수치는 로컬 D1의 합성 데이터 기준이며 운영 과금이나 Worker CPU 시간 측정값이 아닙니다. 운영 비용 확정에는 실제 트래픽에서 D1 행 수와 Workers CPU 지표를 확인해야 합니다. 후보 80개 제한은 읽은 행 80개 제한을 뜻하지 않습니다.

10,000개 합성 글 측정에서 첫 조회는 약 4.1만~14.9만 행, 같은 실행 인스턴스의 후보 캐시 적중 조회는 326행을 읽었습니다. 요청 제한 카운터 때문에 요청당 1~2행 쓰기도 발생합니다. 공통 단어/주제가 많은 데이터의 첫 조회는 여전히 읽기량이 크며, 60초 메모리 캐시 적중률은 실행 인스턴스와 트래픽에 따라 달라집니다. 이 결과를 근거로 운영 비용을 월 $5로 확정할 수는 없습니다.
