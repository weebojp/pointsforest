/**
 * パフォーマンス監視とログイン最適化
 * Points Forest - Performance Monitoring System
 */

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private isEnabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'

  start(name: string, metadata?: Record<string, any>) {
    if (!this.isEnabled) return

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    })
    console.log(`🚀 Performance: Started ${name}`, metadata)
  }

  end(name: string) {
    if (!this.isEnabled) return

    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`⚠️ Performance: No start metric found for ${name}`)
      return
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    metric.endTime = endTime
    metric.duration = duration

    const status = duration > 2000 ? '🐌' : duration > 1000 ? '⚠️' : '✅'
    console.log(`${status} Performance: ${name} completed in ${duration.toFixed(2)}ms`, metric.metadata)

    // Alert for slow operations
    if (duration > 3000) {
      console.error(`🚨 SLOW OPERATION: ${name} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  getMetrics() {
    return Array.from(this.metrics.values())
  }

  clear() {
    this.metrics.clear()
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Auth Performance Utilities
export const authMetrics = {
  startLogin: () => performanceMonitor.start('auth_login'),
  endLogin: () => performanceMonitor.end('auth_login'),
  
  startProfileFetch: (userId: string) => 
    performanceMonitor.start('profile_fetch', { userId }),
  endProfileFetch: () => performanceMonitor.end('profile_fetch'),
  
  startSessionCheck: () => performanceMonitor.start('session_check'),
  endSessionCheck: () => performanceMonitor.end('session_check'),
}