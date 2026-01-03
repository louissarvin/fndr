# Fndr - Yield-Enhanced Startup Fundraising Platform

A revolutionary decentralized platform that transforms startup fundraising by combining tokenized equity with automatic yield generation on idle capital.

## 🎯 What We're Building

**Fndr** is the first platform where startup investments generate yield while supporting company growth. Instead of traditional fundraising where capital sits idle until withdrawn, Fndr automatically deposits investor funds into yield-generating vaults (6% APY) and distributes returns fairly between founders and investors.

### Core Innovation

- **Yield-Enhanced Capital**: Every dollar invested immediately starts generating 6% APY
- **Fair Yield Distribution**: 50% to founders, 50% to investors (pro-rata)
- **Tokenized Equity**: ERC-1400 security tokens representing startup ownership
- **Built-in Compliance**: Automated KYC/AML through FndrIdentity system
- **Secondary Market**: Post-holding period trading for investor liquidity
- **Campaign Isolation**: Each startup gets dedicated contract infrastructure

## 🏗️ Architecture Overview

### Core Contracts

| Contract | Purpose | Key Features |
|----------|---------|--------------|
| `CampaignFactory.sol` | Deploy isolated campaigns | Factory pattern, fee collection, campaign discovery |
| `CampaignManager.sol` | Manage campaign lifecycle | Investment handling, yield distribution, withdrawal controls |
| `StartupEquityToken.sol` | ERC-1400 security tokens | Compliance integration, transfer restrictions, partition support |
| `StartupSecondaryMarket.sol` | Secondary trading | Order book, holding period enforcement, market fees |
| `FndrIdentity.sol` | KYC/verification system | ZK-passport integration, role-based access control |
| `MockVault.sol` | Yield generation (testing) | ERC-4626 vault, 6% APY simulation |

### Campaign Isolation Design

```solidity
// Each startup gets its own isolated infrastructure
CampaignFactory → CampaignManager (per startup)
                ├── StartupEquityToken (company-specific)
                ├── Independent yield tracking
                ├── Isolated fund pools
                └── Separate compliance rules
```

**Benefits:**
- ✅ No cross-campaign fund contamination
- ✅ Independent governance per startup
- ✅ Isolated risk management
- ✅ Company-specific compliance rules

## 🔄 Platform Flow

### Phase 1: Infrastructure Deployment
```bash
# Deploy shared components
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

### Phase 2: Campaign Creation
```solidity
// Founder creates campaign (10 USDC fee)
CampaignFactory.CampaignConfig memory config = CampaignFactory.CampaignConfig({
    targetRaise: 500000 * 1e6,        // $500K target
    equityPercentage: 2000,           // 20% equity offered
    sharePrice: 5 * 1e6,              // $5 per token
    deadline: block.timestamp + 180 days,
    ipfsMetadata: "QmCompanyMetadata..." // Rich off-chain data
});

address campaignAddress = factory.createCampaign(config, "COMPANY");
```

### Phase 3: Investment & Automatic Yield
```solidity
// Investors contribute → automatic yield generation begins
CampaignManager campaign = CampaignManager(campaignAddress);
usdc.approve(campaignAddress, 10000 * 1e6);
campaign.invest(10000 * 1e6);

// Automatic process:
// 1. USDC → Yield Vault (6% APY)
// 2. Equity tokens minted to investor
// 3. Yield distribution starts (50/50 split)
// 4. Holding period initialized for secondary trading
```

### Phase 4: Campaign Management
```solidity
// Campaign completion (target reached or deadline)
campaign.state = CampaignState.COMPLETED;

// Founder withdrawals (2% monthly limit - immutable security feature)
uint256 maxWithdrawal = (vaultBalance * 200) / 10000; // 2% max
campaign.founderWithdraw(maxWithdrawal);

// Investor yield claiming
campaign.claimYield(); // Claims accumulated yield rewards
```

### Phase 5: Secondary Market Trading
```solidity
// After 180-day holding period
secondaryMarket.createSellOrder(tokenContract, amount, pricePerToken, duration);
secondaryMarket.buyTokens(orderId, amount);
```

## 💰 Revenue Model

| Revenue Stream | Rate | Description |
|----------------|------|-------------|
| Campaign Creation Fee | 10 USDC | One-time fee per campaign |
| Success Fee | 0.5% | Charged on total funds raised |
| Secondary Market Fee | 0.25% | Per trade transaction fee |

## 🛡️ Security Features

### Campaign Isolation
- ✅ Separate fund pools per startup
- ✅ Independent yield tracking
- ✅ Isolated compliance controls
- ✅ No cross-campaign interference

### Withdrawal Protection
- ✅ **Immutable 2% monthly withdrawal limit**
- ✅ Time-based withdrawal controls
- ✅ Yield-protected capital preservation
- ✅ Emergency controls for founder protection

### Compliance Integration
- ✅ ERC-1400 security token standard
- ✅ KYC/AML through FndrIdentity
- ✅ Transfer restrictions and whitelisting
- ✅ 180-day holding period enforcement
- ✅ Blacklist functionality for bad actors

## 📊 Yield Distribution Mechanics

```
Investment Flow:
Investor USDC → Yield Vault (6% APY) → Yield Generation

