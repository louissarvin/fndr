# Fndr Frontend - Yield-Enhanced Startup Investment Platform

A modern React-based Web3 application for decentralized startup fundraising with AI-powered investment analysis. Built with Vite, TypeScript, and Tailwind CSS.

## Overview

The Fndr frontend provides a seamless interface for founders to create funding rounds and investors to discover, analyze, and invest in startups while earning 6% APY on their capital. Features include ZK-passport identity verification, AI-powered investment insights, and a secondary market for trading equity tokens.

## Live Demo

**Production:** https://fndr.site

## Technology Stack

### Core
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.8.3 | Type Safety |
| Vite | 5.4.19 | Build Tool & Dev Server |
| Tailwind CSS | 3.4.17 | Styling |

### Web3
| Technology | Version | Purpose |
|------------|---------|---------|
| Wagmi | 2.19.5 | React Hooks for Ethereum |
| Viem | 2.41.2 | Blockchain Client |
| RainbowKit | 2.2.10 | Wallet Connection |
| ZKPassport SDK | 0.12.4 | Identity Verification |

### UI Components
| Technology | Version | Purpose |
|------------|---------|---------|
| Shadcn/ui | - | Component Library (Radix UI) |
| Lucide React | 0.462.0 | Icons |
| Recharts | 2.15.4 | Data Visualization |
| GSAP | 3.14.2 | Animations |
| Three.js | 0.160.1 | 3D Graphics |

### State & Data
| Technology | Version | Purpose |
|------------|---------|---------|
| TanStack React Query | 5.90.12 | Server State Management |
| React Hook Form | 7.61.1 | Form Handling |
| Zod | 3.25.76 | Validation |

## Features

### For Investors
- **Browse Campaigns**: Discover startup funding rounds with AI-powered credibility scoring
- **Invest with Yield**: Earn 6% APY on invested capital automatically
- **Portfolio Dashboard**: Track investments, claim yield, view performance
- **AI Analysis**: Get investment insights powered by Llama 3.3 70B
- **Secondary Market**: Trade equity tokens after 180-day holding period

### For Founders
- **Create Rounds**: Launch funding campaigns with custom parameters
- **Dashboard**: Monitor investments, investor count, and progress
- **Withdraw Capital**: Access funds with 2% monthly withdrawal limit
- **Profile Management**: Update company info stored on IPFS

### Platform Features
- **ZK-Passport Verification**: Privacy-preserving identity verification
- **IPFS Storage**: Decentralized metadata and document storage
- **Real-time Data**: Blockchain data indexed via Ponder GraphQL
- **Dark Mode**: Full dark theme support
- **Responsive Design**: Mobile-first approach
- **3D Visualizations**: Interactive Three.js scenes

## Smart Contracts Integration

| Contract | Address | Purpose |
|----------|---------|---------|
| MockUSDC | `0xc6C927c77D9BFaFb7b9e003db6D96F3605ba2514` | Platform stablecoin |
| MockVault | `0xE8163650f9e5bdAcd1e449f2fB70a5677bbA62ED` | Yield generation |
| FndrIdentity | `0x342F7e47E9F62cf1f0f1E0e62c9F7F641de114DE` | User verification |
| RoundFactory | `0x9D05244Bf4D091734da61e21396c74Cd92346E6f` | Round deployment |
| StartupSecondaryMarket | `0x7fB1E1C25F47acf921d9d89480586111dEf65CBb` | Token trading |

