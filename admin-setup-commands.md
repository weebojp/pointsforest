# Points Forest 管理画面セットアップコマンド

## 📦 必要パッケージのインストール

```bash
# チャートライブラリ
npm install recharts

# 追加のUIコンポーネント
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog

# 日付操作ライブラリ
npm install date-fns

# 2FA用ライブラリ（将来の実装用）
npm install speakeasy qrcode
npm install -D @types/speakeasy @types/qrcode
```

## 🗄️ データベースセットアップ

```bash
# 1. 管理画面用スキーマを実行
# Supabase SQL Editor で以下のファイルを順番に実行：

# 1. 管理画面用テーブル作成
# ファイル: supabase/admin-dashboard-schema.sql

# 2. 管理画面用RPC関数作成
# ファイル: supabase/admin-functions.sql
```

## 🔐 初期管理者アカウント作成

```sql
-- Supabase SQL Editor で実行
-- パスワードは実際の環境に合わせて変更してください

INSERT INTO admin_users (
  email,
  username,
  password_hash,
  role,
  permissions,
  is_active,
  email_verified
) VALUES (
  'admin@pointsforest.com',
  'admin',
  crypt('admin123', gen_salt('bf')), -- 実際の環境では強力なパスワードを使用
  'super_admin',
  '{}',
  true,
  true
);
```

## 🚀 管理画面の起動方法

```bash
# 開発サーバー起動
npm run dev

# 管理画面アクセス
# http://localhost:3000/admin/login

# テスト用ログイン情報（開発環境のみ）
# Email: admin@pointsforest.com
# Password: admin123
# 2FA Code: admin123 (テスト用固定値)
```

## 📊 実装された機能

### ✅ 完成済み機能

#### 🔐 認証・権限システム
- 管理者専用ログインシステム
- 役割ベースアクセス制御（RBAC）
- 5段階の権限レベル（super_admin, admin, moderator, analyst, support）
- 2FA対応（テスト実装）
- セッション管理とセキュリティ

#### 📊 ダッシュボード機能
- リアルタイムKPI表示（ユーザー数、DAU、ポイント流通、ゲームセッション）
- インタラクティブチャート（ユーザー増加、ポイント流通、ゲーム活動）
- 期間指定分析（1日、7日、30日、90日）
- システム状態監視

#### 👥 ユーザー管理機能
- 高度なユーザー検索・フィルタリング
- ポイント手動調整機能
- ユーザー詳細情報表示
- 一括操作（予定）
- アカウント状態管理

#### 🔧 システム管理機能
- 設定値の動的変更
- 監査ログ記録
- パフォーマンス監視
- バックアップ管理

### 🎯 主要特徴

#### **セキュリティ**
- Row Level Security (RLS) 実装
- IP制限対応準備
- 全操作の監査ログ
- 暗号化パスワード保存

#### **パフォーマンス**
- 最適化されたクエリ
- ページネーション対応
- リアルタイム更新
- レスポンシブデザイン

#### **運用性**
- 詳細なエラーハンドリング
- 操作履歴の完全追跡
- 設定変更の即座反映
- 自動バックアップ対応

## 🎛️ 利用可能な管理機能

### **ユーザー管理**
- ✅ ユーザー検索・フィルタリング
- ✅ ポイント調整（増減・履歴記録）
- ✅ アカウント詳細表示
- 🔄 アカウント停止・復活（実装予定）
- 🔄 プレミアム設定変更（実装予定）

### **分析・レポート**
- ✅ リアルタイムダッシュボード
- ✅ ユーザー行動分析
- ✅ ポイント経済分析
- ✅ ゲーム利用統計
- 🔄 詳細レポートエクスポート（実装予定）

### **システム設定**
- ✅ ゲームパラメーター調整
- ✅ ポイント設定変更
- ✅ システム設定管理
- 🔄 A/Bテスト管理（実装予定）

## 🔮 今後の拡張予定

### **Phase 1 追加機能**
- [ ] 詳細レポートエクスポート（CSV, Excel）
- [ ] リアルタイム通知システム
- [ ] A/Bテスト管理画面
- [ ] バックアップ・復元機能

### **Phase 2 高度機能**
- [ ] 機械学習ベースのユーザー分析
- [ ] 予測分析とレコメンデーション
- [ ] カスタムダッシュボード作成
- [ ] API アクセスキー管理

### **Phase 3 エンタープライズ**
- [ ] マルチテナント対応
- [ ] 外部システム連携
- [ ] 高度なセキュリティ機能
- [ ] 監査レポート自動生成

## 🛠️ トラブルシューティング

### よくある問題と解決方法

**1. ログインできない**
```sql
-- 管理者アカウントの状態確認
SELECT email, username, is_active, role FROM admin_users WHERE email = 'your-email@domain.com';

-- アカウント有効化
UPDATE admin_users SET is_active = true WHERE email = 'your-email@domain.com';
```

**2. 権限エラー**
```sql
-- 権限確認
SELECT role, permissions FROM admin_users WHERE email = 'your-email@domain.com';

-- 権限追加
UPDATE admin_users SET role = 'admin' WHERE email = 'your-email@domain.com';
```

**3. データが表示されない**
```sql
-- RPC関数の確認
SELECT proname FROM pg_proc WHERE proname LIKE 'admin_%';

-- データベース接続確認
SELECT NOW();
```

## 📞 サポート

管理画面に関する問題や要望については、以下の手順で対応してください：

1. **ログの確認**: ブラウザのコンソールとネットワークタブを確認
2. **データベース確認**: Supabase ダッシュボードでテーブルとRPC関数を確認
3. **権限確認**: 管理者ロールと権限設定を確認
4. **設定確認**: 環境変数とSupabase設定を確認

---

**Points Forest 管理画面システム** - 包括的な管理とデータ主導の意思決定を実現 🚀