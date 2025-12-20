# Fndr Frontend Design Specification

## **Design Philosophy & Brand Identity**

### Brand Philosophy
- **Core Value**: Yield-Enhanced Innovation
- **Personality**: Modern, trustworthy, innovative, accessible
- **Tone**: Professional yet approachable - making DeFi fundraising feel safe and exciting
- **Unique Value**: First platform where investment capital immediately works for everyone

### Visual Direction
- **Style**: Neo-brutalism meets Web3
- **Feeling**: Confident, transparent, growth-focused
- **Inspiration**: Linear.app, Stripe.com, Uniswap, Framer.com

---

## **Color System & Design Tokens**

### Color Palette

#### Primary Colors
- **Main**: `#6366F1` (Indigo - Trust & Innovation)
- **Light**: `#A5B4FC`
- **Dark**: `#4338CA`
- **Gradient**: `linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)`

#### Accent Colors
- **Yield**: `#10B981` (Green - Yield/Growth)
- **Warning**: `#F59E0B` (Amber - Attention)
- **Success**: `#059669` (Emerald - Success states)
- **Error**: `#DC2626` (Red - Error states)

#### Neutral Colors
- **Background**: `#FAFAFA` (Warm gray background)
- **Surface**: `#FFFFFF`
- **Border**: `#E5E7EB`
- **Text Primary**: `#111827`
- **Text Secondary**: `#6B7280`
- **Text Muted**: `#9CA3AF`

#### Web3 Colors
- **Ethereum**: `#627EEA`
- **Wallet**: `#FF6B35`
- **DeFi**: `#1CFFCE`

### Typography

#### Font Stack
- **Primary**: `Inter, system-ui, -apple-system, sans-serif`
- **Mono**: `JetBrains Mono, Consolas, monospace`
- **Display**: `Cal Sans, Inter, sans-serif`

#### Scale
- **xs**: `0.75rem` (12px)
- **sm**: `0.875rem` (14px)
- **base**: `1rem` (16px)
- **lg**: `1.125rem` (18px)
- **xl**: `1.25rem` (20px)
- **2xl**: `1.5rem` (24px)
- **3xl**: `1.875rem` (30px)
- **4xl**: `2.25rem` (36px)
- **hero**: `3.5rem` (56px)

#### Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

---

## **Component Library Specification**

### Buttons

#### Primary Button
- **Style**: Solid background, rounded-lg, medium padding
- **States**: default, hover, active, loading, disabled
- **Variants**: small, medium, large, full-width
- **Animations**: Subtle scale on hover, loading spinner

#### Secondary Button
- **Style**: Border + transparent bg, same rounding
- **Interactions**: Hover fills with primary color

#### Web3 Connect Button
- **Style**: Special wallet connection styling
- **Features**: wallet icon, connection status, network indicator

### Cards

#### Campaign Card
- **Layout**: Image → Title → Progress → Stats → CTA
- **Features**:
  - Yield APY badge (prominent)
  - Funding progress bar
  - Live investor count
  - Days remaining countdown
  - Founder verification badge
- **Animations**: Gentle hover lift, progress bar fills

#### Stats Card
- **Variants**: yield-focused, funding-focused, performance-focused
- **Features**: Large number display, trend indicators, sparkline charts

### Inputs

#### Amount Input
- **Features**: USD/Token toggle, Max button, real-time validation
- **Styling**: Clean, prominent borders, clear labels

#### Search Bar
- **Features**: Instant search, filter tags, clear button
- **Placement**: Hero section, persistent in browse

---

## **Page Layouts & User Journey**

### Homepage

#### Hero Section
**Layout**: Split-screen with 3D visualization

**Left Side**:
- **Headline**: "Startup Capital That Works 24/7"
- **Subheadline**: "First fundraising platform where investments immediately generate 6% APY for everyone"
- **CTAs**: ["Browse Startups", "Create Campaign"]
- **Trust Indicators**: ["$XX raised", "XX startups funded", "6% guaranteed yield"]

