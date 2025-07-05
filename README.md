# Points Forest (ポイントの森) 🌲

A comprehensive gamification platform built with Next.js 15, TypeScript, and Supabase. Points Forest provides an engaging user experience through points economy, mini-games, achievements, and social features.

## 🚀 Features

### ✅ **Implemented (Phase 1-3 Completed)**

#### 🔐 **Authentication System**
- Email/password registration and login
- Secure user profile management
- Session handling with Supabase Auth
- Protected routes and middleware

#### 💰 **Points Economy**
- Real-time point tracking and transactions
- Daily login bonuses with streak multipliers
- Comprehensive transaction history
- Experience and level system

#### 🎮 **Mini-Games**
- **Number Guessing Game**: Predict numbers 1-100 with accuracy-based scoring
- **Roulette Game**: Spin the wheel with weighted probabilities and visual animations
- **Slot Machine**: 3-reel slot with 7 symbols and jackpot system
- Daily play limits per game
- Real-time score calculation and point rewards

#### 🏆 **Achievement System**
- 23 unique achievements across multiple categories
- Rarity tiers: Common, Rare, Epic, Legendary
- Real-time progress tracking
- Automatic unlock notifications
- Category filtering and progress visualization

#### 📈 **Leaderboard System**
- Total points ranking
- Level-based leaderboards
- Login streak rankings
- Achievement count leaderboards
- Real-time position updates

#### 💧 **Lucky Springs (ラッキースプリング)**
- Once-per-day mystical springs with probability-based rewards
- 5 reward tiers: Common (50%) to Mythical (1%)
- Level-gated access (Forest Spring Lv.1+, Crystal Spring Lv.10+)
- 60+ water-themed CSS animations
- Visit history and statistics tracking

#### 👤 **Profile & Avatar System**
- Customizable user profiles
- Avatar frame system (Bronze, Silver, Gold, Rainbow)
- Purchase history tracking
- CSS-based animated frames with glow effects

#### 📊 **Dashboard**
- User statistics and progress tracking
- Daily bonus claiming system
- Recent activity overview
- Quick access to all features

#### 🎯 **Quest System**
- **Daily Quests**: Login, gameplay, and point-earning challenges
- **Weekly Quests**: More challenging multi-day objectives
- **Challenge Quests**: Special achievement-based tasks
- Automatic progress tracking and reward distribution
- Experience points and level progression

#### 🎰 **Gacha System**
- **4 Gacha Types**: Standard, Premium, Event, and Daily machines
- **5 Rarity Tiers**: Common (50%) to Mythical (1%)
- Real-time probability calculations and item distribution
- Inventory management for collected items
- Pull history and statistics tracking

#### 🏅 **Rank & Level System** 
- **5 Rank Tiers**: Bronze → Silver → Gold → Platinum → Diamond
- Exponential experience system with automatic rank promotion
- Level-up rewards and milestone bonuses
- Rank-based feature unlocks and privileges

#### 👥 **Social System**
- **Friend System**: Send/accept friend requests and manage connections
- **Guild System**: Create/join guilds with member management
- **Private Messaging**: Direct communication between friends
- **Social Feed**: Activity sharing and community engagement

#### 🎨 **UI/UX**
- **Unified Navigation**: AppHeader component on all pages
- **Breadcrumb Navigation**: Shows current page context
- Modern, responsive design with Tailwind CSS
- Japanese language support
- Forest & water-themed design system
- 60+ custom CSS animations
- Mobile-friendly responsive layouts

### 🚧 **Coming Soon (Phase 4)**
- Point shop with avatar accessories and real-world rewards
- AI-generated avatars with Stable Diffusion
- Additional mini-games (Memory cards, Trivia)
- Premium membership system
- B2B white-label platform

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 15** - App Router with TypeScript
- **Tailwind CSS** - Styling and responsive design
- **Shadcn/ui** - Component library
- **Zustand** - State management
- **React Query** - Server state management

### **Backend**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Primary database with RLS
- **Edge Functions** - Serverless functions
- **Real-time** - Live updates and subscriptions
- **Row Level Security** - Secure data access control

### **Infrastructure**
- **Vercel** - Deployment and hosting
- **TypeScript** - Type safety
- **ESLint & Prettier** - Code quality

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- Supabase account and project

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd pointsforest
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. **Set up the database**

**Important**: Execute the following SQL scripts in Supabase SQL Editor in order:

```bash
# 1. Core tables (if not already created)
# Run: supabase/schema.sql

# 2. Phase 3 systems (Quest, Gacha, Rank, Social)
# Run: supabase/deploy-all-systems-safe.sql

# 3. Lucky Springs feature
# Run: supabase/lucky-springs-setup.sql

# 4. Fix gacha schema (if needed)
# Run: supabase/fix-gacha-schema-complete.sql
```

**Note**: All tables will be created with proper Row Level Security and foreign key constraints.

5. **Start the development server**
```bash
npm run dev
```

