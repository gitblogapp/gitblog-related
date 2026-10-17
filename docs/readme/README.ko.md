# GitBlog Related

블로그 글 아래에 **함께 읽으면 좋은 글**을 표시하는 추천 패널입니다.
[GitBlog](https://gitblog.app)에 공개된 글 중 현재 글의 태그·카테고리·내용이 비슷한 글을 찾아, 같은 언어로 보여줍니다.

스크립트 하나로 사용할 수 있으며, 별도 서버 설치나 API 키가 필요하지 않습니다. 라이트·다크 테마, 썸네일 표시, 추천 개수를 설정할 수 있습니다. 추천 글을 클릭하면 새 탭에서 원문이 열립니다.

## 시작하기 전에

추천의 기준이 되는 블로그와 글이 GitBlog에 등록·수집되어 있어야 합니다. 임베드를 붙이는 것만으로 블로그가 등록되거나 현재 페이지의 본문이 수집되지는 않습니다.

다음 두 값을 준비하세요.

- **저장소 이름**: 블로그의 GitHub 저장소를 `owner/repository` 형식으로 입력합니다.
- **글 ID**: 글 Markdown의 `id`에 있는 원본 UUID입니다. RSS의 `<hub:postId>`에서도 확인할 수 있습니다. 글 주소, 파일명, GitBlog 상세 페이지 URL의 ID를 넣지 마세요.

예를 들어 Markdown의 맨 위가 아래와 같다면 `id` 값을 사용합니다.

```yaml
---
id: 123e4567-e89b-42d3-a456-426614174000
title: 나의 첫 번째 글
---
```

## HTML에 추가하기

추천 패널을 표시할 위치에 다음 스크립트를 넣으세요. `data-repo`와 `data-post-id`는 **실제 블로그와 현재 글의 값**으로 바꿔야 합니다.

```html
<script
  async
  src="https://gitblog.app/related/v1/client.js"
  data-repo="owner/repository"
  data-post-id="123e4567-e89b-42d3-a456-426614174000"
  data-lang="ko"
  data-theme="auto"
  data-show-thumbnail="true"
  data-limit="4"
></script>
```

패널은 스크립트를 넣은 자리에 표시됩니다. 여러 글 페이지에 적용할 때는 페이지마다 해당 글의 ID와 언어를 전달하세요.

### 설정 옵션

| HTML 속성 | JavaScript 옵션 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `data-repo` | `repo` | 필수 | 블로그 저장소 이름 (`owner/repository`) |
| `data-post-id` | `postId` | 필수 | 현재 글의 원본 UUID |
| `data-lang` | `lang` | 페이지 언어 | 현재 읽고 있는 글의 언어 (`ko`, `en`, `ja` 등) |
| `data-theme` | `theme` | `auto` | `auto`, `light`, `dark` |
| `data-show-thumbnail` | `showThumbnail` | `true` | 썸네일 표시 여부 |
| `data-limit` | `limit` | `4` | 최대 추천 개수. 1~8 사이의 정수 |
| `data-loading` | `loading` | `lazy` | 화면 가까이 오면 로드. 바로 로드하려면 `eager` |

관련 글이 부족하면 설정한 개수보다 적게 표시됩니다. 썸네일이 없는 글은 블로그 이름과 이니셜로 표시하며, 썸네일 옵션을 끄면 이 영역도 숨깁니다.

### 글 언어

한국어 블로그에서 영어 번역 글을 읽는 페이지라면 `data-lang="en"`을 지정하세요. 블로그의 기본 언어가 아닌 **현재 글의 언어**를 전달하는 것이 좋습니다.

언어를 생략하면 페이지의 `<html lang="…">`을 사용합니다. 유효한 페이지 언어도 없으면 GitBlog에 등록된 블로그의 기본 언어를 사용합니다. 지정한 언어의 글이 없을 때 다른 언어의 글로 대체하지 않습니다.

### 테마

`auto`는 페이지의 `<html>`에 지정된 `dark`·`light` 클래스 또는 `data-theme="dark"`·`data-theme="light"`를 따릅니다. 둘 다 없으면 기기의 색상 설정을 사용합니다.

```html
<html lang="ko" class="dark">
```

테마가 바뀌면 추천 내용을 다시 불러오지 않고 색상만 바뀝니다. 임베드의 바깥 배경은 투명하고 카드 배경은 반투명이므로 블로그 배경과 자연스럽게 어울립니다.

## GitBlog 블로그 템플릿에서 사용하기

추천 패널이 내장된 [Svelte GitBlog Template](https://github.com/gitblogapp/svelte-gitblog-template)을 사용한다면 스크립트를 따로 추가할 필요가 없습니다.

GitBlog의 **블로그 설정 → 추천 글 패널**에서 표시 여부, 썸네일, 추천 개수를 설정할 수 있습니다. 저장 후 블로그 배포가 완료되면 반영됩니다.

직접 설정하려면 블로그 저장소의 `.env.production`에서 다음 값을 변경하세요.

```dotenv
PUBLIC_RELATED_ENABLED=true
PUBLIC_RELATED_SHOW_THUMBNAIL=true
PUBLIC_RELATED_LIMIT=4
```

기본값은 패널·썸네일 표시, 최대 4개입니다. `PUBLIC_HUB_ENABLED=true`도 필요합니다. 기존 블로그에서 개수 설정이 적용되지 않으면 템플릿을 **1.0.10 이상**으로 업데이트하세요.

## JavaScript로 사용하기

페이지 이동 없이 글이 바뀌는 웹사이트나 React·Vue·Svelte 등의 앱에서는 `mount()`로 패널을 만들고, 글이 바뀔 때 `update()`를 호출하세요. `mount()`는 브라우저에서만 실행해야 합니다.

다음은 별도 빌드 도구 없이 사용할 수 있는 예제입니다.

```html
<div id="related"></div>

<script type="module">
  import { mount } from "https://gitblog.app/related/v1/index.js";

  const panel = mount(document.querySelector("#related"), {
    repo: "owner/repository",
    postId: "123e4567-e89b-42d3-a456-426614174000",
    lang: "ko",
    theme: "auto",
    showThumbnail: true,
    limit: 4,
  });

  // 앱에서 다른 글로 이동할 때 호출하세요.
  function showArticle(post) {
    panel.update({ postId: post.id, lang: post.locale });
  }

  // 페이지 컴포넌트가 해제될 때 호출하세요.
  function cleanup() {
    panel.destroy();
  }
</script>
```

`update()`에는 바꿀 옵션만 전달하면 됩니다.

```js
panel.update({ theme: "dark" }); // 기존 iframe을 유지하고 색상만 변경
panel.update({ showThumbnail: false, limit: 2 });
```

로딩 상태가 필요하면 `mount()` 옵션에 `onState` 콜백을 추가하세요. 상태는 `loading`, `ready`, `empty`, `error` 중 하나입니다.

```js
onState: (state) => console.log("추천 패널 상태:", state)
```

언어를 생략한 패널은 `<html lang>` 변경을 자동 감지합니다. `lang`을 직접 지정했다면 글 전환 시 `postId`와 `lang`을 함께 갱신하세요. 한 페이지에 여러 패널을 만들 수도 있습니다.

## 패널이 보이지 않을 때

- **저장소와 글 ID를 확인하세요.** 예제 값을 실제 값으로 바꿨는지, 원본 UUID를 사용했는지 확인하세요.
- **글의 수집 상태를 확인하세요.** 새로 발행한 글은 GitBlog에 수집된 뒤 추천을 조회할 수 있습니다.
- **언어를 확인하세요.** 요청한 언어의 글이 실제로 공개되어 있어야 합니다.
- **패널 위치까지 스크롤해 보세요.** 기본적으로 화면 가까이에 도달했을 때 로드됩니다.
- **관련 글이 없을 수 있습니다.** 결과가 없거나 조회에 실패하면 빈 상자 대신 패널을 숨깁니다.
- **CSP를 사용하는 사이트라면** `script-src`와 `frame-src`에 `https://gitblog.app`을 허용하세요.

## 로컬에서 미리 보기

이 저장소를 내려받은 뒤 실행하세요.

```sh
npm ci
npm run dev
```

[데모 페이지](http://127.0.0.1:4400/demo/)에서 테마, 썸네일, 표시 개수를 바꿔볼 수 있습니다. 데모는 샘플 글을 사용하므로 GitBlog에 등록된 블로그가 없어도 확인할 수 있습니다.

## 라이선스

[MIT](LICENSE)
