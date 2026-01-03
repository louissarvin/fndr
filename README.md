# Fndr - Decentralized Startup Fundraising Platform

A yield-enhanced startup fundraising platform combining tokenized equity with automatic 6% APY yield generation on invested capital. Built on Lisk Sepolia.

## Overview

Fndr transforms startup fundraising by solving three critical problems:

1. **Idle Capital** - Invested funds generate 6% APY while supporting startup growth
2. **Lack of Liquidity** - Secondary market trading after 180-day holding periods
3. **Compliance Complexity** - Built-in KYC via ZKPassport verification

### Key Features

- **Yield-Enhanced Capital**: Every dollar invested immediately generates 6% APY through ERC-4626 vault
- **Fair Distribution**: 50% yield to founders, 50% to investors (pro-rata by token holdings)
- **Tokenized Equity**: ERC-1400 security tokens with built-in compliance
- **Campaign Isolation**: Each startup gets dedicated contract infrastructure (RoundManager)
- **Secondary Market**: Post-holding period trading with order book system
- **ZKPassport Integration**: Privacy-preserving identity verification

## Project Structure

```
fndrv2/
├── contract/          # Smart contracts (Solidity/Foundry)
├── frontend/          # Web application (React/Vite/TypeScript)
├── backend/           # Ponder indexer + API services
└── README.md
```

## Smart Contracts

Built with Foundry and Solidity ^0.8.20.

| Contract | Description |
|----------|-------------|
| `RoundFactory.sol` | Deploy isolated fundraising campaigns |
| `RoundManager.sol` | Manage campaign lifecycle, investments, and yield distribution |
| `StartupEquityToken.sol` | ERC-1400 security tokens with compliance controls |
| `StartupSecondaryMarket.sol` | Order book for secondary trading |
| `FndrIdentity.sol` | User registration and ZKPassport verification |
| `MockUSDC.sol` | Test USDC token with airdrop functionality |
| `MockVault.sol` | ERC-4626 yield vault (6% APY simulation) |

### Contract Features

- Yield-enhanced fundraising (6% APY automatic)
- Campaign isolation (separate infrastructure per startup)
- Immutable 2% monthly withdrawal limits for founders
- 180-day holding period enforcement before trading
- 0.5% platform success fee on completed rounds
- 0.25% trading fee on secondary market transactions

## Deployments

### Lisk Sepolia (Chain ID: 4202)

| Contract | Address |
|----------|---------|
| MockUSDC | `0x96F14a42d612Ab1C69eF71E5Ee02c0267A9a45D3` |
| MockVault | `0xA24646C277Bd10AEb76e4086C6B6956aE2DB1321` |
| FndrIdentity | `0xDC987dF013d655c8eEb89ACA2c14BdcFeEee850a` |
| RoundFactory | `0x482DB11F63cC06CD5Fb56d54C942450871775c6B` |
| StartupSecondaryMarket | `0xF09216A363FC5D88E899aa92239B2eeB1913913B` |

**Explorer**: https://sepolia-blockscout.lisk.com

### Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://fndr-lisk.vercel.app |
| Backend (GraphQL) | https://fndr-lisk-production.up.railway.app/graphql |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Smart Contracts | Solidity + Foundry |
| Frontend | React + Vite + TypeScript + TailwindCSS |
| Backend/Indexer | Ponder + PostgreSQL |
| Web3 | Wagmi + Viem + WalletConnect |
| Identity | ZKPassport SDK |
| Storage | IPFS (Pinata) |
| Hosting | Vercel (Frontend) + Railway (Backend) |

## Quick Start

### Prerequisites

- Node.js 18+
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/louissarvin/fndr.git
cd fndr

# Install contract dependencies
cd contract
forge install

# Install frontend dependencies
cd ../frontend
pnpm install

# Install backend dependencies
cd ../backend
pnpm install
```

### Local Development

```bash
# Terminal 1: Start local blockchain
cd contract
anvil

# Terminal 2: Deploy contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Terminal 3: Start backend
cd backend
pnpm dev

# Terminal 4: Start frontend
cd frontend
pnpm dev
```

### Environment Variables

**Frontend** (`frontend/.env`):
```
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_BACKEND_API_URL=http://localhost:42069
```

**Backend** (`backend/.env`):
```
PONDER_RPC_URL_4202=https://lisk-sepolia.drpc.org
DATABASE_URL=your_postgres_url
DATABASE_SCHEMA=ponder
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=gateway.pinata.cloud
GROQ_API_KEY=your_groq_key
```

## Platform Economics

### Revenue Model

| Stream | Rate | Description |
|--------|------|-------------|
| Success Fee | 0.5% | On total funds raised at round completion |
| Trading Fee | 0.25% | Per secondary market transaction |

### Yield Distribution

```
Investment: $100K → Vault (6% APY = ~$500/month)
├── $250/month → Founder yield (50%)
└── $250/month → Investor yield (50%, pro-rata by tokens)
```

### Security Features

- **Immutable withdrawal limits** (2% monthly maximum)
- **Campaign isolation** (no cross-contamination between rounds)
- **ERC-1400 compliance** (regulatory ready security tokens)
- **Holding periods** (180 days before secondary trading)
- **Blacklist functionality** (bad actor protection)
- **ZKPassport verification** (privacy-preserving KYC)

## Testing

```bash
# Smart contract tests
cd contract
forge test -vv

# Run specific test
forge test --match-test testInvestment -vvv
```

## Deployment

### Deploy Contracts

```bash
cd contract

# Deploy to Lisk Sepolia
forge script script/Deploy.s.sol --rpc-url https://rpc.sepolia.lisk.com --broadcast

# Verify on Blockscout
forge verify-contract <ADDRESS> src/ContractName.sol:ContractName \
  --verifier blockscout \
  --verifier-url https://sepolia-blockscout.lisk.com/api/
```

### Deploy Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Set Root Directory: `frontend`
3. Add environment variables
4. Deploy

### Deploy Backend (Railway)

1. Create new project from GitHub
2. Set Root Directory: `backend`
3. Add environment variables including `DATABASE_SCHEMA=ponder`
4. Configure port to `8080`
5. Deploy

## API Endpoints

### GraphQL

```
POST /graphql

# Example query
query {
  rounds(orderBy: "createdAt", orderDirection: "desc") {
    items {
      id
      founder
      targetRaise
      totalRaised
      state
    }
  }
}
```

### IPFS Upload

```
POST /api/ipfs/upload-file    # Upload images/documents
POST /api/ipfs/upload-json    # Upload metadata JSON
GET  /api/ipfs/gateway        # Get IPFS gateway info
```

### ZKPassport

```
POST /api/zkpass/verify       # Verify ZKPassport proof
```

## License

MIT License

## Links

- **GitHub**: https://github.com/louissarvin/fndr
- **Frontend**: https://fndr-lisk.vercel.app
- **Explorer**: https://sepolia-blockscout.lisk.com

---

Built for the Lisk ecosystem