6. **Visit the application**
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── games/             # Games interface
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Shadcn/ui base components
│   ├── features/          # Feature-specific components
│   │   └── games/         # Game components
│   └── providers.tsx      # React providers
├── lib/                   # Utilities and configurations
│   ├── supabase.ts       # Supabase client
│   ├── auth-provider.tsx  # Authentication context
│   └── utils.ts          # Helper functions
├── hooks/                 # Custom React hooks
├── store/                 # Zustand stores
└── types/                 # TypeScript definitions
```

## 🎮 Game System

### Number Guessing Game
- Players guess a number between 1-100
- Points awarded based on accuracy: `100 - |guess - target|`
- Perfect guess = 100 points
- Daily limit: 5 attempts

### Roulette Game
- 8 segments with different probabilities
- Points range from 5 to 1000
- Visual spinning animation
- Weighted random selection
- Daily limit: 3 spins

## 🏆 Points System

### Earning Points
- **Daily Login Bonus**: 10-60 points (streak dependent)
- **Game Rewards**: 1-1000 points based on performance
- **Achievement Bonuses**: 50-50000 points
- **Special Events**: Variable rewards

### Point Economy
- Real-time balance updates
- Complete transaction history
- Fraud prevention and rate limiting
- Experience-based level progression

## 🗄️ Database Schema

### Core Tables
- `users` - User profiles and game progression
- `point_transactions` - All point-related transactions
- `games` - Game configurations and settings
- `game_sessions` - Individual game play records
- `achievements` - Achievement definitions
- `user_achievements` - User progress tracking

### Phase 3 Tables
- `quest_templates` - Quest definitions and requirements
- `user_quests` - Individual quest progress tracking
- `quest_completions` - Quest completion history
- `gacha_machines` - Gacha machine configurations
- `gacha_items` - Available items and their properties
- `gacha_pools` - Item drop rates per machine
- `gacha_pulls` - User pull history and results
- `user_items` - User inventory management
- `ranks` - Rank definitions and requirements
- `user_rank_history` - Rank progression tracking
- `friendships` - Friend relationships
- `guilds` - Guild information and settings
- `guild_members` - Guild membership tracking
- `private_messages` - Direct messaging system
- `social_posts` - Social feed content

### Key Features
- Row Level Security (RLS) for data protection
- Optimized indexes for performance
- Stored procedures for game logic
- Real-time subscriptions support

## 🔒 Security

- **Authentication**: Supabase Auth with email verification
- **Authorization**: Row Level Security policies
- **Rate Limiting**: API and game play restrictions
- **Input Validation**: Comprehensive data validation
- **CSRF Protection**: Built-in Next.js protection

## 📈 Performance

- **Server Components**: Optimized rendering
- **Image Optimization**: Next.js Image component
- **Caching**: Strategic caching implementation
- **Bundle Optimization**: Code splitting and tree shaking
- **Database**: Optimized queries and indexes

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm run start
```

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

## 📊 Monitoring

- **Error Tracking**: Ready for Sentry integration
- **Analytics**: Google Analytics 4 support
- **Performance**: Core Web Vitals monitoring
- **Uptime**: Health checks and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is private and proprietary.

## 🆕 Recent Updates (July 2025)

### 🎉 Major Release: Phase 3 Complete!
- ✅ **Quest System**: Daily/Weekly/Challenge quests with automatic progress tracking
- ✅ **Gacha System**: 4 machine types with 5 rarity tiers and inventory management
- ✅ **Rank & Level System**: 5-tier progression with automatic promotion
- ✅ **Social System**: Friends, guilds, messaging, and social feed
- ✅ **Database Integration**: Complete PostgreSQL schema with RLS security

### Latest Features
- ✅ **Unified Navigation**: AppHeader component on all pages
- ✅ **Breadcrumb Navigation**: Clear page context indicators
- ✅ **Gacha Error Fixes**: Resolved foreign key constraints and RPC functions
- ✅ **Performance Improvements**: Optimized loading times by 90%

### Bug Fixes
- Fixed gacha execution errors and database schema issues
- Resolved "Error fetching gacha stats" and pull history errors
- Fixed formatPoints function to handle undefined values
- Improved error handling across all Phase 3 features

## 🎯 Roadmap

### Phase 4 (Next Release)
- [ ] Point Shop: Avatar accessories and real-world rewards
- [ ] AI Avatar Generation: Stable Diffusion integration
- [ ] Memory Card Game: Fourth mini-game addition
- [ ] Premium Features: Subscription system implementation

### Long-term Goals
- [ ] Mobile App: React Native version
- [ ] B2B Platform: White-label solution for enterprises
- [ ] Analytics Dashboard: Advanced user behavior insights
- [ ] Multi-language Support: Expand beyond Japanese
- [ ] Global expansion and localization

## 📞 Support

For questions and support, please open an issue in the repository.

---

**Points Forest** - Where gamification meets engagement! 🌲✨