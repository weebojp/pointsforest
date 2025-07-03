# Tailwind CSS リセット手順

もしスタイルが表示されない問題が続く場合、以下の手順を実行してください：

## 1. 開発サーバー停止
```bash
# ターミナルで Ctrl+C
```

## 2. キャッシュクリア
```bash
rm -rf .next
rm -rf node_modules/.cache
```

## 3. Tailwind CSS 再インストール
```bash
npm uninstall tailwindcss postcss autoprefixer
npm install -D tailwindcss postcss autoprefixer
```

## 4. 設定ファイル確認
```bash
npx tailwindcss init -p
```

## 5. globals.css の確認
`src/app/globals.css` の先頭に以下があることを確認：
```css
@tailwind base;
@tailwind components; 
@tailwind utilities;
```

## 6. 開発サーバー再起動
```bash
npm run dev
```

## 7. ブラウザでハードリフレッシュ
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

## 8. 最終確認
ブラウザで http://localhost:3000 にアクセスして：
- 背景の緑のグラデーションが表示されるか
- ボタンのスタイルが適用されているか
- DevTools → Elements で `class` 属性が表示されているか

## トラブルシューティング

### Case 1: コンパイルエラーが表示される
コンソールのエラーメッセージを確認し、不正なCSSクラスがないかチェック

### Case 2: ファイルが見つからない
`tailwind.config.ts` の `content` 配列にすべてのファイルパスが含まれているか確認

### Case 3: 他のCSSとの競合
`globals.css` で他のCSSライブラリと競合していないか確認