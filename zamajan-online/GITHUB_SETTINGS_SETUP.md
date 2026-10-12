# ザマじゃん ONLINE：GitHub共通設定の管理

## Render の Environment に設定する項目

| キー | 値 | 必須 |
|---|---|---|
| `GITHUB_TOKEN` | GitHub Fine-grained personal access token | はい |
| `ZAMAJAN_ADMIN_PASSWORD` | 任意の強い管理者パスワード | はい |
| `GITHUB_OWNER` | `kakatomaru-cloud` | 省略可 |
| `GITHUB_REPO` | `zamajan-online` | 省略可 |
| `GITHUB_BRANCH` | `main` | 省略可 |
| `GITHUB_CONFIG_PATH` | `zamajan-online/game-config.json` | 省略可 |

GitHubトークンは **Repository access: Only select repositories** で `zamajan-online` を選び、**Repository permissions: Contents = Read and write** を付与してください。パスワードとトークンをGitHubやチャットへ貼り付けないでください。

## 使い方

1. Renderに環境変数を設定してデプロイします。
2. オンライン版タイトル画面で設定JSONを読み込みます（最初の1回のみ）。
3. 「GitHub共通設定（管理者専用）」に管理者パスワードを入力し、「GitHubに共通設定を保存」を押します。
4. `zamajan-online/game-config.json` がGitHub上に作成または上書きされます。
5. 以後、新しく作った部屋では、サーバーが読み込んだGitHub共通設定を優先します。参加者はJSONを読み込む必要がありません。

GitHubの更新でRenderが自動デプロイされると対戦中の部屋が切断される可能性があります。対戦がない時間帯に保存してください。

## 注意

- すでに開始した部屋の設定は途中で変更されません。
- 保存失敗時はエラーメッセージを確認してください。GitHubの権限・トークン有効期限・Render環境変数を点検してください。
- GitHubファイルを手動更新した場合、Render再デプロイ後にサーバーへ反映されます。
- GitHubの `game-config.json` は画像データを含みます。公開リポジトリの場合、牌画像も公開されます。
- トークンをブラウザに保存・送信しません。管理者パスワードは保存操作時のみHTTPSでRenderサーバーへ送信します。
- Renderの環境変数を設定するまでは保存できません。`game-config.json` は初回保存時に自動作成されます。
