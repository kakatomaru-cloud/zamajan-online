ザマじゃん アップロード用一式 2026-10-16

GitHub リポジトリ kakatomaru-cloud/zamajan-online に既存の zamajan-online フォルダーを上書きして Push します。

オンライン版：
  zamajan-online/server.js, package.json, public/online.html
  public/assets/tables/（5背景）
  public/zamajan-bgm.mp3・動画・画像など同梱
  public/zamajan.html は【最新版ローカル版】に更新済みです。

【重要な区別】
  最新ローカル版の新アイテム20種類、壁紙を選ぶ設定、継続効果表示は
  public/zamajan.html に実装しています。
  public/online.html / server.js は2026-10-16に作成済みのオンライン版で、
  GitHub設定JSON書き出しと5種類の卓背景ランダム切り替えまで含みます。
  ただし「新アイテム20種」と「継続効果表示」をオンライン対戦へ移植したわけではありません。
  混同を避けるため、オンラインで未実装の機能を実装済みとは表示しません。

最初は解凍したフォルダーを GitHub Desktop のリポジトリに上書きコピーし、Commit / Push してください。
Render サービスの Root Directory は zamajan-online に設定済みの場合、既存のままで構いません。
