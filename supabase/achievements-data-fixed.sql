-- Initial achievements data for Points Forest - Fixed Version

-- First, let's check what columns exist in games table and add slug if needed
DO $$ 
BEGIN
  -- Add slug column to games if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'slug') THEN
    ALTER TABLE games ADD COLUMN slug TEXT;
  END IF;
  
  -- Make slug NOT NULL with default values for existing rows
  UPDATE games SET slug = LOWER(REPLACE(name, ' ', '_')) WHERE slug IS NULL;
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'games_slug_unique') THEN
    ALTER TABLE games ADD CONSTRAINT games_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- Clear existing data to avoid conflicts
DELETE FROM user_achievements;
DELETE FROM game_sessions;
DELETE FROM achievements;
DELETE FROM games;
DELETE FROM leaderboards;

-- Insert initial achievements
INSERT INTO achievements (id, name, description, category, rarity, conditions, point_reward, is_active) VALUES
-- First Steps Category
('01234567-89ab-cdef-0123-456789abcde1', '初回登録', 'Points Forestへようこそ！初めてアカウントを作成しました', 'first_steps', 'common', '{"type": "registration"}', 50, true),
('01234567-89ab-cdef-0123-456789abcde2', 'はじめての一歩', '最初のゲームをプレイしました', 'first_steps', 'common', '{"type": "first_game"}', 100, true),
('01234567-89ab-cdef-0123-456789abcde3', 'デイリーボーナス獲得', '初回デイリーボーナスを取得しました', 'first_steps', 'common', '{"type": "first_daily_bonus"}', 75, true),

-- Points Category
('01234567-89ab-cdef-0123-456789abcdf1', 'ポイントコレクター', '累計1,000ポイントを獲得', 'points', 'common', '{"type": "total_points", "value": 1000}', 200, true),
('01234567-89ab-cdef-0123-456789abcdf2', 'ポイントマスター', '累計10,000ポイントを獲得', 'points', 'rare', '{"type": "total_points", "value": 10000}', 1000, true),
('01234567-89ab-cdef-0123-456789abcdf3', 'ポイント王', '累計100,000ポイントを獲得', 'points', 'legendary', '{"type": "total_points", "value": 100000}', 5000, true),

-- Games Category
('01234567-89ab-cdef-0123-456789abce01', 'ゲーマー見習い', '5回ゲームをプレイ', 'games', 'common', '{"type": "games_played", "value": 5}', 150, true),
('01234567-89ab-cdef-0123-456789abce02', 'ゲームマニア', '50回ゲームをプレイ', 'games', 'rare', '{"type": "games_played", "value": 50}', 500, true),
('01234567-89ab-cdef-0123-456789abce03', 'ゲームマスター', '200回ゲームをプレイ', 'games', 'epic', '{"type": "games_played", "value": 200}', 2000, true),

-- Number Guessing Specific
('01234567-89ab-cdef-0123-456789abcf01', '正確な予想', '数字当てゲームで100点を獲得', 'number_guess', 'uncommon', '{"type": "game_score", "game_type": "number_guess", "value": 100}', 300, true),
('01234567-89ab-cdef-0123-456789abcf02', '完璧な予想', '数字当てゲームで一発で正解', 'number_guess', 'rare', '{"type": "perfect_guess"}', 500, true),

-- Roulette Specific
('01234567-89ab-cdef-0123-456789abc001', '幸運の女神', 'ルーレットで最高賞を獲得', 'roulette', 'uncommon', '{"type": "roulette_jackpot"}', 400, true),
('01234567-89ab-cdef-0123-456789abc002', 'ルーレット王', 'ルーレットを50回プレイ', 'roulette', 'rare', '{"type": "game_count", "game_type": "roulette", "value": 50}', 800, true),

-- Streak Category
('01234567-89ab-cdef-0123-456789abd001', '3日連続', '3日連続でログイン', 'streak', 'common', '{"type": "login_streak", "value": 3}', 200, true),
('01234567-89ab-cdef-0123-456789abd002', '1週間連続', '7日連続でログイン', 'streak', 'uncommon', '{"type": "login_streak", "value": 7}', 500, true),
('01234567-89ab-cdef-0123-456789abd003', '1ヶ月連続', '30日連続でログイン', 'streak', 'epic', '{"type": "login_streak", "value": 30}', 3000, true),

-- Level Category
('01234567-89ab-cdef-0123-456789abe001', 'レベルアップ', 'レベル5に到達', 'level', 'common', '{"type": "level", "value": 5}', 250, true),
('01234567-89ab-cdef-0123-456789abe002', '上級者', 'レベル10に到達', 'level', 'uncommon', '{"type": "level", "value": 10}', 600, true),
('01234567-89ab-cdef-0123-456789abe003', 'エキスパート', 'レベル25に到達', 'level', 'rare', '{"type": "level", "value": 25}', 1500, true),
('01234567-89ab-cdef-0123-456789abe004', 'レジェンド', 'レベル50に到達', 'level', 'legendary', '{"type": "level", "value": 50}', 5000, true),

-- Special Category
('01234567-89ab-cdef-0123-456789abf001', '早起きの鳥', '午前6時前にログイン', 'special', 'uncommon', '{"type": "early_login", "hour": 6}', 300, true),
('01234567-89ab-cdef-0123-456789abf002', '夜更かし', '午後11時以降にログイン', 'special', 'uncommon', '{"type": "late_login", "hour": 23}', 300, true),
('01234567-89ab-cdef-0123-456789abf003', 'コンプリート', '全ての一般アチーブメントを獲得', 'special', 'legendary', '{"type": "achievement_completion", "category": "common"}', 10000, true);

-- Insert initial games data with slug
INSERT INTO games (id, name, slug, type, description, config, daily_limit, min_points, max_points, is_active, is_beta) VALUES
('550e8400-e29b-41d4-a716-446655440000', '数字当てゲーム', 'number_guessing', 'number_guess', '1から100までの数字を当てよう！精度が高いほどポイントアップ', '{"min": 1, "max": 100}', 10, 1, 100, true, false),
('550e8400-e29b-41d4-a716-446655440001', 'ルーレットゲーム', 'roulette', 'roulette', 'ルーレットを回してポイントを獲得しよう！運試しの時間です', '{"segments": 8, "weights": [40, 25, 15, 10, 5, 3, 1.5, 0.5]}', 8, 5, 1000, true, false);

-- Insert initial leaderboards
INSERT INTO leaderboards (id, name, type, description, period_type, is_active) VALUES
('12345678-90ab-cdef-1234-567890abcde1', '総合ポイントランキング', 'total_points', '累計ポイント数でのランキング', 'all_time', true),
('12345678-90ab-cdef-1234-567890abcde2', '今週のポイント王', 'weekly_points', '今週獲得したポイント数でのランキング', 'weekly', true),
('12345678-90ab-cdef-1234-567890abcde3', '今月のゲーマー', 'monthly_games', '今月プレイしたゲーム数でのランキング', 'monthly', true),
('12345678-90ab-cdef-1234-567890abcde4', 'ログインストリーク王', 'login_streak', '連続ログイン日数でのランキング', 'all_time', true);