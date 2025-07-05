import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPoints(points: number | undefined | null): string {
  // Handle undefined, null, or invalid values
  if (points == null || isNaN(points)) {
    return '0'
  }
  
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`
  }
  return points.toLocaleString()
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function calculateLevel(experience: number): number {
  // Simple level calculation: level = floor(sqrt(experience / 100))
  return Math.floor(Math.sqrt(experience / 100)) + 1
}

export function getExperienceForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100
}

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}