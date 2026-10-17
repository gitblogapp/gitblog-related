# GitBlog Related

**English** | [한국어](docs/readme/README.ko.md) | [日本語](docs/readme/README.ja.md) | [简体中文](docs/readme/README.zh-CN.md)

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

## Preview locally

Download this repository, then run:

```sh
npm ci
npm run dev
```

Open the [demo page](http://127.0.0.1:4400/demo/) to try themes, thumbnails, and recommendation counts. The demo uses sample posts, so you do not need a blog registered on GitBlog to preview it.

## License

[MIT](LICENSE)