**Right Side**:
- **Visual**: 3D animated yield vault visualization
- **Elements**: Floating coins, growth charts, yield counter

#### Value Propositions
**Section 1: How It Works**
1. **Invest in Startups**
   - Description: "Browse verified startups, invest with USDC"
   - Icon: 💼
   - Visual: Investment flow animation

2. **Earn 6% APY**
   - Description: "Capital immediately generates yield in secure vaults"
   - Icon: 📈
   - Visual: Yield counter animation

3. **Trade on Secondary**
   - Description: "Liquid equity markets after 180-day holding period"
   - Icon: 🔄
   - Visual: Trading interface preview

#### Featured Campaigns
- **Title**: "Featured Startups"
- **Layout**: Horizontal scroll cards
- **Filters**: ["All", "AI/ML", "FinTech", "Web3", "HealthTech"]

### Browse Page
- **Layout**: Filter sidebar + Card grid
- **Filters**:
  - **Categories**: Industry, Funding Stage, Min Investment, Yield Rate
  - **Advanced**: Verification Status, Days Remaining, Progress
- **Sorting**: Most Popular, Highest Yield, Ending Soon, Recently Added
- **Card Grid**: 1-4 columns responsive, infinite scroll

### Campaign Detail Page

#### Layout
Hero + Tab interface

#### Hero Section
- **Left**: Campaign media (images/video)
- **Right**: Investment panel with live stats

#### Investment Panel Components
- Current progress bar
- Live yield calculator
- Investment amount input
- Expected returns breakdown
- Invest button (Web3 connect if needed)

#### Tab Navigation
- Overview
- Team
- Financials
- Use of Funds
- Updates
- Community

---

## **Dashboard Specifications**

### Investor Dashboard

#### Overview Stats
1. **Total Invested**
   - Value: $XX,XXX
   - Trend: +XX% this month
   - Visual: Investment breakdown chart

2. **Total Yield Earned**
   - Value: $XXX
   - Trend: +$XX this week
   - Visual: Yield accumulation chart

3. **Portfolio Value**
   - Value: $XX,XXX
   - Trend: +XX% total return
   - Visual: Portfolio performance chart

#### Portfolio Section
- **Layout**: Table + Card views toggle
- **Columns**: Company, Invested, Current Value, Yield Earned, Actions
- **Actions**: Claim Yield, View Details, Sell on Market

#### Yield Center
- **Title**: "Yield Management"
- **Features**:
  - Claimable yield counter
  - Yield history chart
  - Auto-compound toggle
  - Claim all button

### Founder Dashboard

#### Campaign Overview KPIs
- Funds Raised vs Target
- Active Investors Count
- Yield Generated for Community
- Available for Withdrawal

#### Fund Management
**Withdrawal Section**:
- Monthly 2% limit visualization
- Available amount (large, prominent number)
- Withdrawal history timeline
- Withdraw button (disabled/enabled based on limits)

---

## **Web3 Integration Patterns**

### Wallet Connection

#### Connect Flow
- **Trigger**: Any investment or campaign creation action
- **Modal**: "Connect Your Wallet"
- **Options**:
  - MetaMask (browser wallet)
  - WalletConnect (mobile wallet with QR)
  - Coinbase Wallet

#### Connected State
- **Display**: Address + ENS name (if available)
- **Menu**: View Portfolio, Switch Network, Disconnect
- **Network Indicator**: Ethereum mainnet status

### Transaction Flows

#### Investment Process
1. Amount input with live USD conversion
2. USDC allowance approval (if needed)
3. Investment transaction confirmation
4. Success state with transaction link

**Loading States**: Clear progress indicators for each step

#### Yield Claim Process
- **Preview**: Shows claimable amount before transaction
- **One Click**: Single transaction to claim all yield
- **Confirmation**: Success with updated balance

---

## **3D Elements & Animations**

### 3D Visualizations

