# Fndr Smart Contracts - Yield-Enhanced Startup Fundraising Protocol

A decentralized platform that transforms startup fundraising by combining tokenized equity with automatic yield generation on idle capital. Built on Arbitrum Sepolia.

## Overview

**Fndr** is the first platform where startup investments generate yield while supporting company growth. Instead of traditional fundraising where capital sits idle until withdrawn, Fndr automatically deposits investor funds into yield-generating vaults (6% APY) and distributes returns fairly between founders and investors.

### Core Innovation

- **Yield-Enhanced Capital**: Every dollar invested immediately starts generating 6% APY
- **Fair Yield Distribution**: 50% to founders, 50% to investors (pro-rata)
- **Tokenized Equity**: ERC-20 security tokens representing startup ownership
- **Built-in Compliance**: Automated KYC/AML through FndrIdentity system
- **Secondary Market**: Post-holding period trading for investor liquidity
- **Round Isolation**: Each startup gets dedicated contract infrastructure

## Deployed Contracts (Arbitrum Sepolia)

| Contract | Address | Purpose |
|----------|---------|---------|
| MockUSDC | `0xc6C927c77D9BFaFb7b9e003db6D96F3605ba2514` | Test stablecoin for transactions |
| MockVault | `0xE8163650f9e5bdAcd1e449f2fB70a5677bbA62ED` | ERC-4626 yield vault (6% APY) |
| FndrIdentity | `0x342F7e47E9F62cf1f0f1E0e62c9F7F641de114DE` | ZK-passport verification & roles |
| RoundFactory | `0x9D05244Bf4D091734da61e21396c74Cd92346E6f` | Funding round deployment factory |
| StartupSecondaryMarket | `0x7fB1E1C25F47acf921d9d89480586111dEf65CBb` | Equity token trading platform |

**Network:** Arbitrum Sepolia (Chain ID: 421614)
**Platform Wallet:** `0x564323aE0D8473103F3763814c5121Ca9e48004B`

## Smart Contract Architecture

### Contract Relationships

```
Deployment Flow:
MockUSDC (primary asset)
    ↓
MockVault (yields on USDC)
    ↓
FndrIdentity (user verification)
    ↓
StartupSecondaryMarket (needs Identity + USDC)
    ↓
RoundFactory (orchestrates ecosystem)
    ├── Creates RoundManager instances
    ├── Links Secondary Market
    └── Requires: USDC, Vault, Identity, SecondaryMarket

RoundManager (per-round instance)
    ├── Creates StartupEquityToken
    ├── Deposits to MockVault
    ├── Calls FndrIdentity for transfer checks
    └── Links to StartupSecondaryMarket
```

## Contract Functions

### 1. MockUSDC
Test stablecoin for platform transactions (6 decimals).

| Function | Description |
|----------|-------------|
| `airdrop()` | Claim 1,000 USDC for free (one-time per wallet) |
| `airdropCustom(amount)` | Claim custom amount up to 10,000 USDC |
| `mint(to, amount)` | Admin minting for specific addresses |
| `mintToMultiple(recipients[], amount)` | Batch minting to multiple wallets |

### 2. MockVault
ERC4626-compliant yield vault generating 6% APY.

| Function | Description |
|----------|-------------|
| `deposit(assets, receiver)` | Deposit USDC and receive yield-bearing shares |
| `withdraw(assets, receiver, owner)` | Withdraw USDC from the vault |
| `redeem(shares, receiver, owner)` | Burn shares to receive underlying USDC |
| `totalAssets()` | View total assets including accumulated yield |
| `convertToShares(assets)` | Calculate shares for a given USDC amount |
| `convertToAssets(shares)` | Calculate USDC value of shares |
| `getCurrentAPY()` | Returns current annual yield rate (6%) |

### 3. FndrIdentity
Decentralized identity using ZK-passport verification.

| Function | Description |
|----------|-------------|
| `registerZKPassportUser(uniqueIdentifier)` | Register with ZK passport proof |
| `registerUserRole(role)` | Register as Founder or Investor |
| `registerFounderWithProfile(metadataURI)` | Register as founder with profile metadata |
| `setFounderProfile(metadataURI)` | Update founder profile information |
| `isVerifiedUser(account)` | Check if wallet is ZK-verified |
| `isFounder(user)` | Check if user is a registered founder |
| `isInvestor(user)` | Check if user is a registered investor |
| `getUserRole(user)` | Get user's role (None/Founder/Investor) |
| `getFounderProfileURI(founder)` | Retrieve founder's profile metadata |

### 4. RoundFactory
Factory for creating isolated funding rounds.

| Function | Description |
|----------|-------------|
| `createRound(targetRaise, equityPercentage, sharePrice, deadline, companySymbol, metadataURI)` | Deploy a new funding round (10 USDC fee) |
| `getAllRounds()` | Get list of all deployed round addresses |
| `getRoundByFounder(founder)` | Find a founder's funding round |
| `getTotalRoundsCount()` | Get total rounds created |
| `markRoundInactive(roundAddress)` | Deactivate a completed round |

### 5. RoundManager (Per-Round Instance)
Manages individual funding round lifecycle.

| Function | Description |
|----------|-------------|
| `invest(amount)` | Invest USDC, receive equity tokens |
| `founderWithdraw(amount)` | Withdraw capital (2% monthly limit) |
| `claimYield()` | Claim accumulated yield rewards |
| `updateYield()` | Trigger yield distribution |
| `checkRoundState()` | Update round state |
| `getRoundInfo()` | Get round details (state, raised, withdrawn, tokens, investors, vault) |
| `getInvestorInfo(investor)` | Get investor's contribution, tokens, yield |
| `getYieldInfo()` | Get vault balance, total yield, APY |
| `canFounderWithdraw(amount)` | Check withdrawal eligibility |

