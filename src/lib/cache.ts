/**
 * クライアントサイドキャッシュシステム
 * Points Forest - Client-side Caching System
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

class ClientCache {
  private cache = new Map<string, CacheItem<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5分

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    }
    
    this.cache.set(key, item)
    
    // メモリ使用量制限（最大100アイテム）
    if (this.cache.size > 100) {
      const oldest = Array.from(this.cache.keys())[0]
      this.cache.delete(oldest)
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    // 有効期限チェック
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.data as T
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // ユーザー関連のキャッシュをクリア
  clearUserCache(userId: string): void {
    const userKeys = Array.from(this.cache.keys()).filter(key => 
      key.includes(userId) || key.startsWith('user_')
    )
    
    userKeys.forEach(key => this.cache.delete(key))
  }

  // デバッグ用：キャッシュ状態を表示
  getStats() {
    const now = Date.now()
    const items = Array.from(this.cache.entries())
    const valid = items.filter(([_, item]) => now <= item.expiry)
    const expired = items.filter(([_, item]) => now > item.expiry)
    
    return {
      total: items.length,
      valid: valid.length,
      expired: expired.length,
      keys: valid.map(([key]) => key)
    }
  }
}

// シングルトンインスタンス
export const clientCache = new ClientCache()

// 便利なヘルパー関数
export const cacheHelpers = {
  // プロフィールキャッシュ
  profileKey: (userId: string) => `profile_${userId}`,
  getProfile: (userId: string) => clientCache.get(cacheHelpers.profileKey(userId)),
  setProfile: (userId: string, profile: any) => 
    clientCache.set(cacheHelpers.profileKey(userId), profile, 10 * 60 * 1000), // 10分
  
  // 統計情報キャッシュ
  statsKey: (userId: string) => `stats_${userId}`,
  getStats: (userId: string) => clientCache.get(cacheHelpers.statsKey(userId)),
  setStats: (userId: string, stats: any) => 
    clientCache.set(cacheHelpers.statsKey(userId), stats, 2 * 60 * 1000), // 2分
  
  // ゲーム情報キャッシュ
  gamesKey: () => 'games_list',
  getGames: () => clientCache.get(cacheHelpers.gamesKey()),
  setGames: (games: any[]) => 
    clientCache.set(cacheHelpers.gamesKey(), games, 30 * 60 * 1000), // 30分
  
  // アチーブメント情報キャッシュ
  achievementsKey: () => 'achievements_list',
  getAchievements: () => clientCache.get(cacheHelpers.achievementsKey()),
  setAchievements: (achievements: any[]) => 
    clientCache.set(cacheHelpers.achievementsKey(), achievements, 15 * 60 * 1000), // 15分
}