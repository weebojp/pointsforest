# Points Forest (ポイントの森) 🌲

A comprehensive gamification platform built with Next.js 15, TypeScript, and Supabase. Points Forest provides an engaging user experience through points economy, mini-games, achievements, and social features.

## 🚀 Features

### ✅ **Implemented (Phase 1)**

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
- Daily play limits per game
- Real-time score calculation and point rewards

#### 📊 **Dashboard**
- User statistics and progress tracking
- Daily bonus claiming system
- Recent activity overview
- Quick access to all features

#### 🎨 **UI/UX**
- Modern, responsive design with Tailwind CSS
- Japanese language support
- Forest-themed color palette
- Smooth animations and interactions
- Mobile-friendly PWA capabilities

### 🚧 **Coming Soon (Phase 2)**
- Achievement system with badges
- Leaderboards and rankings
- AI-generated avatars
- Point shop with virtual items
- Social features (friends, messaging)

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
```bash
npm run setup-db
```

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

## 🎯 Roadmap

### Phase 2 (Next 2-4 weeks)
- [ ] Achievement system implementation
- [ ] Leaderboards with real-time updates
- [ ] AI avatar generation
- [ ] Point shop with virtual items

### Phase 3 (Month 2)
- [ ] Social features (friends, messaging)
- [ ] Guild system and competitions
- [ ] Mobile app development
- [ ] Advanced analytics dashboard

### Phase 4 (Month 3+)
- [ ] Enterprise features
- [ ] White-label solutions
- [ ] API marketplace
- [ ] Global expansion

## 📞 Support

For questions and support, please open an issue in the repository.

---

**Points Forest** - Where gamification meets engagement! 🌲✨