#### Hero Yield Vault
- **Concept**: Floating 3D vault with coins flowing in/out
- **Technology**: Three.js or React-Three-Fiber
- **Elements**:
  - Rotating vault cylinder
  - Animated USDC coins entering vault
  - Yield particles floating upward
  - Gentle glow effects
  - Responsive to scroll/mouse movement
- **Colors**: Primary gradient with gold accents for yield

#### Investment Flow 3D
- **Concept**: 3D pipeline showing money flow
- **Stages**: USDC input → Vault deposit → Yield generation
- **Visual**: Nodes connected by flowing lines
- **Animation**: Each stage animates on viewport entry

#### Portfolio Visualization
- **Concept**: 3D pie chart for portfolio breakdown
- **Interaction**: Hover to expand segments
- **Data**: Investment amounts per startup

### Micro-Interactions

#### Buttons
- **Hover**: Gentle scale + glow
- **Click**: Ripple effect
- **Loading**: Pulse animation

#### Cards
- **Hover**: Lift + shadow increase
- **Campaign Progress**: Progress bar fills with smooth easing
- **Yield Counter**: Numbers count up with spring animation

#### Page Transitions
- **Type**: Smooth slide transitions
- **Duration**: 300ms ease-out
- **Elements**: Stagger animations for lists

### Data Visualizations
- **Yield Charts**: Chart.js or D3.js with clean lines and gradient fills
- **Funding Progress**: Custom progress bars with gradient fills
- **Animations**: Draw-in animations on load

---

## **Mobile-First Design**

### Mobile Experience

#### Navigation
- **Type**: Bottom tab bar for main sections
- **Tabs**: Explore, Portfolio, Yield, Profile
- **Secondary**: Hamburger menu for additional options

#### Campaign Cards
- **Layout**: Full-width cards in mobile
- **Swipe**: Horizontal swipe between cards
- **CTA**: Prominent invest button

#### Investment Flow
- **Modal**: Full-screen modal for investment flow
- **Input**: Large, thumb-friendly inputs
- **Confirmation**: Clear step-by-step process

### Responsive Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

---

## **Technical Implementation Stack**

### Recommended Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Framer Motion
- **Web3**: wagmi + viem + ConnectKit
- **3D**: React Three Fiber + Drei
- **State**: Zustand for local state
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts or Chart.js
- **Deployment**: Vercel

### Key Libraries
- **Animations**: framer-motion for micro-interactions
- **3D Rendering**: @react-three/fiber, @react-three/drei
- **Web3 Integration**: @wagmi/core, connectkit
- **Styling**: tailwindcss, clsx, tailwind-merge
- **Utils**: date-fns, numeral, react-hot-toast

---

## **Content Strategy**

### Copywriting
- **Tone**: Confident, transparent, growth-focused

#### Headlines Options
- "Startup Capital That Works 24/7"
- "Where Investments Earn While They Grow"
- "Revolutionary Yield-Enhanced Fundraising"

#### Value Propositions
- 6% guaranteed yield on all investments
- Liquid equity markets after holding period
- Zero idle capital - every dollar works immediately
- Built-in founder accountability with withdrawal limits

### Trust Signals

#### Security
- Smart contract audited
- Non-custodial funds

#### Transparency
- Real-time yield tracking
- Open source contracts

#### Community
- $XX total raised
- XX successful campaigns

---

## **Implementation Phases**

### Phase 1: Core Infrastructure
- [ ] Design system setup
- [ ] Component library
- [ ] Basic layouts
- [ ] Web3 integration

### Phase 2: Core Features
- [ ] Campaign browsing
- [ ] Investment flow
- [ ] Dashboard basics
- [ ] Wallet connection

### Phase 3: Advanced Features
- [ ] 3D visualizations
- [ ] Advanced animations
- [ ] Secondary market UI
- [ ] Mobile optimization

### Phase 4: Polish & Performance
- [ ] Micro-interactions
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Testing & QA

---

*This specification serves as the complete design foundation for building a modern, engaging, and trustworthy frontend for the Fndr yield-enhanced fundraising platform.*