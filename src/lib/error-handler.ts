/**
 * 統一されたエラーハンドリングシステム
 * Points Forest - Error Management System
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' = 'medium',
    public solution?: string,
    public userFriendlyMessage?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export interface ErrorSolution {
  title: string
  description: string
  actions: Array<{
    label: string
    action: () => void
  }>
}

// エラーコード定数
export const ERROR_CODES = {
  // Network Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Authentication Errors
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  
  // Game Errors
  DAILY_LIMIT_EXCEEDED: 'DAILY_LIMIT_EXCEEDED',
  GAME_SESSION_ERROR: 'GAME_SESSION_ERROR',
  INVALID_SCORE: 'INVALID_SCORE',
  
  // Database Errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  
  // User Errors
  INVALID_INPUT: 'INVALID_INPUT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // System Errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  FEATURE_UNAVAILABLE: 'FEATURE_UNAVAILABLE'
} as const

type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// エラーメッセージとソリューションのマッピング
export const ERROR_SOLUTIONS: Record<ErrorCode, {
  userMessage: string
  solution: string
  severity: 'low' | 'medium' | 'high'
}> = {
  [ERROR_CODES.NETWORK_ERROR]: {
    userMessage: 'インターネット接続に問題があります',
    solution: 'インターネット接続を確認して、もう一度お試しください',
    severity: 'medium'
  },
  [ERROR_CODES.TIMEOUT_ERROR]: {
    userMessage: '処理に時間がかかりすぎています',
    solution: 'しばらく待ってから再度お試しください',
    severity: 'medium'
  },
  [ERROR_CODES.SERVER_ERROR]: {
    userMessage: 'サーバーで問題が発生しました',
    solution: 'しばらく時間をおいてから再試行してください。問題が続く場合はサポートにお問い合わせください',
    severity: 'high'
  },
  [ERROR_CODES.AUTH_EXPIRED]: {
    userMessage: 'セッションが期限切れです',
    solution: 'もう一度ログインしてください',
    severity: 'medium'
  },
  [ERROR_CODES.AUTH_INVALID]: {
    userMessage: 'ログイン情報が正しくありません',
    solution: 'メールアドレスとパスワードを確認してください',
    severity: 'medium'
  },
  [ERROR_CODES.AUTH_REQUIRED]: {
    userMessage: 'この機能を使用するにはログインが必要です',
    solution: 'ログインしてから再度お試しください',
    severity: 'low'
  },
  [ERROR_CODES.DAILY_LIMIT_EXCEEDED]: {
    userMessage: '本日のプレイ上限に達しました',
    solution: '明日また挑戦してください！他のゲームも試してみませんか？',
    severity: 'low'
  },
  [ERROR_CODES.GAME_SESSION_ERROR]: {
    userMessage: 'ゲームデータの保存に失敗しました',
    solution: 'ページを再読み込みして、もう一度お試しください',
    severity: 'medium'
  },
  [ERROR_CODES.INVALID_SCORE]: {
    userMessage: '無効なスコアが検出されました',
    solution: 'ゲームを正常にプレイしてください',
    severity: 'medium'
  },
  [ERROR_CODES.DATABASE_ERROR]: {
    userMessage: 'データの処理中にエラーが発生しました',
    solution: 'しばらく時間をおいてから再試行してください',
    severity: 'high'
  },
  [ERROR_CODES.TRANSACTION_FAILED]: {
    userMessage: 'ポイントの処理に失敗しました',
    solution: 'ポイント残高を確認して、問題があればサポートにお問い合わせください',
    severity: 'high'
  },
  [ERROR_CODES.INVALID_INPUT]: {
    userMessage: '入力内容に誤りがあります',
    solution: '入力内容を確認して、正しい形式で入力してください',
    severity: 'low'
  },
  [ERROR_CODES.PERMISSION_DENIED]: {
    userMessage: 'この操作を実行する権限がありません',
    solution: 'ログイン状態を確認するか、管理者にお問い合わせください',
    severity: 'medium'
  },
  [ERROR_CODES.UNKNOWN_ERROR]: {
    userMessage: '予期しないエラーが発生しました',
    solution: 'ページを再読み込みして、もう一度お試しください。問題が続く場合はサポートにお問い合わせください',
    severity: 'medium'
  },
  [ERROR_CODES.FEATURE_UNAVAILABLE]: {
    userMessage: 'この機能は現在利用できません',
    solution: 'しばらく時間をおいてから再度お試しください',
    severity: 'low'
  }
}

/**
 * エラーを解析してユーザーフレンドリーなメッセージを生成
 */
export function parseError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    // Fetch API エラー
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new AppError(
        error.message,
        ERROR_CODES.NETWORK_ERROR,
        'medium',
        ERROR_SOLUTIONS[ERROR_CODES.NETWORK_ERROR].solution,
        ERROR_SOLUTIONS[ERROR_CODES.NETWORK_ERROR].userMessage
      )
    }

    // Supabase エラー
    if (error.message.includes('auth')) {
      return new AppError(
        error.message,
        ERROR_CODES.AUTH_INVALID,
        'medium',
        ERROR_SOLUTIONS[ERROR_CODES.AUTH_INVALID].solution,
        ERROR_SOLUTIONS[ERROR_CODES.AUTH_INVALID].userMessage
      )
    }

    // その他のエラー
    return new AppError(
      error.message,
      ERROR_CODES.UNKNOWN_ERROR,
      'medium',
      ERROR_SOLUTIONS[ERROR_CODES.UNKNOWN_ERROR].solution,
      ERROR_SOLUTIONS[ERROR_CODES.UNKNOWN_ERROR].userMessage
    )
  }

  // 不明なエラー
  return new AppError(
    'Unknown error occurred',
    ERROR_CODES.UNKNOWN_ERROR,
    'medium',
    ERROR_SOLUTIONS[ERROR_CODES.UNKNOWN_ERROR].solution,
    ERROR_SOLUTIONS[ERROR_CODES.UNKNOWN_ERROR].userMessage
  )
}

/**
 * エラーレポート用のデータを生成
 */
export function createErrorReport(error: AppError, context?: Record<string, any>) {
  return {
    timestamp: new Date().toISOString(),
    code: error.code,
    message: error.message,
    severity: error.severity,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    url: typeof window !== 'undefined' ? window.location.href : 'Server',
    context: context || {},
    stack: error.stack
  }
}

/**
 * エラーをトーストで表示するためのヘルパー
 */
export function getToastFromError(error: AppError) {
  const config = ERROR_SOLUTIONS[error.code as ErrorCode] || ERROR_SOLUTIONS[ERROR_CODES.UNKNOWN_ERROR]
  
  return {
    title: config.userMessage,
    description: error.solution || config.solution,
    variant: config.severity === 'high' ? 'destructive' as const : 'default' as const,
    duration: config.severity === 'low' ? 3000 : 5000
  }
}