**Network:** Arbitrum Sepolia (Chain ID: 421614)

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── 3d/                   # Three.js 3D visualizations
│   │   ├── ai/                   # AI chat components
│   │   │   ├── AIChat.tsx        # Chat interface
│   │   │   └── AIContext.tsx     # AI state management
│   │   ├── campaigns/            # Campaign components
│   │   │   ├── RoundCard.tsx     # Campaign card
│   │   │   ├── CampaignDetailModal.tsx
│   │   │   └── FeaturedCampaigns.tsx
│   │   ├── founder/              # Founder components
│   │   │   ├── CreateRoundModal.tsx
│   │   │   ├── FounderHoverCard.tsx
│   │   │   └── FounderRoundCard.tsx
│   │   ├── investor/             # Investor components
│   │   │   └── InvestModal.tsx
│   │   ├── home/                 # Home page sections
│   │   ├── landing/              # Landing page components
│   │   ├── layout/               # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── marketplace/          # Secondary market
│   │   │   ├── IndexedBuyModal.tsx
│   │   │   ├── IndexedSellModal.tsx
│   │   │   └── MyOrders.tsx
│   │   ├── ui/                   # Shadcn components (50+)
│   │   └── wallet/               # Wallet components
│   │       ├── IdentityModal.tsx
│   │       └── FaucetModal.tsx
│   ├── hooks/
│   │   ├── useContracts.ts       # Smart contract hooks
│   │   ├── usePonderData.ts      # GraphQL data hooks
│   │   ├── useIPFS.ts            # IPFS integration
│   │   └── useZKPassportVerification.ts
│   ├── lib/
│   │   ├── contracts.ts          # Contract ABIs & addresses
│   │   ├── web3-config.ts        # Wagmi configuration
│   │   └── credibilityScore.ts   # Scoring algorithm
│   ├── pages/
│   │   ├── Chest.tsx             # Landing page
│   │   ├── Browse.tsx            # Campaign browser
│   │   ├── Portfolio.tsx         # Investment dashboard
│   │   ├── Marketplace.tsx       # Secondary market
│   │   └── FounderDashboard.tsx
│   └── App.tsx                   # Root component
├── public/                       # Static assets
├── tailwind.config.ts            # Tailwind configuration
├── vite.config.ts                # Vite configuration
└── package.json
```

## Key Components

### AI Integration
- **AIContext**: Global state for AI chat modes (round analysis, portfolio, comparison, price suggestions)
- **AIChat**: Full-featured chat interface with conversation history and markdown support

### Investment Flow
- **InvestModal**: Multi-step investment flow with USDC approval
- **RoundCard**: Campaign display with credibility scoring
- **CampaignDetailModal**: Full campaign information with pitch deck viewer

### Secondary Market
- **IndexedSellModal**: Create sell orders with AI price suggestions
- **IndexedBuyModal**: Purchase equity tokens from orders
- **MyOrders**: Manage active sell orders

### Identity Verification
- **IdentityModal**: ZK-passport verification and role selection flow
- **FaucetModal**: Testnet USDC distribution

## Credibility Scoring

Campaigns are scored 0-10 based on:

| Factor | Weight | Criteria |
|--------|--------|----------|
| Traction | 40% | Funding progress percentage |
| Social Proof | 35% | Number of investors |
| Deal Quality | 25% | Equity fairness vs raise amount |

**Labels:** Excellent (8+), Good (6-8), Fair (4-6), Risky (<4)

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended)

### Installation

```bash
cd frontend
pnpm install
```

### Environment Variables

Create a `.env` file:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_BACKEND_API_URL=http://localhost:42069  # or production URL
```

### Development

```bash
pnpm dev
```

The app runs on `http://localhost:8080`

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Custom Hooks

### Contract Interactions (`useContracts.ts`)

```typescript
// Identity checks
const { data: isVerified } = useIsVerifiedUser(address);
const { data: isFounder } = useIsFounder(address);
const { data: userRole } = useUserRole(address);

// Investment operations
const { writeContract: invest } = useInvest();
const { writeContract: claimYield } = useClaimYield();

// Token balances
const { data: balances } = useMultipleTokenBalances(address, tokenAddresses);
```

### GraphQL Data (`usePonderData.ts`)

```typescript
// Fetch rounds
const { data: rounds } = useRounds();

// Fetch user investments
const { data: investments } = useInvestorInvestments(address);

// Fetch active sell orders
const { data: orders } = useActiveSellOrders();

// Fetch recent trades
const { data: trades } = useRecentTrades();
```

## Styling

### Color Palette

| Color | Value | Usage |
|-------|-------|-------|
| Primary | `#5D54C0` | Buttons, links |
| Accent | `#1C4D8D` | Highlights, yield indicators |
| Background | `#000000` | Dark mode background |
| Foreground | `#FAFAFA` | Text on dark |

### Custom Colors
- `ethereum`: Blue tones for blockchain elements
- `defi`: Teal tones for DeFi features
- `yield`: Green tones for yield display
- `warning`: Yellow for warnings
- `success`: Green for success states

### Animations

Custom Tailwind animations:
- `fade-in-up`: Entry animation
- `float`: Floating elements
- `pulse-glow`: Attention indicators
- `spin-slow`: Loading states

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Chest | Main landing page |
| `/browse` | Browse | Campaign browser |
| `/create-campaign` | Browse | Create new round |
| `/campaign/:id` | Browse | Campaign details |
| `/portfolio` | Portfolio | Investment dashboard |
| `/dashboard` | Portfolio | Alias for portfolio |
| `/marketplace` | Marketplace | Secondary market |
| `/founder` | FounderDashboard | Founder management |

## Deployment

### Vercel (Recommended)

The app is configured for Vercel deployment with `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### Manual Deployment

```bash
pnpm build
# Deploy dist/ folder to any static hosting
```

## API Integration

### Backend GraphQL

The frontend queries the Ponder backend for indexed blockchain data:

```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:42069';

// GraphQL queries for rounds, investments, trades, orders
```

### IPFS

Metadata is stored on IPFS via Pinata:
- Round metadata (name, description, pitch deck)
- Founder profiles (bio, social links)

## License

MIT License

---

**Built for the decentralized future of startup funding**
