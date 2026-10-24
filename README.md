# GitBlog Related

**English** | [Korean](docs/readme/README.ko.md) | [Japanese](docs/readme/README.ja.md) | [Simplified Chinese](docs/readme/README.zh-CN.md)

This English README is the primary reference for the current integration and service architecture. Translated guides are retained and may lag behind new operational details.

Add a **related posts** panel below your blog posts.
GitBlog Related finds public posts on [GitBlog](https://gitblog.app) with similar tags, categories, and content, and recommends posts in the same language.

Get started with a single script. No server setup or API key is required. You can choose the theme, show or hide thumbnails, and set the number of recommendations. Clicking a recommendation opens the original post in a new tab.

## Before you start

Your blog and the current post must already be registered and indexed on GitBlog. Adding the embed does not register your blog or collect the current page's content.

You will need two values:

- **Repository name**: Your blog's GitHub repository in `owner/repository` format.
- **Post ID**: The original UUID in your post's Markdown `id` field. You can also find it in the RSS `<hub:postId>` field. Do not use the post URL, filename, or the ID in a GitBlog post page URL.

For example, use the `id` value from this Markdown frontmatter:

```yaml
---
id: 123e4567-e89b-42d3-a456-426614174000
title: My first post
---
```

## Add to HTML

Place this script where you want the panel to appear. Replace `data-repo` and `data-post-id` with **your actual repository and current post ID**.

```html
<script
  async
  src="https://gitblog.app/related/v1/client.js"
  data-repo="owner/repository"
  data-post-id="123e4567-e89b-42d3-a456-426614174000"
  data-lang="en"
  data-theme="auto"
  data-show-thumbnail="true"
  data-limit="4"
></script>
```

The panel appears at the script's location. When adding it to multiple post pages, provide each post's own ID and language.

### Options

| HTML attribute | JavaScript option | Default | Description |
| --- | --- | --- | --- |
| `data-repo` | `repo` | Required | Blog repository (`owner/repository`) |
| `data-post-id` | `postId` | Required | Original UUID of the current post |
| `data-lang` | `lang` | Page language | Language of the post being read (`en`, `ko`, `ja`, etc.) |
| `data-theme` | `theme` | `auto` | `auto`, `light`, or `dark` |
| `data-show-thumbnail` | `showThumbnail` | `true` | Whether to show thumbnails |
| `data-limit` | `limit` | `4` | Maximum recommendations, an integer from 1 to 8 |
| `data-loading` | `loading` | `lazy` | Load near the viewport. Use `eager` to load immediately |

The panel may show fewer posts if there are not enough matches. Posts without a thumbnail show the blog name and an initial instead. Turning off thumbnails also hides this fallback area.

### Post language

If a reader is viewing an English translation on a Korean blog, set `data-lang="en"`. Pass the **language of the current post**, rather than the blog's default language.

If omitted, the panel uses the page's `<html lang="…">`. If there is no valid page language either, it uses the blog's default language registered on GitBlog. It does not fall back to posts in another language when no matches are available.

### Theme

`auto` follows the `dark` or `light` class, or `data-theme="dark"` or `data-theme="light"`, on the page's `<html>` element. If neither is set, it follows the device's color preference.

```html
<html lang="en" class="dark">
```

Theme changes update colors without reloading recommendations. The embed has a transparent outer background and translucent cards to blend with your blog's background.

## Use with the GitBlog blog template

The panel is built into [Svelte GitBlog Template](https://github.com/gitblogapp/svelte-gitblog-template), so you do not need to add a script separately.

In GitBlog, open **Blog settings → Related posts panel** to enable or disable the panel, toggle thumbnails, and choose the number of recommendations. Changes take effect after you save and your blog finishes deploying.

To configure it manually, edit these values in your blog repository's `.env.production`:

```dotenv
PUBLIC_RELATED_ENABLED=true
PUBLIC_RELATED_SHOW_THUMBNAIL=true
PUBLIC_RELATED_LIMIT=4
```

By default, the panel and thumbnails are enabled, with up to four recommendations. `PUBLIC_HUB_ENABLED=true` is also required. If the recommendation count setting does not work on an existing blog, update the template to **1.0.10 or later**.

## Use with JavaScript

For sites that switch posts without a full page reload, including React, Vue, and Svelte apps, create the panel with `mount()` and call `update()` when the post changes. Run `mount()` only in the browser.

This example works without a build tool:

```html
<div id="related"></div>

<script type="module">
  import { mount } from "https://gitblog.app/related/v1/index.js";

  const panel = mount(document.querySelector("#related"), {
    repo: "owner/repository",
    postId: "123e4567-e89b-42d3-a456-426614174000",
    lang: "en",
    theme: "auto",
    showThumbnail: true,
    limit: 4,
  });

  // Call when your app navigates to another post.
  function showArticle(post) {
    panel.update({ postId: post.id, lang: post.locale });
  }

  // Call when the page component unmounts.
  function cleanup() {
    panel.destroy();
  }
</script>
```

Pass only the options you want to change to `update()`:

```js
panel.update({ theme: "dark" }); // Keep the existing iframe and update colors only
panel.update({ showThumbnail: false, limit: 2 });
```

To track loading status, add an `onState` callback to the `mount()` options. The possible states are `loading`, `ready`, `empty`, and `error`.

```js
onState: (state) => console.log("Related panel state:", state)
```

When `lang` is omitted, the panel automatically detects changes to `<html lang>`. If you set `lang` explicitly, update both `postId` and `lang` when switching posts. You can also mount multiple panels on the same page.

## If the panel does not appear

- **Check the repository and post ID.** Replace the example values with your own and use the post's original UUID.
- **Check that the post has been indexed.** Newly published posts must be indexed by GitBlog before recommendations can be requested.
- **Check the language.** The post must be publicly available in the requested language.
- **Scroll toward the panel.** By default, it loads when it gets near the viewport.
- **There may be no related posts.** The panel stays hidden when there are no results or a request fails, instead of showing an empty box.
- **If your site uses a Content Security Policy (CSP),** allow `https://gitblog.app` in `script-src` and `frame-src`.

## Architecture

This repository owns the browser embed and its deployable static assets. The recommendation index and ranking API belong to the main GitBlog application. Deploying the assets alone does not create a recommendation backend.

```text
Blog page
  |-- /related/v1/client.js (auto-mount script)
  |   or /related/v1/index.js (ES module SDK)
  v
Isolated /related/v1/embed.html iframe
  |-- /v1/related?repo=...&postId=...&locale=...&limit=...
  |      `-- main GitBlog API --> indexed public recommendation data
  `-- validated resize/state messages --> parent page

Public requests to /related/v1/*
  `-- main GitBlog Worker --> RELATED Service Binding
                               `-- gitblog-related static asset Worker
```

| Component | Responsibilities |
| --- | --- |
| This repository | Auto-mount script, JavaScript SDK, iframe UI, themes, response validation, and deployable assets. |
| Main GitBlog app | Blog/post indexing, recommendation selection, public `/v1/related` API, and asset routing through the Service Binding. |
| Blog template | Current repository/post identity, language, placement, and optional appearance settings. |

The iframe requests recommendations without credentials and does not require a reader login or API key. The panel uses the public API response; it does not fetch member-only article bodies or grant membership access. There are no database bindings or application secrets in this asset Worker.

### Iframe protocol and lifecycle

The SDK owns iframe creation, lazy loading, resizing, and cleanup. Parent and iframe messages use a `gitblogRelated` envelope containing protocol `version: 1` and a unique `instance` identifier. Both sides validate the message origin, source window, and instance before applying updates.

- Parent → iframe: resolved `light` or `dark` theme.
- Iframe → parent: `ready`, `empty`, or `error` state and content height.
- The SDK emits `loading` before fetching and forwards state changes through `onState`.
- Theme-only updates keep the iframe. Content changes, such as a different post or recommendation limit, rebuild it.
- `destroy()` removes the iframe and the SDK's observers, timers, and listeners.

Use `mount()` instead of constructing iframe URLs or implementing this protocol yourself. Text is rendered through DOM text nodes, recommendation links must be HTTPS, and external links open with `noopener noreferrer`.

### Custom asset hosts

The JavaScript SDK accepts an optional `baseUrl`, the directory containing `embed.html`. It must use HTTPS, except for local HTTP development. This is an asset-host setting, not an API URL override: the iframe requests `/v1/related` from **its own origin**. A custom host therefore also needs a compatible API at that origin.

## Development

Use Node.js 24, matching CI, and npm. To run the checks:

```sh
npm ci
npm run check
npm test
npm run build
```

| Command | Purpose |
| --- | --- |
| `npm run check` | Type checking. |
| `npm test` | SDK, rendering, and deployment preparation regression tests. |
| `npm run build` | Build the auto-mount script, ES module SDK, hashed iframe assets, demo, and type declarations. |
| `npm run dev` | Build and serve the local demo. |
| `npm run prepare:deploy` | Prepare `.deploy` while preserving previously deployed hashed assets. Requires access to the current hosted release. |
| `npm run deploy` | Build, prepare assets, and deploy using Wrangler. |
| `npm run export:gitblog` | Legacy local export into `../gitblog/static/related/v1`; writes to that sibling checkout. Not needed for the standalone Worker deployment. |

Source layout:

```text
src/client.ts               Script-tag auto-mount adapter
src/index.ts                mount/update/destroy SDK and iframe lifecycle
src/protocol.ts             Options and API response validation
src/embed.ts                Recommendation requests and card rendering
src/cover.ts                Thumbnail handling
src/embed.css, tokens.css   Panel styles
scripts/build.mjs           Bundling and demo output
scripts/prepare-deploy.mjs  Asset preservation and release manifest
scripts/verify-deploy.mjs   Production asset verification
```

### Preview locally

Download this repository, then run:

```sh
npm ci
npm run dev
```

Open the [demo page](http://127.0.0.1:4400/demo/) to try themes, thumbnails, and recommendation counts. The demo uses sample posts, so you do not need a blog registered on GitBlog to preview it.

To exercise the live API instead of fixtures, run `RELATED_API_ORIGIN=https://gitblog.app npm run dev` and use an indexed repository/post in the demo. The local server proxies `/v1/related` to that origin. `PORT` can override the default port 4400.

## Deployment and operations

Blog authors using the hosted embed do not need a Cloudflare account or their own deployment. The following is for GitBlog service maintainers.

The `gitblog-related` Worker serves assets only. Its `workers.dev` endpoint, preview URLs, and public routes are disabled. The main GitBlog Worker needs this entry in its `services` configuration:

```json
{ "binding": "RELATED", "service": "gitblog-related" }
```

Route `/related/v1/*` through that binding and keep `/v1/related` in the main application. For initial integration, deploy the asset Worker before enabling that route. Later UI releases can deploy independently while preserving the v1 API and message contracts.

### Release workflow

The checked-in GitHub Actions workflow:

1. Runs type checks, tests, and the build.
2. On a push to the original repository's `main` branch, uploads the built assets and enters the `production` deployment environment.
3. Confirms the commit is still the latest `main`, prepares the release, and deploys through Wrangler.
4. Verifies that production assets match the release and expose the expected transport headers.

Deployment requires the repository's `CLOUDFLARE_API_TOKEN` secret and `CLOUDFLARE_ACCOUNT_ID` variable. Never place the API token in browser code or Git. Pull requests and forks do not run the production deployment job.

`prepare:deploy` reads the existing hosted release, verifies retained asset digests, and preserves older content-addressed JS/CSS so already-open panels continue to load. It is designed for the current GitBlog deployment; bootstrapping a new host requires adapting that host configuration and providing an initial release. Do not remove old hashed assets during a routine update.

The release manifest is served at `/related/v1/release.json`. Production responses identify this deployment with `X-GitBlog-Related: standalone` and `X-GitBlog-Related-Transport: service-binding`. For manual release verification, run `node scripts/verify-deploy.mjs` after preparing and deploying the same local assets.

A bad UI release can be reverted by deploying the previous source through the normal preparation workflow, which retains the assets needed by open panels. Asset deployments do not modify the recommendation database.

## License

[MIT](LICENSE)
