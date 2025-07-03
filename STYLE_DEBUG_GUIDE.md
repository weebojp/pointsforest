# スタイル問題デバッグガイド

## 現在の状況確認
開発サーバーは動作中で、CSSファイルも正常に配信されています。

## デバッグ手順

### 1. ブラウザでの確認
1. http://localhost:3000 または http://localhost:3001 にアクセス
2. F12でDevToolsを開く
3. Networkタブで以下を確認：
   - CSS ファイルが正常に読み込まれているか
   - ステータスが200 OKか
   - ファイルサイズが0バイトでないか

### 2. コンソールエラー確認
1. Consoleタブでエラーメッセージを確認
2. 特に以下のようなエラーがないか：
   - MIME type エラー
   - CSS parsing エラー
   - 404 Not Found

### 3. Elements タブでスタイル確認
1. HTML要素を右クリック → "検証"
2. Stylesパネルで適用されているCSSを確認
3. Tailwind クラスが正しく適用されているか

### 4. 一般的な原因と解決法

#### Case 1: Tailwind CSS が正しく読み込まれていない
```bash
# 開発サーバーを再起動
npm run dev
```

#### Case 2: ブラウザキャッシュの問題
```
Ctrl+Shift+R (Windows/Linux) または Cmd+Shift+R (Mac)
でハードリフレッシュ
```

#### Case 3: CSS変数が読み込まれていない
```css
/* globals.css の CSS変数が正しく読み込まれているか確認 */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}
```

#### Case 4: Next.js App Routerの設定問題
`src/app/layout.tsx` でCSSが正しくインポートされているか：
```typescript
import './globals.css'
```

## 即座に試せる解決法

### 1. 開発サーバー再起動
```bash
# 現在のプロセス停止
Ctrl+C

# サーバー再起動
npm run dev
```

### 2. node_modules と .next キャッシュクリア
```bash
rm -rf node_modules .next
npm install
npm run dev
```

### 3. ブラウザのキャッシュクリア
- Chrome: F12 → Network タブ → "Disable cache" チェック
- または、シークレットモードで確認

## 特定ページの確認手順

1. **ホームページ**: http://localhost:3000/
   - 緑のグラデーション背景が表示されるか
   - ボタンのスタイルが適用されているか

2. **ダッシュボード**: http://localhost:3000/dashboard
   - カードコンポーネントのスタイル
   - フォレストテーマの色合い

3. **ガチャページ**: http://localhost:3000/gacha
   - タブコンポーネントのスタイル
   - ガチャカードのスタイル

## 問題報告時に確認する情報
1. 使用ブラウザ（Chrome, Firefox, Safari等）
2. 具体的にスタイルが適用されていないページ
3. DevToolsのエラーメッセージ
4. ネットワークタブでのCSS読み込み状況