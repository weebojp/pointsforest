-- ====================================
-- SOCIAL SYSTEM (FRIENDS & GUILDS)
-- Sprint 4 Implementation
-- ====================================

-- 1. フレンドシステム
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- フレンド状態
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked', 'rejected')),
  
  -- メタデータ
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  blocked_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 制約: 自分自身とはフレンドになれない、重複関係防止
  CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id),
  CONSTRAINT unique_friendship UNIQUE (
    LEAST(requester_id, addressee_id), 
    GREATEST(requester_id, addressee_id)
  )
);

-- 2. ギルドシステム
CREATE TABLE IF NOT EXISTS guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- ギルド設定
  leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  max_members INTEGER DEFAULT 50 CHECK (max_members > 0),
  is_public BOOLEAN DEFAULT TRUE,
  join_policy TEXT DEFAULT 'open' CHECK (join_policy IN ('open', 'approval', 'invite_only')),
  
  -- ギルド統計
  member_count INTEGER DEFAULT 0,
  total_points BIGINT DEFAULT 0,
  guild_level INTEGER DEFAULT 1 CHECK (guild_level >= 1),
  guild_exp BIGINT DEFAULT 0,
  
  -- 視覚設定
  banner_url TEXT,
  icon_url TEXT,
  color_theme TEXT DEFAULT '#10b981',
  
  -- メタデータ
  founded_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ギルドメンバーシップ
CREATE TABLE IF NOT EXISTS guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- メンバー役職
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member')),
  
  -- 貢献度
  points_contributed BIGINT DEFAULT 0,
  last_contribution_at TIMESTAMPTZ,
  
  -- メンバーシップ状態
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'banned')),
  
  -- 参加情報
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guild_id, user_id)
);

-- 4. ギルド活動ログ
CREATE TABLE IF NOT EXISTS guild_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- 活動内容
  activity_type TEXT NOT NULL, -- 'member_join', 'member_leave', 'points_contribution', 'level_up', 'achievement'
  title TEXT NOT NULL,
  description TEXT,
  
  -- 活動データ
  points_involved INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. プライベートメッセージング
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- メッセージ内容
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'achievement_share')),
  
  -- メッセージ状態
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_deleted_by_sender BOOLEAN DEFAULT FALSE,
  is_deleted_by_recipient BOOLEAN DEFAULT FALSE,
  
  -- 添付データ（実績共有など）
  attachment JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 制約: 自分自身にはメッセージを送れない
  CONSTRAINT no_self_message CHECK (sender_id != recipient_id)
);

