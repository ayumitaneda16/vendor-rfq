# Vendor RFQ ツール — Vercel デプロイ手順

翻訳（Gemini）・cm/inch換算・RFQビルダーを、PC/iPhone共通の1つのURLで使える形にします。
APIキーはサーバー側（Vercelの環境変数）に隠すので、開いた人に漏れません。

---

## 中身（このフォルダ）

```
vendor-rfq/
├─ index.html            ← 画面。翻訳は /api/translate を呼ぶ
├─ api/translate.js      ← サーバー関数。Geminiを呼ぶ（キーは環境変数）
├─ manifest.webmanifest  ← ホーム画面追加用
├─ icon-180.png / icon-512.png ← アプリアイコン
└─ vercel.json           ← 関数設定
```

---

## ステップ1：Gemini APIキーを取る（無料枠あり）

1. https://aistudio.google.com/apikey を開く（Googleアカウントでログイン）
2. 「Create API key」→ キーをコピー（`AIza...` の文字列）
3. どこかに一時保存。※このキーは絶対にHTMLやGitHubに直書きしないこと。

---

## ステップ2：Vercelにデプロイ

一番かんたんなのは **Vercel CLI でこのフォルダをそのまま上げる方法**です。

### 方法A：CLI（推奨・GitHub不要）

```bash
# 1. Vercel CLI を入れる（初回のみ）
npm i -g vercel

# 2. このフォルダに移動
cd vendor-rfq

# 3. デプロイ（初回はログイン→質問はEnterで進めてOK）
vercel

# 4. 本番URLを発行
vercel --prod
```

最後に表示される `https://xxxx.vercel.app` が本番URLです。

### 方法B：GitHub連携（Web画面だけで完結）

1. このフォルダをGitHubリポジトリにpush
2. https://vercel.com → 「Add New → Project」→ そのリポジトリをImport
3. 設定はデフォルトのまま「Deploy」

---

## ステップ3：APIキーを環境変数に登録（重要）

Vercel の画面で：

1. Project → **Settings** → **Environment Variables**
2. 追加：
   - **Name**: `GEMINI_API_KEY`
   - **Value**: ステップ1でコピーしたキー
   - Environment: **Production**（＋ Preview もチェック推奨）
3. 保存
4. **Deployments → 最新のデプロイ → ⋯ → Redeploy**（環境変数は再デプロイで反映）

> モデルを変えたい場合は、同じ画面で `GEMINI_MODEL`（例：`gemini-2.0-flash`）を追加。未設定なら `gemini-2.0-flash` が使われます。

---

## ステップ4：動作確認

- 発行されたURLをPCとiPhoneのブラウザで開く
- **翻訳**：日本語を入力 →「English に翻訳」→ 結果が出ればOK（⌘/Ctrl+Enterでも実行）
- **換算**：cm/inch 双方向
- **RFQ**：項目を埋めてコピー

---

## ステップ5：ワンタップで開けるようにする

### iPhone（Safari）
1. URLを開く → 共有ボタン（□↑）→「**ホーム画面に追加**」
2. RFQアイコンがホームに追加され、アプリのように全画面で開きます

### PC（Chrome / Edge）
- アドレスバー右の「インストール」アイコン、または メニュー →「アプリをインストール」
- もしくは普通にブックマーク／ブックマークバーへ

---

## 費用の目安
- Vercel：このレベルの利用は無料枠で十分
- Gemini：無料枠あり。翻訳1回あたりごくわずか（実質ほぼ無料の想定）

## セキュリティ
- APIキーはブラウザに一切送られません（サーバー関数の中だけで使用）
- キーが漏れた/心配なときは、Google AI Studio でキーを削除→再発行し、Vercelの環境変数を更新して再デプロイ

## うまくいかないとき
- 翻訳だけ失敗 → 環境変数 `GEMINI_API_KEY` の綴り・値、そして **Redeploy** したか確認
- 500「APIキーが設定されていません」→ 環境変数未反映。登録後に再デプロイ
- iPhoneでコピーできない → 画面は選択コピーにフォールバックします。うまくいかなければ結果を長押し選択でコピー
