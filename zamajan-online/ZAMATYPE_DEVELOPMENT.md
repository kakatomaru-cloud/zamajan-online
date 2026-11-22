# ザマタイプ 開発管理

## 最新版 v1.6.1 (2026-11-22 JST)
- 基準: 添付 ZIP `zamajan-online-main (2).zip` 内の v1.6 と GitHub blob `c844225ee0bf935c21ac558225b47802152df099` の一致を確認。
- 最新ゲームファイル: `zamajan-online/public/zamatype-v16-integrated-test.html`
- ゲーム修正コミット: `d6b7077cfb7c3cb04dd232812d7d16e1667beeaa`
- 修正後 blob: `f18a6a6040a9124f36d82fb9c23e6a6224cedb76`
- テストURL: https://rawcdn.githack.com/kakatomaru-cloud/zamajan-online/d6b7077cfb7c3cb04dd232812d7d16e1667beeaa/zamajan-online/public/zamatype-v16-integrated-test.html

## 今回の差分
- ボス HP 24/36/48/60（1〜4人）、通常攻撃3、攻撃魔法3/6/9。据え置きの魔法仕様。登場4秒間は入力・戦闘時計停止。
- 重低音と緩やかな登場、撃破時の点滅・振動・下方向への破片崩壊、崩壊後に「ボス撃破！！」、その後結果表示。
- 既存画像、配置、職業、魔法段階、3分制限、その他のゲーム仕様は変更しない。

## 検証
- JavaScript 構文チェック合格。1〜4人のエンジンで登場時のダメージ無効、最上位魔法9ダメージで即死しないこと、通常攻撃3ダメージを確認。
- ブラウザでの視覚・音声・実プレイは未検証。

## 開発ルール
最新 main と本ファイルを確認し、過去への巻き戻し・推測復元は禁止。変更は指定箇所のみ。大容量 HTML の取得が空なら blob SHA から取得する。変更前後の差分を確認し、管理ファイルとコミット固定テストURLを更新する。最新確認不能なら上書きしない。

## チャットをまたぐ開発引き継ぎ（2026-11-22）
- `zamajan-online-main (3).zip` のゲーム本体と管理ファイルが GitHub main の blob と完全一致することを確認済み。今後は GitHub main を正本とし、毎回の ZIP 再添付を前提としない。
- 新規チャットではまず `zamajan-online/ZAMATYPE_DEVELOPMENT.md` を取得し、記載の最新ゲームファイルと main の blob を確認する。大容量ファイルは blob API 等で取得し、空の応答をソースとして扱わない。
- 修正ごとにゲームとこの管理ファイルを更新し、変更内容・検証結果・コミット固定テストURLを記録する。取得不能の場合は上書き禁止。
- 次回の未実装要望：火・雷・雪/氷・回復の各3段階で異なる視覚演出と効果音、ボスの大型化、攻撃・被弾モーション強化。既存仕様は維持。

## 公開テスト版の必須ルール
- 修正後は必ず GitHub に反映し、コミット固定のブラウザで直接プレイできる最新テスト版 URL を提示する。HTML 添付のみを完了扱いしない。公開反映できない場合は未完了と明記し、旧版 URL を修正版として提示しない。

## 最新公開版 v1.7.1 (2026-11-22 JST)
- 最新ゲームファイル: `zamajan-online/public/zamatype-v16-integrated-test.html`
- ゲーム修正コミット: `5dfb48cc02d215bcb02df7aef9a53580c6911277`
- main blob: `0154aa21fe34295b22f25a401add2ecef1bc5e36`（反映後確認済み）
- テストURL: https://rawcdn.githack.com/kakatomaru-cloud/zamajan-online/5dfb48cc02d215bcb02df7aef9a53580c6911277/zamajan-online/public/zamatype-v16-integrated-test.html
- v1.7.1 修正版HTMLを公開。火・雷・氷・回復の3段階透過エフェクトと合成音、ボスサイズ・崩壊演出、長文ランダム出題を変更。全3スクリプトの Node 構文検査合格。ブラウザ実プレイ・CDN配信は未検証。
- この節が以前の最新版記載に優先する。今後の修正はこの main blob を基準にする。

## 最大4人対戦とミニゲーム一覧
- 入口は `public/online.html` の「ザマタイプ」。「対戦相手を募集する」で募集を公開し、参加者は一覧から選ぶ。2〜4人で募集主が開始する。満員・開始済みの募集は一覧から外れる。
- 敵・HP・制限時間はサーバー側で共有し、個人スコアで順位を決める。同点1位を表示する。
- `server.js` と `zamatype-rooms.js` を含めザマじゃんサーバーを起動すると、同じサイトの `/minigames/zamatype/` で遊べる。
- ブラウザの表示・素材は通常戦BGMとmana8、魔法演出、敵画像の切り出し修正を含む。

## BGM音量と魔王の部位破壊
- BGMは初期値15%。タイトルと戦闘画面で0〜100%に調節でき、ブラウザに保存される。
- 魔王を頭、胴体、左右の腕、左右の脚に分割。頭のワードが最長で、6部位すべての耐久値を0にすると撃破。
- 検証では1〜4人分の耐久値、ローマ字・日本語入力、魔法、全破壊の勝利条件を確認。ブラウザでも部位の表示と右脚の破壊を確認。

## 雑魚戦の出題ジャンルとボスの魔法耐性
- 雑魚戦は指定の8ジャンルを混ぜ、短い単語から長めのフレーズまでを出題。直近のお題の再出題と、同時に出ているお題の入力衝突を避ける。
- ニュースは2026年11月22日分の確認済み記事をもとに作成した固定問題。自動更新は行わない。
- ボスのお題を短縮し、頭を最長に設定。魔法は部位ごとに1〜2ダメージ、HP1まで。破壊には正しい入力が必要。