### 6. StartupEquityToken (ERC-20)
Tokenized equity with compliance features.

| Function | Description |
|----------|-------------|
| `mintToInvestor(address, amount)` | Mint tokens during fundraising |
| `transfer(to, amount)` | Transfer with restrictions |
| `transferByPartition(partition, to, amount, data)` | ERC-1400 partition transfer |
| `addToWhitelist(address)` | Allow transfers to address |
| `addToBlacklist(address)` | Block address from transfers |
| `disableTransfers()` / `enableTransfers()` | Toggle transfer state |
| `canTransfer(to, amount, data)` | Check transfer eligibility |

### 7. StartupSecondaryMarket
Peer-to-peer marketplace for equity tokens.

| Function | Description |
|----------|-------------|
| `createSellOrder(tokenContract, amount, pricePerToken, durationHours)` | List tokens for sale |
| `buyTokens(orderId, amount)` | Purchase from sell order |
| `cancelSellOrder(orderId)` | Cancel and retrieve tokens |
| `getActiveOrdersForToken(tokenContract)` | Browse active listings |
| `getOrdersByPriceRange(tokenContract, minPrice, maxPrice)` | Filter by price |
| `getMarketSummary(tokenContract)` | Get market statistics |
| `canSellTokens(seller, tokenContract, amount)` | Check sell eligibility |
| `initializeHoldingPeriod(investor, tokenContract)` | Start holding period |

## Platform Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Yield APY | 6% | Annual yield on invested capital |
| Yield Split | 50/50 | Founder/Investor distribution |
| Round Creation Fee | 10 USDC | One-time fee per round |
| Success Fee | 0.5% (50 bps) | Fee on total funds raised |
| Trading Fee | 0.25% (25 bps) | Secondary market transaction fee |
| Withdrawal Limit | 2% monthly (200 bps) | **IMMUTABLE** founder withdrawal cap |
| Holding Period | 180 days | Before secondary market trading |
| Max Order Duration | 30 days | Secondary market order expiry |

## Platform Flow

### Phase 1: User Registration
```solidity
// Register with ZK Passport
fndrIdentity.registerZKPassportUser(uniqueIdentifier);

// Choose role
fndrIdentity.registerUserRole(UserRole.Founder); // or Investor
```

### Phase 2: Round Creation (Founders)
```solidity
// Approve creation fee
usdc.approve(roundFactoryAddress, 10 * 1e6);

// Create funding round
roundFactory.createRound(
    500000 * 1e6,        // $500K target
    2000,                // 20% equity (basis points)
    5 * 1e6,             // $5 per token
    block.timestamp + 180 days,
    "STARTUP",           // Token symbol
    "ipfs://QmMetadata..."
);
```

### Phase 3: Investment
```solidity
// Approve investment amount
usdc.approve(roundManagerAddress, 10000 * 1e6);

// Invest and receive equity tokens
roundManager.invest(10000 * 1e6);

// Automatic process:
// 1. USDC → Yield Vault (6% APY)
// 2. Equity tokens minted to investor
// 3. Yield distribution starts (50/50 split)
```

### Phase 4: Yield & Withdrawals
```solidity
// Founder withdraws capital (2% monthly limit)
roundManager.founderWithdraw(amount);

// Investor claims yield
roundManager.claimYield();
```

### Phase 5: Secondary Market (After 180 Days)
```solidity
// Approve tokens for sale
equityToken.approve(secondaryMarketAddress, amount);

// Create sell order
secondaryMarket.createSellOrder(
    tokenContractAddress,
    1000 * 1e18,         // Amount
    10 * 1e6,            // Price per token (USDC)
    168                  // Duration in hours (7 days)
);

// Buy tokens
usdc.approve(secondaryMarketAddress, totalPrice);
secondaryMarket.buyTokens(orderId, amount);
```

## Development

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Installation
```bash
cd contract
forge install
```

### Build
```bash
forge build
```

### Test
```bash
# Run all tests
forge test -vv

# Run specific test
forge test --match-test testCompleteFlow -vv

# Run with gas report
forge test --gas-report
```

### Deploy
```bash
# Deploy to Arbitrum Sepolia
forge script script/Deploy.s.sol --rpc-url https://sepolia-rollup.arbitrum.io/rpc --broadcast
```

## Project Structure

```
contract/
├── src/
│   ├── MockUSDC.sol              # Test stablecoin
│   ├── MockVault.sol             # ERC-4626 yield vault
│   ├── FndrIdentity.sol          # ZK-passport verification
│   ├── RoundFactory.sol          # Round deployment factory
│   ├── RoundManager.sol          # Individual round management
│   ├── StartupEquityToken.sol    # ERC-20 security tokens
│   └── StartupSecondaryMarket.sol # Secondary trading
├── test/
│   ├── CoreFlow.t.sol            # Core functionality tests
│   └── FullFlowIntegration.t.sol # End-to-end integration tests
├── script/
│   └── Deploy.s.sol              # Deployment script
├── examples/
│   └── techstartup-metadata.json # Sample IPFS metadata
├── schemas/
│   └── campaign-metadata.json    # Metadata schema
└── foundry.toml                  # Foundry configuration
```

## Security Features

- **Round Isolation**: Separate fund pools per startup
- **Immutable Withdrawal Limits**: 2% monthly cap cannot be changed
- **Transfer Restrictions**: Whitelist/blacklist with FndrIdentity verification
- **Holding Period Enforcement**: 180-day lock before secondary trading
- **ZK-Passport Verification**: Sybil-resistant identity system
- **Role-Based Access**: Founder/Investor permissions

## Yield Distribution Mechanics

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

## License

MIT License

---

**Built for the decentralized future of startup funding**