-- 6. ソーシャルフィード
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 投稿内容
  content TEXT,
  post_type TEXT DEFAULT 'status' CHECK (post_type IN ('status', 'achievement', 'level_up', 'system')),
  
  -- 投稿データ
  achievement_id UUID REFERENCES achievements(id),
  metadata JSONB DEFAULT '{}',
  
  -- 投稿統計
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- 公開設定
  visibility TEXT DEFAULT 'friends' CHECK (visibility IN ('public', 'friends', 'guild')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 投稿に対するいいね
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, user_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_guild_members_guild_id ON guild_members(guild_id, status);
CREATE INDEX IF NOT EXISTS idx_guild_members_user_id ON guild_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_guild_activities_guild_id ON guild_activities(guild_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_participants ON private_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_visibility ON social_posts(visibility, created_at DESC);

-- デフォルトギルド作成
INSERT INTO guilds (name, slug, description, is_public, max_members, color_theme)
VALUES 
  ('Points Forest 公式ギルド', 'official-guild', '新規プレイヤー歓迎！みんなで楽しくポイントを集めよう！', true, 100, '#10b981'),
  ('エリートハンター', 'elite-hunters', '高レベルプレイヤー専用ギルド。上級者同士で切磋琢磨！', true, 25, '#8b5cf6'),
  ('カジュアルフレンズ', 'casual-friends', 'まったりプレイが好きな人のためのギルド', true, 75, '#f59e0b')
ON CONFLICT (slug) DO NOTHING;

-- フレンド管理関数
CREATE OR REPLACE FUNCTION send_friend_request(
  p_requester_id UUID,
  p_addressee_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing RECORD;
BEGIN
  -- 自分自身へのリクエストをチェック
  IF p_requester_id = p_addressee_id THEN
    RETURN jsonb_build_object('success', false, 'error', '自分自身にフレンドリクエストを送ることはできません');
  END IF;
  
  -- 既存の関係をチェック
  SELECT * INTO v_existing
  FROM friendships
  WHERE (requester_id = p_requester_id AND addressee_id = p_addressee_id)
     OR (requester_id = p_addressee_id AND addressee_id = p_requester_id);
  
  IF FOUND THEN
    CASE v_existing.status
      WHEN 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', '既にフレンドリクエストが送信されています');
      WHEN 'accepted' THEN
        RETURN jsonb_build_object('success', false, 'error', '既にフレンドです');
      WHEN 'blocked' THEN
        RETURN jsonb_build_object('success', false, 'error', 'このユーザーとの関係はブロックされています');
    END CASE;
  END IF;
  
  -- 新しいフレンドリクエストを作成
  INSERT INTO friendships (requester_id, addressee_id, status)
  VALUES (p_requester_id, p_addressee_id, 'pending');
  
  RETURN jsonb_build_object('success', true, 'message', 'フレンドリクエストを送信しました');
END;
$$;

-- フレンドリクエスト承諾関数
CREATE OR REPLACE FUNCTION accept_friend_request(
  p_user_id UUID,
  p_requester_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_friendship RECORD;
BEGIN
  -- フレンドリクエストを取得
  SELECT * INTO v_friendship
  FROM friendships
  WHERE requester_id = p_requester_id 
    AND addressee_id = p_user_id 
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'フレンドリクエストが見つかりません');
  END IF;
  
  -- フレンドリクエストを承諾
  UPDATE friendships
  SET status = 'accepted',
      responded_at = NOW(),
      updated_at = NOW()
  WHERE id = v_friendship.id;
  
  RETURN jsonb_build_object('success', true, 'message', 'フレンドリクエストを承諾しました');
END;
$$;

-- ギルド参加関数
CREATE OR REPLACE FUNCTION join_guild(
  p_user_id UUID,
  p_guild_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_guild RECORD;
  v_current_guild UUID;
BEGIN
  -- ギルド情報取得
  SELECT * INTO v_guild FROM guilds WHERE slug = p_guild_slug AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ギルドが見つかりません');
  END IF;
  
  -- 既存のギルドメンバーシップをチェック
  SELECT guild_id INTO v_current_guild
  FROM guild_members
  WHERE user_id = p_user_id AND status = 'active';
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', '既に他のギルドに参加しています');
  END IF;
  
  -- メンバー数制限チェック
  IF v_guild.member_count >= v_guild.max_members THEN
    RETURN jsonb_build_object('success', false, 'error', 'ギルドの定員に達しています');
  END IF;
  
  -- ギルドに参加
  INSERT INTO guild_members (guild_id, user_id, role, status)
  VALUES (v_guild.id, p_user_id, 'member', 'active');
  
  -- ギルドのメンバー数を更新
  UPDATE guilds
  SET member_count = member_count + 1,
      last_activity_at = NOW(),
      updated_at = NOW()
  WHERE id = v_guild.id;
  
  -- 活動ログに記録
  INSERT INTO guild_activities (guild_id, user_id, activity_type, title, description)
  VALUES (v_guild.id, p_user_id, 'member_join', 'メンバー参加', '新しいメンバーがギルドに参加しました');
  
  RETURN jsonb_build_object('success', true, 'message', FORMAT('ギルド「%s」に参加しました', v_guild.name));
END;
$$;

-- ユーザーのフレンド一覧取得関数
CREATE OR REPLACE FUNCTION get_user_friends(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB := '[]';
  v_friend RECORD;
BEGIN
  FOR v_friend IN
    SELECT 
      CASE 
        WHEN f.requester_id = p_user_id THEN f.addressee_id
        ELSE f.requester_id
      END as friend_id,
      u.username,
      u.display_name,
      u.level,
      u.last_seen_at,
      f.created_at as friendship_since
    FROM friendships f
    JOIN users u ON (
      CASE 
        WHEN f.requester_id = p_user_id THEN f.addressee_id = u.id
        ELSE f.requester_id = u.id
      END
    )
    WHERE (f.requester_id = p_user_id OR f.addressee_id = p_user_id)
      AND f.status = 'accepted'
    ORDER BY u.last_seen_at DESC
  LOOP
    v_result := v_result || jsonb_build_object(
      'user_id', v_friend.friend_id,
      'username', v_friend.username,
      'display_name', v_friend.display_name,
      'level', v_friend.level,
      'last_seen_at', v_friend.last_seen_at,
      'friendship_since', v_friend.friendship_since,
      'is_online', (v_friend.last_seen_at > NOW() - INTERVAL '5 minutes')
    );
  END LOOP;
  
  RETURN v_result;
END;
$$;