# Fndr - Decentralized Startup Fundraising Ecosystem

🚀 **Revolutionary yield-enhanced startup fundraising platform combining tokenized equity with automatic 6% APY yield generation on invested capital.**

## 🎯 What Is Fndr?

Fndr transforms startup fundraising by solving three critical problems:
1. **Idle Capital** - Invested funds generate 6% APY while supporting startup growth
2. **Lack of Liquidity** - Secondary market trading after holding periods
3. **Compliance Complexity** - Built-in KYC/AML and regulatory compliance

### Core Innovation
- ⚡ **Yield-Enhanced Capital**: Every dollar invested immediately generates 6% APY
- 🤝 **Fair Distribution**: 50% yield to founders, 50% to investors (pro-rata)
- 🏛️ **Tokenized Equity**: ERC-1400 security tokens with built-in compliance
- 🔒 **Campaign Isolation**: Each startup gets dedicated contract infrastructure
- 💱 **Secondary Market**: Post-holding period trading for investor exits

## 🏗️ Monorepo Structure

```
fndr/
├── contracts/                   # Smart contracts (Solidity/Foundry)
├── frontend/                   # Web application (React/Next.js)
├── backend/                    # API services (Node.js/Express)
└── README.md                   # This file
```

## 📦 Packages

### 🔗 Smart Contracts (`./contracts/`)
Core blockchain infrastructure built with Foundry and Solidity.

**Key Contracts:**
- `RoundFactory.sol` - Deploy isolated fundraising campaigns
- `RoundManager.sol` - Manage campaign lifecycle and yield distribution
- `StartupEquityToken.sol` - ERC-1400 security tokens with compliance
- `StartupSecondaryMarket.sol` - Order book for secondary trading
- `FndrIdentity.sol` - KYC/verification system

**Features:**
- ✅ Yield-enhanced fundraising (6% APY automatic)
- ✅ Campaign isolation (separate infrastructure per startup)
- ✅ Immutable 2% monthly withdrawal limits
- ✅ ERC-1400 security token compliance
- ✅ 180-day holding period enforcement
- ✅ Secondary market with order book

### 🌐 Frontend Application (`./frontend/`)
Modern React/Next.js web application for founders and investors.

**Features:**
- Round creation and management dashboard
- Investment flow with yield tracking
- Secondary market trading interface
- Real-time yield distribution analytics
- ZK-KYC/verification integration

### ⚙️ Backend Services (`./backend/`)
Node.js/Express API services supporting the platform.

**Services:**
- IPFS metadata management
- Email notifications and alerts
- Analytics and reporting
- Admin dashboard APIs
- Integration webhooks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/louissarvin/Fndr.git
cd Fndr

# Install smart contracts dependencies
cd contract
forge install

# Install frontend dependencies
cd ../frontend
bun install

# Install backend dependencies
cd ../backend
pnpm install

```

### Development Setup
```bash
# Terminal 1: Start local blockchain
cd fndr-contract
anvil

# Terminal 2: Deploy contracts locally
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Terminal 3: Start backend services
cd backend
pnpm run dev

# Terminal 4: Start frontend application
cd frontend
bun run dev
```

## 📊 Platform Metrics

### Revenue Model
| Stream | Rate | Description |
|--------|------|-------------|
| Campaign Creation | 10 USDC | One-time fee per startup |
| Success Fee | 0.5% | On total funds raised |
| Trading Fee | 0.25% | Per secondary market transaction |

### Yield Distribution
```
Investment Example: $100K → Vault (6% APY = $500/month)
├── $250/month → Founder yield (50%)
└── $250/month → Investor yield (50%, pro-rata)
```

### Security Features
- 🔒 **Immutable withdrawal limits** (2% monthly maximum)
- 🏛️ **Campaign isolation** (no cross-contamination)
- ✅ **ERC-1400 compliance** (regulatory ready)
- 🕐 **Holding periods** (180 days before trading)
- 🚫 **Blacklist functionality** (bad actor protection)

## 🧪 Testing

```bash
# Smart contracts
cd fndr-contract
forge test -vv

# Frontend
cd frontend
bun test

# Backend
cd backend
pnpm test

# Integration tests
npm run test:integration
```

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Smart Contracts | Solidity + Foundry | Core platform logic |
| Frontend | React + Next.js + TypeScript | User interface |
| Backend | Node.js + Express + TypeScript | API services |
| Database | PostgreSQL + Prisma | Data persistence |
| IPFS | Pinata/Web3.Storage | Metadata storage |
| Authentication | Privy/WalletConnect | Web3 auth |
| Notifications | Resend/SendGrid | Email services |

## 📚 Documentation

- [Smart Contracts Documentation](./contracts/README.md)
- [Frontend Setup Guide](./frontend/README.md)
- [Backend API Reference](./backend/README.md)
- [SDK Documentation](./sdk/README.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing Guidelines](./docs/CONTRIBUTING.md)

## 🌐 Deployments

### Mainnet (Production)
- **Network**: Mantle Network
- **Status**: Coming Soon
- **Frontend**: `https://fndr.site`

### Testnet - Mantle Sepolia
- **Network**: Mantle Sepolia (Chain ID: 5003)
- **MockUSDC**: `0xc6C927c77D9BFaFb7b9e003db6D96F3605ba2514`
- **MockVault**: `0xE8163650f9e5bdAcd1e449f2fB70a5677bbA62ED`
- **FndrIdentity**: `0x342F7e47E9F62cf1f0f1E0e62c9F7F641de114DE`
- **RoundFactory**: `0x9D05244Bf4D091734da61e21396c74Cd92346E6f`
- **StartupSecondaryMarket**: `0x7fB1E1C25F47acf921d9d89480586111dEf65CBb`
- **Frontend**: `https://fndr.site`

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./docs/CONTRIBUTING.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Security Notice

This software handles real financial value. All smart contracts should be thoroughly audited before mainnet deployment. The team is not responsible for any financial losses.

## 🔗 Links

- **Website**: [fndr.app](https://fndr.site)

---

**Built with ❤️ for the decentralized future of startup funding**