## 最新テスト版　アビスロード戦のカメラとモーション（2026-11-22 JST）
- 開発対象: `zamajan-online/public/minigames/zamatype/battle.html`。GitHub main の `f98cb18f46533315a7c2f980fc7e9ca8e9021737` を確認し、前回までの更新用ZIPに収録した音量・出題・6部位の仕様と今回の演出を反映。
- ゲーム修正コミット: `bcc0a87645ed749647bf7ce3dcb2c5127c727bfd`
- コミット固定のボス戦直行テスト: https://rawcdn.githack.com/kakatomaru-cloud/zamajan-online/bcc0a87645ed749647bf7ce3dcb2c5127c727bfd/zamajan-online/public/minigames/zamatype/battle.html?boss=1
- ブラウザテスト版: https://zamatype-opening-sample.affectionategrebe8.chatgpt.site/battle.html?boss=1
- ボス戦で大聖堂の低い視点に切り替わる。遠方からの登場、待機中の揺れ、攻撃時の踏み込み、被弾時ののけぞり、部位の崩れを実装。既存のボス画像に背景と遠近の動きを重ねる2.5D演出。
- ブラウザでボスの表示、右脚の破壊、ブリザラ発動を確認。1〜4人のエンジンで登場中のダメージ無効、全体魔法、タイピングによる全6部位破壊と勝利を確認。4人で同時に接続する実プレイは未検証。

## 最新テスト版　中ボス・伝説の武器・魔法音（2026-11-22 JST）

- ゲーム修正コミット `fbecb1f9d0ece5227d6da5bb4edd87fcf9c26f8d`
- [中ボス直行](https://rawcdn.githack.com/kakatomaru-cloud/zamajan-online/fbecb1f9d0ece5227d6da5bb4edd87fcf9c26f8d/zamajan-online/public/minigames/zamatype/battle.html?midboss=1) · [通常スタート](https://rawcdn.githack.com/kakatomaru-cloud/zamajan-online/fbecb1f9d0ece5227d6da5bb4edd87fcf9c26f8d/zamajan-online/public/minigames/zamatype/battle.html) · [ラスボス直行](https://rawcdn.githack.com/kakatomaru-cloud/zamajan-online/fbecb1f9d0ece5227d6da5bb4edd87fcf9c26f8d/zamajan-online/public/minigames/zamatype/battle.html?boss=1)
- 10体撃破で黒炎竜・ベヒーモス・アーリマンの1体が出現。大聖堂の低い視点を使い、単一のHPゲージと長めの3問を表示。正解ごとに12ダメージを与え、直前とは異なる3問に総入れ替え。HP0で消滅し、通常戦に復帰する。
- 中ボス戦では提供された「中ボス.mp3」がループし、撃破演出後は通常BGMを中断位置から再開する。雑魚の撃破数が20体になるとラスボスが登場する。
- 撃破報酬は参加者ごとにラグナロク・エクスカリバー・政宗・与一の弓から1つ。表示名の入力で一度だけ発動し、通常敵1体に34ダメージを与える。ラスボスは部位のHPを1まで削り、トドメはタイピングで行う。
- 炎・落雷・氷の亀裂・回復の効果音を同梱。クレジットとライセンスは `public/minigames/zamatype/sfx/credits.html` に記載。
- ブラウザで中ボスの3問の入れ替え、魔法入力、中ボスBGMへの切り替えと通常BGMの再開、ラグナロクの発動と消費を確認。共通エンジンでは1〜4人で10体撃破からラスボス勝利まで検証。4人同時接続は未検証。

## 最新テスト版　神官から魔王への変身と部位の骨化（2026-11-22 JST）

- ゲーム修正コミット `85ddee8754b58cf26a717968d3b26fe2216b7dda`
- [通常スタート](https://rawcdn.githack.com/kakatomaru-cloud/zamajan-online/85ddee8754b58cf26a717968d3b26fe2216b7dda/zamajan-online/public/minigames/zamatype/battle.html) · [中ボス直行](https://rawcdn.githack.com/kakatomaru-cloud/zamajan-online/85ddee8754b58cf26a717968d3b26fe2216b7dda/zamajan-online/public/minigames/zamatype/battle.html?midboss=1) · [神官から開始](https://rawcdn.githack.com/kakatomaru-cloud/zamajan-online/85ddee8754b58cf26a717968d3b26fe2216b7dda/zamajan-online/public/minigames/zamatype/battle.html?priest=1) · [変身後の魔王から開始](https://rawcdn.githack.com/kakatomaru-cloud/zamajan-online/85ddee8754b58cf26a717968d3b26fe2216b7dda/zamajan-online/public/minigames/zamatype/battle.html?boss=1)
- 中ボスのお題を大きい縦3段に変更。日常、自然、スポーツなど6テーマの文を混ぜ、入力成功時に直前とは違う3問へ入れ替える。
- 雑魚20体撃破で長髪の神官が登場。8つのお題のうち5つは神官への攻撃、2つは味方全体が被弾する敵魔法、1つは神官を回復する敵魔法。神官のHPがゼロになると魔王へ変身する。
- 魔王が攻撃で動かした部位だけが弱点となり、画面下部に専用のお題1つを表示する。攻撃魔法と伝説の武器も弱点が出ている間に使用でき、部位のトドメはタイピングで行う。破壊された部位は骨に変わり、6部位の破壊後は全身の骨が崩れて消える。
- ブラウザで中ボスの縦3段、神官の攻撃・回復・被弾、変身と右腕の骨化を確認。共通エンジンでは1〜4人の設定で中ボスから全6部位の破壊と勝利まで確認。実際の4人同時接続は未検証。
