# GitBlog Related

在博客文章下方添加**相关文章**面板。
GitBlog Related 会从 [GitBlog](https://gitblog.app) 上的公开文章中，查找标签、分类和正文相似的文章，并推荐相同语言的内容。

只需添加一个脚本即可使用，无需部署服务器或申请 API 密钥。你可以设置主题、显示或隐藏缩略图，以及调整推荐数量。点击推荐文章后，会在新标签页中打开原文。

## 开始之前

你的博客和当前文章必须已在 GitBlog 中注册并被收录。添加嵌入脚本不会自动注册博客，也不会采集当前页面的正文。

请准备以下两个值：

- **仓库名称**：博客的 GitHub 仓库，格式为 `owner/repository`。
- **文章 ID**：文章 Markdown 文件中 `id` 字段的原始 UUID，也可以在 RSS 的 `<hub:postId>` 字段中找到。请勿使用文章网址、文件名或 GitBlog 文章详情页网址中的 ID。

例如，如果 Markdown 的 frontmatter 如下，请使用其中的 `id` 值：

```yaml
---
id: 123e4567-e89b-42d3-a456-426614174000
title: 我的第一篇文章
---
```

## 添加到 HTML

将以下脚本放在希望显示面板的位置。请将 `data-repo` 和 `data-post-id` 替换为**你的实际仓库名称和当前文章 ID**。

```html
<script
  async
  src="https://gitblog.app/related/v1/client.js"
  data-repo="owner/repository"
  data-post-id="123e4567-e89b-42d3-a456-426614174000"
  data-lang="zh-CN"
  data-theme="auto"
  data-show-thumbnail="true"
  data-limit="4"
></script>
```

面板会显示在脚本所在的位置。在多个文章页面中使用时，请为每个页面传入对应文章的 ID 和语言。

### 配置选项

| HTML 属性 | JavaScript 选项 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `data-repo` | `repo` | 必填 | 博客仓库名称（`owner/repository`） |
| `data-post-id` | `postId` | 必填 | 当前文章的原始 UUID |
| `data-lang` | `lang` | 页面语言 | 当前阅读的文章语言（`zh-CN`、`en`、`ja` 等） |
| `data-theme` | `theme` | `auto` | `auto`、`light` 或 `dark` |
| `data-show-thumbnail` | `showThumbnail` | `true` | 是否显示缩略图 |
| `data-limit` | `limit` | `4` | 最大推荐数量，取值为 1～8 的整数 |
| `data-loading` | `loading` | `lazy` | 接近可视区域时加载。设为 `eager` 可立即加载 |

如果匹配的文章不足，实际显示数量可能少于设置值。没有缩略图的文章会显示博客名称和首字作为替代。关闭缩略图后，该替代区域也会隐藏。

### 文章语言

如果读者正在韩语博客中阅读英文译文，请设置 `data-lang="en"`。应传入**当前文章的语言**，而不是博客的默认语言。

省略此选项时，面板会使用页面的 `<html lang="…">`。如果页面也没有有效的语言设置，则使用博客在 GitBlog 中注册的默认语言。如果没有指定语言的匹配文章，不会改用其他语言的文章。

### 主题

`auto` 会跟随页面 `<html>` 元素上的 `dark` 或 `light` 类名，或 `data-theme="dark"`、`data-theme="light"` 属性。如果都未设置，则跟随设备的配色偏好。

```html
<html lang="zh-CN" class="dark">
```

切换主题时只更新颜色，不会重新加载推荐文章。嵌入面板的外层背景透明，卡片背景半透明，可以自然融入博客背景。

## 在 GitBlog 博客模板中使用

[Svelte GitBlog Template](https://github.com/gitblogapp/svelte-gitblog-template) 已内置推荐面板，无需额外添加脚本。

在 GitBlog 的**博客设置 → 相关文章面板**中，可以启用或关闭面板、切换缩略图显示，以及选择推荐数量。保存后，设置会在博客部署完成时生效。

如需手动配置，请修改博客仓库中 `.env.production` 的以下值：

```dotenv
PUBLIC_RELATED_ENABLED=true
PUBLIC_RELATED_SHOW_THUMBNAIL=true
PUBLIC_RELATED_LIMIT=4
```

默认启用面板和缩略图，最多显示 4 篇推荐文章。同时需要设置 `PUBLIC_HUB_ENABLED=true`。如果现有博客的推荐数量设置未生效，请将模板更新到 **1.0.10 或更高版本**。

## 通过 JavaScript 使用

对于无需重新加载整个页面即可切换文章的网站，包括 React、Vue 和 Svelte 应用，请使用 `mount()` 创建面板，并在文章变化时调用 `update()`。`mount()` 只能在浏览器中执行。

以下示例无需构建工具即可使用：

```html
<div id="related"></div>

<script type="module">
  import { mount } from "https://gitblog.app/related/v1/index.js";

  const panel = mount(document.querySelector("#related"), {
    repo: "owner/repository",
    postId: "123e4567-e89b-42d3-a456-426614174000",
    lang: "zh-CN",
    theme: "auto",
    showThumbnail: true,
    limit: 4,
  });

  // 应用切换到另一篇文章时调用。
  function showArticle(post) {
    panel.update({ postId: post.id, lang: post.locale });
  }

  // 页面组件卸载时调用。
  function cleanup() {
    panel.destroy();
  }
</script>
```

只需向 `update()` 传入需要修改的选项：

```js
panel.update({ theme: "dark" }); // 保留现有 iframe，仅更新颜色
panel.update({ showThumbnail: false, limit: 2 });
```

如需跟踪加载状态，请在 `mount()` 的选项中添加 `onState` 回调。状态值包括 `loading`、`ready`、`empty` 和 `error`。

```js
onState: (state) => console.log("相关文章面板状态:", state)
```

省略 `lang` 时，面板会自动检测 `<html lang>` 的变化。如果显式指定了 `lang`，请在切换文章时同时更新 `postId` 和 `lang`。同一页面也可以创建多个面板。

## 面板未显示时

- **检查仓库名称和文章 ID。** 确认已将示例值替换为实际值，并使用文章的原始 UUID。
- **检查文章是否已被收录。** 新发布的文章需要先被 GitBlog 收录，才能请求推荐。
- **检查语言。** 文章必须已以请求的语言公开发布。
- **滚动到面板附近。** 默认情况下，面板会在接近可视区域时加载。
- **可能没有相关文章。** 没有结果或请求失败时，面板会隐藏，不会显示空框。
- **如果网站使用内容安全策略（CSP），** 请在 `script-src` 和 `frame-src` 中允许 `https://gitblog.app`。

## 本地预览

下载此仓库后，运行：

```sh
npm ci
npm run dev
```

打开[演示页面](http://127.0.0.1:4400/demo/)，即可尝试切换主题、缩略图和推荐数量。演示使用示例文章，因此无需在 GitBlog 中注册博客也能预览。

## 许可证

[MIT](LICENSE)
