# GitBlog Related

ブログ記事の下に**関連記事**パネルを表示できます。
GitBlog Related は、[GitBlog](https://gitblog.app)で公開されている記事から、タグ・カテゴリ・本文が似ている記事を探し、同じ言語の記事をおすすめします。

スクリプトを1つ追加するだけで利用できます。サーバーの設置や API キーは不要です。テーマ、サムネイルの表示、おすすめ記事の件数を設定できます。おすすめ記事をクリックすると、新しいタブで元の記事が開きます。

## はじめる前に

対象のブログと現在の記事が、GitBlog に登録・収集されている必要があります。埋め込みを追加するだけでは、ブログの登録や現在のページの本文収集は行われません。

次の2つの値を用意してください。

- **リポジトリ名**：ブログの GitHub リポジトリを `owner/repository` 形式で指定します。
- **記事 ID**：記事の Markdown にある `id` フィールドの元の UUID です。RSS の `<hub:postId>` でも確認できます。記事の URL、ファイル名、GitBlog の記事詳細ページ URL に含まれる ID は使用しないでください。

たとえば、Markdown のフロントマターが次のようになっている場合は、この `id` を使います。

```yaml
---
id: 123e4567-e89b-42d3-a456-426614174000
title: はじめての記事
---
```

## HTML に追加する

パネルを表示したい位置に、次のスクリプトを追加してください。`data-repo` と `data-post-id` は、**実際のブログのリポジトリ名と現在の記事 ID** に置き換えてください。

```html
<script
  async
  src="https://gitblog.app/related/v1/client.js"
  data-repo="owner/repository"
  data-post-id="123e4567-e89b-42d3-a456-426614174000"
  data-lang="ja"
  data-theme="auto"
  data-show-thumbnail="true"
  data-limit="4"
></script>
```

パネルはスクリプトを配置した位置に表示されます。複数の記事ページで使用する場合は、それぞれの記事の ID と言語を指定してください。

### 設定オプション

| HTML 属性 | JavaScript オプション | デフォルト | 説明 |
| --- | --- | --- | --- |
| `data-repo` | `repo` | 必須 | ブログのリポジトリ名（`owner/repository`） |
| `data-post-id` | `postId` | 必須 | 現在の記事の元の UUID |
| `data-lang` | `lang` | ページの言語 | 現在読んでいる記事の言語（`ja`、`en`、`ko` など） |
| `data-theme` | `theme` | `auto` | `auto`、`light`、`dark` |
| `data-show-thumbnail` | `showThumbnail` | `true` | サムネイルを表示するかどうか |
| `data-limit` | `limit` | `4` | おすすめ記事の最大件数。1〜8 の整数 |
| `data-loading` | `loading` | `lazy` | 表示領域に近づくと読み込みます。すぐに読み込む場合は `eager` |

関連記事が少ない場合、表示件数は設定値より少なくなります。サムネイルのない記事には、代わりにブログ名と頭文字を表示します。サムネイルを無効にすると、この代替表示も非表示になります。

### 記事の言語

韓国語のブログで英語に翻訳された記事を表示する場合は、`data-lang="en"` を指定してください。ブログのデフォルト言語ではなく、**現在の記事の言語**を渡してください。

省略すると、ページの `<html lang="…">` を使用します。有効なページ言語もない場合は、GitBlog に登録されたブログのデフォルト言語を使用します。指定した言語の記事がない場合、別の言語の記事で補うことはありません。

### テーマ

`auto` は、ページの `<html>` 要素にある `dark`・`light` クラス、または `data-theme="dark"`・`data-theme="light"` に従います。どちらも設定されていない場合は、端末の配色設定に従います。

```html
<html lang="ja" class="dark">
```

テーマが変わると、おすすめ記事を再取得せずに色だけが変わります。埋め込みの外側の背景は透明、カードの背景は半透明なので、ブログの背景になじみます。

## GitBlog ブログテンプレートで使う

[Svelte GitBlog Template](https://github.com/gitblogapp/svelte-gitblog-template)にはパネルが組み込まれているため、スクリプトを別途追加する必要はありません。

GitBlog の**ブログ設定 → 関連記事パネル**で、パネルの有効・無効、サムネイルの表示、おすすめ記事の件数を設定できます。保存後、ブログのデプロイが完了すると反映されます。

手動で設定する場合は、ブログのリポジトリにある `.env.production` を編集してください。

```dotenv
PUBLIC_RELATED_ENABLED=true
PUBLIC_RELATED_SHOW_THUMBNAIL=true
PUBLIC_RELATED_LIMIT=4
```

デフォルトではパネルとサムネイルが有効で、最大4件を表示します。`PUBLIC_HUB_ENABLED=true` も必要です。既存のブログで件数設定が反映されない場合は、テンプレートを **1.0.10 以降**に更新してください。

## JavaScript で使う

React・Vue・Svelte など、ページ全体を再読み込みせずに記事を切り替えるアプリでは、`mount()` でパネルを作成し、記事が変わったときに `update()` を呼び出してください。`mount()` はブラウザー内でのみ実行してください。

次の例はビルドツールなしで使用できます。

```html
<div id="related"></div>

<script type="module">
  import { mount } from "https://gitblog.app/related/v1/index.js";

  const panel = mount(document.querySelector("#related"), {
    repo: "owner/repository",
    postId: "123e4567-e89b-42d3-a456-426614174000",
    lang: "ja",
    theme: "auto",
    showThumbnail: true,
    limit: 4,
  });

  // アプリで別の記事に移動するときに呼び出します。
  function showArticle(post) {
    panel.update({ postId: post.id, lang: post.locale });
  }

  // ページのコンポーネントを破棄するときに呼び出します。
  function cleanup() {
    panel.destroy();
  }
</script>
```

`update()` には、変更するオプションだけを渡します。

```js
panel.update({ theme: "dark" }); // 既存の iframe を維持し、色だけを変更
panel.update({ showThumbnail: false, limit: 2 });
```

読み込み状態を確認したい場合は、`mount()` のオプションに `onState` コールバックを追加してください。状態は `loading`、`ready`、`empty`、`error` のいずれかです。

```js
onState: (state) => console.log("関連記事パネルの状態:", state)
```

`lang` を省略したパネルは、`<html lang>` の変更を自動で検出します。`lang` を明示的に指定した場合は、記事の切り替え時に `postId` と `lang` を両方更新してください。同じページに複数のパネルを配置することもできます。

## パネルが表示されない場合

- **リポジトリ名と記事 ID を確認してください。** サンプル値を実際の値に置き換え、記事の元の UUID を使用してください。
- **記事が収集済みか確認してください。** 新しく公開した記事は、GitBlog に収集された後におすすめ記事を取得できます。
- **言語を確認してください。** 指定した言語の記事が公開されている必要があります。
- **パネルの位置までスクロールしてください。** デフォルトでは、表示領域に近づいたときに読み込みます。
- **関連記事がない可能性があります。** 結果がない場合や取得に失敗した場合は、空の枠を表示せず、パネルを非表示にします。
- **Content Security Policy（CSP）を使用している場合は、** `script-src` と `frame-src` で `https://gitblog.app` を許可してください。

## ローカルでプレビューする

このリポジトリをダウンロードして、次のコマンドを実行してください。

```sh
npm ci
npm run dev
```

[デモページ](http://127.0.0.1:4400/demo/)で、テーマ、サムネイル、表示件数を試せます。デモではサンプル記事を使用するため、GitBlog に登録されたブログがなくても確認できます。

## ライセンス

[MIT](LICENSE)