Yield Distribution (50/50 Split):
├── 50% → Founders (immediate access)
└── 50% → Investors (claimable, pro-rata by token holdings)

Example: $100K invested generating $500/month
├── $250/month → Founder yield
└── $250/month → Distributed among all investors
```

## 🧪 Testing

### Core Test Suites

```bash
# Complete integration flow
forge test --match-test testCompleteFlow -vv

# Yield distribution mechanics
forge test --match-test testYieldDistribution -vv

# Transfer restrictions & compliance
forge test --match-test testTransferRestrictions -vv

# Secondary market trading
forge test --match-test testSecondaryMarket -vv

# Run all tests
forge test -vv
```

### Test Scenarios Covered
- ✅ End-to-end campaign lifecycle
- ✅ Multi-investor yield distribution
- ✅ Withdrawal limit enforcement
- ✅ Transfer restriction compliance
- ✅ Secondary market trading flow
- ✅ Edge cases and error conditions

## 📁 Project Structure

```
fndr-contract/
├── src/
│   ├── CampaignFactory.sol      # Campaign deployment factory
│   ├── CampaignManager.sol      # Individual campaign management
│   ├── StartupEquityToken.sol   # ERC-1400 security tokens
│   ├── StartupSecondaryMarket.sol # Secondary trading platform
│   ├── FndrIdentity.sol         # KYC/verification system
│   └── MockVault.sol            # Yield generation (testing)
├── test/
│   ├── CoreFlow.t.sol           # Core platform functionality
│   ├── FullFlowIntegration.t.sol # End-to-end integration
│   ├── StartupEquityToken.t.sol # Token compliance tests
│   └── StartupSecondaryMarket.t.sol # Trading functionality
├── examples/
│   └── techstartup-metadata.json # Sample IPFS metadata
├── schemas/
│   └── campaign-metadata.json   # Metadata schema definition
└── docs/
    ├── ARCHITECTURE.md          # Technical architecture
    ├── IPFS_INTEGRATION.md     # IPFS metadata guide
    ├── SECONDARY_MARKET_INTEGRATION.md
    └── TESTING_GUIDE.md         # Comprehensive testing guide
```

## 🚀 Quick Start

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js 16+ (for IPFS integration)

### Installation
```bash
git clone <repository-url>
cd fndr-contract
forge install
```

### Development
```bash
# Build contracts
forge build

# Run tests
forge test

# Deploy locally
anvil # In separate terminal
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Environment Setup
```bash
# Create .env file
cp .env.example .env

# Configure variables
LISK_RPC=https://
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_api_key
```

## 🎨 IPFS Metadata Integration

Campaigns store rich metadata on IPFS while keeping on-chain data minimal:

```json
{
  "basic": {
    "companyName": "TechStartup Inc",
    "description": "Revolutionary AI platform...",
    "category": "AI/ML"
  },
  "team": [...],
  "roadmap": [...],
  "financials": {...},
  "useOfFunds": [...]
}
```

See `examples/techstartup-metadata.json` for complete schema.

## 🔍 Contract Addresses (Lisk Network)

| Contract | Address | Purpose |
|----------|---------|---------|
| CampaignFactory | `TBD` | Campaign deployment |
| FndrIdentity | `TBD` | User verification |
| SharedVault | `TBD` | Yield generation |
| SecondaryMarket | `TBD` | Token trading |

## 📚 Additional Documentation

- [Technical Architecture](./ARCHITECTURE.md) - Deep dive into contract design
- [IPFS Integration Guide](./IPFS_INTEGRATION.md) - Metadata management
- [Secondary Market Guide](./SECONDARY_MARKET_INTEGRATION.md) - Trading mechanics
- [Testing Guide](./TESTING_GUIDE.md) - Comprehensive test coverage
- [Withdrawal Rate Updates](./WITHDRAWAL_RATE_UPDATE.md) - Security mechanisms

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is provided "as is" without warranty. Smart contracts handle real value - audit thoroughly before mainnet deployment. The team is not responsible for any financial losses.

---

**Built with ❤️ for the decentralized future of startup funding**