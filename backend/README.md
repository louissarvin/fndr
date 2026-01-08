# Fndr Backend - Blockchain Indexing & API Service

A sophisticated blockchain indexing backend for the Fndr decentralized startup fundraising platform, built with Ponder framework. It indexes on-chain events from Lisk Sepolia and provides GraphQL/SQL APIs with AI-powered investment analysis.

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
| FndrIdentity | `0xDC987dF013d655c8eEb89ACA2c14BdcFeEee850a` | User verification & roles |
| RoundFactory | `0x482DB11F63cC06CD5Fb56d54C942450871775c6B` | Funding round deployment |
| StartupSecondaryMarket | `0xF09216A363FC5D88E899aa92239B2eeB1913913B` | Equity token trading |
| RoundManager | Dynamic (via factory) | Individual round management |

**Network:** Lisk Sepolia (Chain ID: 4202)
**Start Block:** 31050043

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
| POST | `/api/ipfs/upload-file` | Upload images/PDFs to IPFS (5MB/100MB limits) |
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

### Pitch Deck Analysis
- PDF text extraction
- Structured analysis output:
  - Executive summary
  - Team assessment
  - Market size evaluation
  - Traction metrics
  - Competitive landscape
  - Red flags & risks
  - Investment recommendation

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
PONDER_RPC_URL_4202=https://lisk-sepolia.drpc.org
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
- `https://fndr-lisk.vercel.app` (Production)
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
