# Fndr Backend - Blockchain Indexing & API Service

A sophisticated blockchain indexing backend for the Fndr decentralized startup fundraising platform, built with Ponder framework. It indexes on-chain events from Mantle Sepolia and provides GraphQL/SQL APIs with AI-powered investment analysis.

## Overview

The backend serves as the data layer for Fndr, transforming raw blockchain events into queryable, structured data. It combines real-time event processing, AI-powered analysis via Groq's Llama 3.3 70B, and decentralized storage through IPFS/Pinata.

## Technology Stack

| Category | Technology |
|----------|------------|
| **Indexing Framework** | Ponder v0.15.17 |
| **Web Framework** | Hono v4.5.0 |
| **Language** | TypeScript 5.3.2 |
| **Blockchain Client** | Viem 2.21.3 |
| **AI Provider** | Groq SDK (Llama 3.3 70B) |
| **File Storage** | Pinata (IPFS) |
| **Identity** | ZKPassport SDK v0.12.4 |
| **Database** | SQLite (dev) / PostgreSQL (prod) |

## Smart Contracts Indexed

| Contract | Address | Purpose |
|----------|---------|---------|
| FndrIdentity | `0x342F7e47E9F62cf1f0f1E0e62c9F7F641de114DE` | User verification & roles |
| RoundFactory | `0x9D05244Bf4D091734da61e21396c74Cd92346E6f` | Funding round deployment |
| StartupSecondaryMarket | `0x7fB1E1C25F47acf921d9d89480586111dEf65CBb` | Equity token trading |
| RoundManager | Dynamic (via factory) | Individual round management |

**Network:** Mantle Sepolia (Chain ID: 5003)
**Start Block:** 32935200

## Data Schema

### Core Tables

```
user                 - User accounts with ZK verification status & roles
founderProfile       - Founder metadata stored on IPFS
round                - Funding rounds (status: Fundraising/Completed/Cancelled)
investment           - Individual investments in rounds
withdrawal           - Founder fund withdrawals
yieldClaim           - Investor yield claims
yieldDistribution    - Yield splits per round (50/50 founder/investor)
sellOrder            - Secondary market sell orders
trade                - Executed trades between buyers/sellers
platformStats        - Aggregated platform metrics
```

### Events Indexed

| Contract | Events |
|----------|--------|
| FndrIdentity | `UserRoleRegistered`, `ZKPassportVerified`, `FounderProfileUpdated` |
| RoundFactory | `RoundDeployed` |
| RoundManager | `RoundCreated`, `InvestmentMade`, `RoundCompleted`, `FounderWithdrawal`, `InvestorYieldClaimed`, `YieldDistributed` |
| StartupSecondaryMarket | `OrderCreated`, `OrderExecuted`, `OrderCancelled` |

## API Endpoints

### GraphQL & SQL
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/graphql` | GraphQL API for querying indexed data |
| GET/POST | `/sql/*` | Direct SQL queries |

### ZK Passport Verification
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/zkpass/verify` | Verify ZK Passport proofs |

### IPFS File Management
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ipfs/upload-file` | Upload images (5MB) / PDFs (10MB) to IPFS |
| POST | `/api/ipfs/upload-json` | Upload JSON metadata to IPFS |
| GET | `/api/ipfs/gateway` | Get IPFS gateway information |

### AI Analysis
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/chat` | AI investment analysis chat |
| POST | `/api/ai/analyze-pitchdeck` | AI pitch deck analysis with PDF parsing |

## AI Features

### Investment Analysis Chat
- Traction score calculation
- Deal quality evaluation (equity % vs raise amount)
- Portfolio diversification recommendations
- Implied valuation calculations
- Conversation history support
- Risk scoring matrix

### Pitch Deck Analysis
- PDF text extraction from IPFS
- Structured analysis output:
  - Executive summary
  - Team assessment
  - Market size evaluation
  - Traction metrics
  - Competitive landscape
  - Red flags & risks
  - Investment recommendation (10-point scale)

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm

### Installation

```bash
cd backend
pnpm install
```

### Environment Variables

Create a `.env` file:

```env
# Required
PONDER_RPC_URL_5003=https://rpc.sepolia.mantle.xyz
PINATA_JWT=your_pinata_jwt_token
GROQ_API_KEY=your_groq_api_key

# Optional
DATABASE_URL=postgresql://...  # Uses SQLite by default
```

### Development

```bash
# Start the indexer and API server
pnpm dev
```

The server runs on `http://localhost:42069` by default.

### Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Event handlers for blockchain indexing
│   └── api/
│       └── index.ts          # Hono API routes (ZK, IPFS, AI)
├── abis/                     # Contract ABIs
├── generated/                # Auto-generated types from Ponder
├── ponder.config.ts          # Ponder configuration (contracts, networks)
├── ponder.schema.ts          # Database schema definitions
├── package.json
└── tsconfig.json
```

## CORS Configuration

Allowed origins:
- `https://fndr.site` (Production)
- `http://localhost:5173` (Development)
- `http://localhost:8080` (Development)
- `http://localhost:3000` (Development)

## Platform Parameters

| Parameter | Value |
|-----------|-------|
| Yield APY | 6% |
| Yield Split | 50% Founder / 50% Investors |
| Round Creation Fee | 10 USDC |
| Success Fee | 0.5% |
| Secondary Market Fee | 0.25% |
| Holding Period | 180 days |

## GraphQL Query Examples

### Get All Rounds
```graphql
query {
  rounds {
    items {
      id
      founder
      targetRaise
      totalRaised
      status
      equityPercentage
      investorCount
    }
  }
}
```

### Get User Investments
```graphql
query($investor: String!) {
  investments(where: { investor: $investor }) {
    items {
      round { id }
      amount
      tokensReceived
      timestamp
    }
  }
}
```

### Get Active Sell Orders
```graphql
query {
  sellOrders(where: { active: true }) {
    items {
      orderId
      seller
      tokenContract
      amount
      pricePerToken
      expiryTime
    }
  }
}
```

## License

MIT License
