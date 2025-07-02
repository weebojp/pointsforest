/**
 * Avatar System Type Definitions
 * Points Forest - Avatar & Customization System
 */

export type AvatarFrameType = 'bronze' | 'silver' | 'gold' | 'rainbow'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type AccessoryCategory = 'hat' | 'glasses' | 'decoration' | 'badge'

export interface AvatarFrame {
  id: string
  name: string
  type: AvatarFrameType
  price: number
  rarity: Rarity
  cssClass: string
  unlockRequirement?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface AvatarAccessory {
  id: string
  name: string
  category: AccessoryCategory
  price: number
  imageUrl: string
  position: {
    x: number
    y: number
  }
  rarity: Rarity
  isActive: boolean
}

export interface AvatarConfig {
  baseAvatar: string
  frameId?: string
  accessories: string[] // accessory IDs
  background?: string
}

export interface UserAvatarFrame {
  id: string
  userId: string
  frameId: string
  frame?: AvatarFrame
  isEquipped: boolean
  purchasedAt: string
}

export interface UserAvatarAccessory {
  id: string
  userId: string
  accessoryId: string
  accessory?: AvatarAccessory
  isEquipped: boolean
  purchasedAt: string
}

// Shop & Purchase Types
export type ShopCategory = 'virtual' | 'real_world' | 'premium' | 'limited'

export interface ShopItem {
  id: string
  name: string
  description: string
  category: ShopCategory
  subcategory?: string
  
  // Pricing & Stock
  price: number
  originalPrice?: number
  stock?: number // null = unlimited
  
  // Requirements
  levelRequirement?: number
  premiumOnly?: boolean
  timeRestricted?: {
    startDate: string
    endDate: string
  }
  
  // Metadata
  imageUrl?: string
  rarity: Rarity
  tags: string[]
  isPopular: boolean
  isFeatured: boolean
  isNew: boolean
  isActive: boolean
  
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface Purchase {
  id: string
  userId: string
  itemId?: string
  
  // Purchase Details
  itemName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  
  // Status
  status: PurchaseStatus
  
  // Shipping (for real items)
  shippingInfo?: Record<string, any>
  trackingNumber?: string
  deliveredAt?: string
  
  transactionId?: string
  createdAt: string
  updatedAt: string
}

// Slot Machine Types
export interface SlotSymbol {
  id: string
  name: string
  icon: string
  probability: number
  value: number
  rarity: Rarity
}

export interface SlotResult {
  id: string
  gameSessionId: string
  userId: string
  
  reel1: string
  reel2: string
  reel3: string
  combinationType?: string
  multiplier: number
  basePoints: number
  bonusPoints: number
  
  createdAt: string
}

export interface SlotMachineConfig {
  reels: number
  symbols: SlotSymbol[]
  payouts: {
    threeOfKind: Record<string, number>
    twoOfKind: Record<string, number>
  }
  animationDuration: number
}

// Profile & Settings
export interface ProfileSettings {
  displayName?: string
  bio?: string
  isPublic: boolean
  avatarConfig: AvatarConfig
}

export interface UserProfile {
  id: string
  email: string
  username: string
  displayName?: string
  bio?: string
  
  // Points & Progress
  points: number
  level: number
  experience: number
  loginStreak: number
  
  // Avatar
  avatarUrl?: string
  avatarFrameId?: string
  avatarAccessories: string[]
  
  // Metadata
  isPremium: boolean
  isPublic: boolean
  lastLoginAt?: string
  lastDailyBonusAt?: string
  createdAt: string
  updatedAt: string
}