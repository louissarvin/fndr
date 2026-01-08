# ZK Private Investment Identity - Implementation Plan

> **Project:** Fndr - Decentralized Startup Fundraising Platform
> **Feature:** Private Investment Identity
> **Status:** Planning
> **Created:** 2026-01-08

---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Solution Architecture](#solution-architecture)
4. [Cryptographic Primitives](#cryptographic-primitives)
5. [ZK Circuits](#zk-circuits)
6. [Smart Contract Changes](#smart-contract-changes)
7. [Backend Services](#backend-services)
8. [Frontend Integration](#frontend-integration)
9. [Implementation Phases](#implementation-phases)
10. [Technology Stack](#technology-stack)
11. [Security Considerations](#security-considerations)
12. [Gas Estimates](#gas-estimates)
13. [References](#references)

---

## Overview

### Goal

Transform Fndr from public investment tracking to **private investment identity** where:

| Data | Current | After Implementation |
|------|---------|---------------------|
| Total raised | Public | Public |
| Investor count | Public | Public |
| WHO invested | Public | **Private** |
| HOW MUCH each invested | Public | **Private** |
| Individual token balances | Public | **Private** |

### Value Proposition

- **Investor Privacy**: Whales and VCs can invest without being doxxed
- **Competitive Protection**: Competitors can't see who's backing whom
- **Regulatory Compliance**: KYC verified but privacy preserved
- **Market Differentiator**: First private equity crowdfunding platform

---

## Problem Statement

### Current Investment Flow (Public)

```solidity
// RoundManager.sol - Current Implementation

function invest(uint256 usdcAmount) external {
    // PROBLEM: All of this is PUBLIC
    round.investorContributions[msg.sender] = usdcAmount;  // Links address to amount
    round.investors.push(msg.sender);                       // Exposes investor list
    round.equityToken.mintToInvestor(msg.sender, tokens);  // Links address to holdings

    emit InvestmentMade(msg.sender, usdcAmount, tokens);   // Broadcasts everything
}
```

### What Anyone Can Query

```
// On-chain queries anyone can make:
round.investorContributions[0xAlice] → 50,000 USDC
round.investors[0] → 0xAlice
equityToken.balanceOf(0xAlice) → 500 tokens
```

### Privacy Requirements

```
MUST HIDE:
├── Investor addresses
├── Individual investment amounts
├── Token holder addresses
└── Individual token balances

MUST KEEP PUBLIC:
├── Total raised amount
├── Number of investors
├── Total tokens issued
└── Round metadata (target, equity %, deadline)

MUST BE PROVABLE:
├── "I am one of the N investors"
├── "I invested at least X amount" (for tiered access)
├── "I own tokens in this round" (for governance)
└── "I am entitled to Y yield" (for claims)
```

---

## Solution Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        SMART CONTRACTS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PrivateRoundManager.sol                                         │
│  ├── commitmentRoot: bytes32 (Merkle tree root)                 │
│  ├── commitmentCount: uint256                                    │
│  ├── nullifiers: mapping(bytes32 => bool)                       │
│  ├── invest(commitment, amount, proof)                          │
│  ├── claimTokens(proof, nullifier, recipient)                   │
│  └── verifyMembership(proof, publicInputs)                      │
│                                                                  │
│  IncrementalMerkleTree.sol (Library)                            │
│  ├── insert(leaf) → index                                       │
│  ├── getRoot() → bytes32                                        │
│  └── verify(proof, leaf, root) → bool                          │
│                                                                  │
│  ZKVerifier.sol (Generated from circuits)                       │
│  ├── verifyCommitmentProof(proof, publicInputs)                │
│  ├── verifyMembershipProof(proof, publicInputs)                │
│  └── verifyMinimumInvestmentProof(proof, publicInputs)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         ZK CIRCUITS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CommitmentCircuit.circom                                     │
│     Purpose: Prove commitment = hash(address, amount, salt)     │
│     Public:  commitment                                          │
│     Private: address, amount, salt                               │
│                                                                  │
│  2. MembershipCircuit.circom                                     │
│     Purpose: Prove "I am in the investor set"                   │
│     Public:  merkleRoot, nullifierHash                          │
│     Private: commitment, amount, salt, merklePath, pathIndices  │
│                                                                  │
│  3. MinimumInvestmentCircuit.circom                             │
│     Purpose: Prove "I invested >= threshold"                    │
│     Public:  merkleRoot, threshold, nullifierHash               │
│     Private: commitment, amount, salt, merklePath, pathIndices  │
│                                                                  │
│  4. TokenClaimCircuit.circom                                     │
│     Purpose: Prove ownership to claim tokens                    │
│     Public:  merkleRoot, nullifierHash, tokenAmount             │
│     Private: commitment, amount, salt, merklePath, sharePrice   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND SERVICES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Relayer Service (for full address privacy)                     │
│  ├── POST /api/private/invest                                   │
│  │   └── Receives encrypted intent, submits tx on behalf        │
│  ├── POST /api/private/claim                                    │
│  │   └── Submits token claim with ZK proof                      │
│  └── Meta-transaction support (gas abstraction)                 │
│                                                                  │
│  Proof Generation Service (optional - can be client-side)       │
│  ├── POST /api/zk/generate-commitment-proof                     │
│  ├── POST /api/zk/generate-membership-proof                     │
│  └── POST /api/zk/generate-claim-proof                          │
│                                                                  │
│  Commitment Indexer (extends Ponder)                            │
│  ├── Index commitment events                                    │
│  ├── Maintain off-chain Merkle tree mirror                      │
│  └── Provide Merkle proofs via API                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Client-Side ZK (WASM)                                          │
│  ├── Generate commitment locally                                │
│  ├── Generate ZK proofs in browser                              │
│  └── Manage salt storage (encrypted localStorage)               │
│                                                                  │
│  New Components                                                  │
│  ├── PrivateInvestmentFlow.tsx                                  │
│  ├── SaltBackupModal.tsx                                        │
│  ├── MembershipProofGenerator.tsx                               │
│  └── PrivateClaimInterface.tsx                                  │
│                                                                  │
│  Hooks                                                           │
│  ├── usePrivateInvestment.ts                                    │
│  ├── useZKProofs.ts                                             │
│  └── useSaltManager.ts                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagrams

#### Private Investment Flow

```
    INVESTOR                    RELAYER                    BLOCKCHAIN
        │                          │                           │
        │ 1. Generate locally:     │                           │
        │    salt = random()       │                           │
        │    commitment = Poseidon(│                           │
        │      address, amount,    │                           │
        │      salt)               │                           │
        │                          │                           │
        │ 2. Generate ZK proof     │                           │
        │    that commitment is    │                           │
        │    well-formed           │                           │
        │                          │                           │
        │ 3. Encrypt & send ──────►│                           │
        │    {commitment, amount,  │                           │
        │     proof, signature}    │                           │
        │                          │                           │
        │                          │ 4. Verify signature       │
        │                          │                           │
        │                          │ 5. Submit tx ────────────►│
        │                          │    invest(commitment,     │
        │                          │            amount, proof) │
        │                          │                           │
        │                          │                    6. Verify proof
        │                          │                    7. Transfer USDC
        │                          │                    8. Add to Merkle tree
        │                          │                    9. Emit CommitmentAdded
        │                          │                           │
        │                          │◄──────────────────────────│
        │◄─────────────────────────│       Confirmation        │
        │                          │                           │
        │ 10. Store salt locally   │                           │
        │     (encrypted backup)   │                           │
        │                          │                           │
```

#### Membership Proof Flow

```
    INVESTOR                                              VERIFIER
        │                                                     │
        │ 1. Load from local storage:                         │
        │    - salt                                           │
        │    - commitment                                     │
        │                                                     │
        │ 2. Fetch from indexer:                              │
        │    - Current Merkle root                            │
        │    - Merkle path for commitment                     │
        │                                                     │
        │ 3. Generate ZK proof:                               │
        │    Private inputs:                                  │
        │      - commitment                                   │
        │      - salt                                         │
        │      - amount                                       │
        │      - merkle_path                                  │
        │    Public inputs:                                   │
        │      - merkle_root                                  │
        │      - nullifier_hash                               │
        │                                                     │
        │ 4. Submit proof ───────────────────────────────────►│
        │                                                     │
        │                                    5. Verify on-chain:
        │                                       ZKVerifier.verify(
        │                                         proof,
        │                                         [root, nullifier]
        │                                       )
        │                                                     │
        │◄────────────────────────────────────────────────────│
        │    Result: "Valid investor"                         │
        │    (without knowing WHICH investor)                 │
        │                                                     │
```

#### Token Claim Flow

```
    INVESTOR                    CONTRACT                  TOKEN
        │                          │                        │
        │ 1. Generate claim proof: │                        │
        │    Proves:               │                        │
        │    - I know commitment   │                        │
        │    - Commitment in tree  │                        │
        │    - Entitled to X tokens│                        │
        │                          │                        │
        │ 2. Choose recipient:     │                        │
        │    (can be stealth addr) │                        │
        │                          │                        │
        │ 3. claimTokens(proof, ──►│                        │
        │    nullifier, recipient) │                        │
        │                          │                        │
        │                   4. Verify proof                  │
        │                   5. Check nullifier unused        │
        │                   6. Mark nullifier used           │
        │                          │                        │
        │                          │ 7. mint(recipient, ───►│
        │                          │        tokenAmount)     │
        │                          │                        │
        │◄─────────────────────────│◄───────────────────────│
        │    Tokens received at recipient                    │
        │    (unlinkable to original investor)              │
        │                          │                        │
```

---

## Cryptographic Primitives

### 1. Poseidon Hash Function

**Why Poseidon:**
- ZK-optimized (minimal constraints in circuits)
- Proven security
- Standard in Semaphore, Tornado Cash, etc.

**Usage:**
```
commitment = Poseidon(investor_address, amount, salt)
nullifier = Poseidon(commitment, action_type, nonce)
```

**Parameters:**
- Field: BN254 (same as Ethereum precompiles)
- Arity: 3 inputs for commitment, 2 for nullifier
- Rounds: Standard Poseidon configuration

### 2. Incremental Merkle Tree

**Structure:**
```
                        Root (depth 0)
                       /              \
                    H1                  H2         (depth 1)
                   /  \                /  \
                 H3    H4            H5    H6      (depth 2)
                / \    / \          / \    / \
               C1 C2  C3 C4       Z   Z   Z   Z   (depth 20 = leaves)

C = Commitment (filled)
Z = Zero value (empty)
```

**Properties:**
- Depth: 20 (supports 2^20 = 1,048,576 investors)
- Insert: O(depth) = O(20) hashes
- Proof size: 20 siblings + 20 path indices

**Gas Optimization:**
- Only store: root, nextIndex, filledSubtrees[depth]
- Don't store all leaves on-chain
- ~50,000 gas per insertion

### 3. Nullifier System

**Purpose:** Prevent double-spending without revealing identity

**Generation:**
```
// Different nullifiers for different actions
investment_nullifier = Poseidon(commitment, "invest", private_nonce)
claim_nullifier = Poseidon(commitment, "claim", private_nonce)
vote_nullifier = Poseidon(commitment, "vote", proposal_id)
```

**Properties:**
- Same commitment → different nullifiers per action
- Can't link nullifiers to each other
- Can't reverse nullifier to find commitment

### 4. ZK-SNARKs (Groth16)

**Why Groth16:**
- Smallest proof size (~200 bytes)
- Fast verification (~200k gas)
- Mature tooling (snarkjs, circom)

**Tradeoff:**
- Requires trusted setup ceremony
- Can use existing Powers of Tau + circuit-specific setup

---

## ZK Circuits

### Circuit 1: CommitmentCircuit.circom

**Purpose:** Prove a commitment is correctly formed

```circom
pragma circom 2.1.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

template CommitmentCircuit() {
    // Private inputs
    signal input address;        // Investor's Ethereum address (as field element)
    signal input amount;         // Investment amount in USDC (6 decimals)
    signal input salt;           // Random 256-bit salt

    // Public inputs
    signal input commitment;     // The commitment to verify

    // Constraints

    // 1. Verify commitment = Poseidon(address, amount, salt)
    component hasher = Poseidon(3);
    hasher.inputs[0] <== address;
    hasher.inputs[1] <== amount;
    hasher.inputs[2] <== salt;

    commitment === hasher.out;

    // 2. Amount must be positive
    component gtZero = GreaterThan(64);
    gtZero.in[0] <== amount;
    gtZero.in[1] <== 0;
    gtZero.out === 1;

    // 3. Amount must be <= MAX_INVESTMENT (e.g., 10M USDC)
    component ltMax = LessThan(64);
    ltMax.in[0] <== amount;
    ltMax.in[1] <== 10000000000000;  // 10M with 6 decimals
    ltMax.out === 1;
}

component main {public [commitment]} = CommitmentCircuit();
```

**Constraints:** ~500
**Proving time:** ~1 second

---

### Circuit 2: MembershipCircuit.circom

**Purpose:** Prove membership in investor set without revealing identity

```circom
pragma circom 2.1.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/mux1.circom";

template MembershipCircuit(levels) {
    // Private inputs
    signal input address;
    signal input amount;
    signal input salt;
    signal input pathElements[levels];    // Sibling hashes
    signal input pathIndices[levels];     // 0 = left, 1 = right
    signal input privateNonce;            // For nullifier derivation

    // Public inputs
    signal input merkleRoot;
    signal input nullifierHash;

    // Step 1: Compute commitment
    component commitmentHasher = Poseidon(3);
    commitmentHasher.inputs[0] <== address;
    commitmentHasher.inputs[1] <== amount;
    commitmentHasher.inputs[2] <== salt;
    signal commitment <== commitmentHasher.out;

    // Step 2: Verify Merkle path
    component merkleProof = MerkleTreeChecker(levels);
    merkleProof.leaf <== commitment;
    merkleProof.root <== merkleRoot;
    for (var i = 0; i < levels; i++) {
        merkleProof.pathElements[i] <== pathElements[i];
        merkleProof.pathIndices[i] <== pathIndices[i];
    }

    // Step 3: Compute and verify nullifier
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== commitment;
    nullifierHasher.inputs[1] <== privateNonce;
    nullifierHash === nullifierHasher.out;
}

// Merkle tree checker helper
template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component hashers[levels];
    component mux[levels];

    signal hashes[levels + 1];
    hashes[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        pathIndices[i] * (1 - pathIndices[i]) === 0;  // Must be 0 or 1

        hashers[i] = Poseidon(2);
        mux[i] = MultiMux1(2);

        mux[i].c[0][0] <== hashes[i];
        mux[i].c[0][1] <== pathElements[i];
        mux[i].c[1][0] <== pathElements[i];
        mux[i].c[1][1] <== hashes[i];
        mux[i].s <== pathIndices[i];

        hashers[i].inputs[0] <== mux[i].out[0];
        hashers[i].inputs[1] <== mux[i].out[1];

        hashes[i + 1] <== hashers[i].out;
    }

    root === hashes[levels];
}

component main {public [merkleRoot, nullifierHash]} = MembershipCircuit(20);
```

**Constraints:** ~15,000
**Proving time:** ~3-5 seconds

---

### Circuit 3: MinimumInvestmentCircuit.circom

**Purpose:** Prove investment >= threshold (for tiered access)

```circom
pragma circom 2.1.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

template MinimumInvestmentCircuit(levels) {
    // Private inputs
    signal input address;
    signal input amount;
    signal input salt;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal input privateNonce;

    // Public inputs
    signal input merkleRoot;
    signal input nullifierHash;
    signal input threshold;        // Minimum investment to prove

    // Include membership circuit logic
    component membership = MembershipCircuit(levels);
    membership.address <== address;
    membership.amount <== amount;
    membership.salt <== salt;
    membership.merkleRoot <== merkleRoot;
    membership.nullifierHash <== nullifierHash;
    membership.privateNonce <== privateNonce;
    for (var i = 0; i < levels; i++) {
        membership.pathElements[i] <== pathElements[i];
        membership.pathIndices[i] <== pathIndices[i];
    }

    // Additional constraint: amount >= threshold
    component gte = GreaterEqThan(64);
    gte.in[0] <== amount;
    gte.in[1] <== threshold;
    gte.out === 1;
}

component main {public [merkleRoot, nullifierHash, threshold]} = MinimumInvestmentCircuit(20);
```

**Constraints:** ~15,500
**Proving time:** ~3-5 seconds

---

### Circuit 4: TokenClaimCircuit.circom

**Purpose:** Prove entitlement to claim tokens

```circom
pragma circom 2.1.0;

include "node_modules/circomlib/circuits/poseidon.circom";

template TokenClaimCircuit(levels) {
    // Private inputs
    signal input address;
    signal input amount;           // USDC invested
    signal input salt;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal input sharePrice;       // USDC per token (from round config)

    // Public inputs
    signal input merkleRoot;
    signal input nullifierHash;
    signal input expectedTokens;   // Tokens to receive
    signal input roundSharePrice;  // Public share price for verification

    // Include membership verification
    component membership = MembershipCircuit(levels);
    membership.address <== address;
    membership.amount <== amount;
    membership.salt <== salt;
    membership.merkleRoot <== merkleRoot;
    membership.nullifierHash <== nullifierHash;
    for (var i = 0; i < levels; i++) {
        membership.pathElements[i] <== pathElements[i];
        membership.pathIndices[i] <== pathIndices[i];
    }

    // Verify share price matches
    sharePrice === roundSharePrice;

    // Verify token calculation: expectedTokens = amount / sharePrice
    signal computedTokens;
    computedTokens <== amount / sharePrice;  // Note: Integer division
    expectedTokens === computedTokens;
}

component main {public [merkleRoot, nullifierHash, expectedTokens, roundSharePrice]} = TokenClaimCircuit(20);
```

**Constraints:** ~16,000
**Proving time:** ~4-5 seconds

---

## Smart Contract Changes

### New Contract: PrivateRoundManager.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Key differences from current RoundManager:

contract PrivateRoundManager {
    // REMOVED: Public investor tracking
    // mapping(address => uint256) public investorContributions;  // REMOVED
    // address[] public investors;                                 // REMOVED

    // ADDED: Private commitment tracking
    bytes32 public commitmentRoot;
    uint256 public commitmentCount;
    mapping(bytes32 => bool) public nullifiers;

    // Merkle tree state (Incremental Merkle Tree)
    uint256 public constant TREE_DEPTH = 20;
    bytes32[TREE_DEPTH] public filledSubtrees;
    bytes32[TREE_DEPTH] public zeros;
    uint256 public nextIndex;

    // ZK Verifier reference
    IZKVerifier public immutable verifier;

    // Events - NO ADDRESSES exposed
    event CommitmentAdded(
        bytes32 indexed commitment,
        uint256 amount,
        uint256 leafIndex,
        bytes32 newRoot
    );

    event TokensClaimed(
        bytes32 indexed nullifier,
        address indexed recipient,  // Can be stealth address
        uint256 tokenAmount
    );

    // Private investment function
    function invest(
        bytes32 commitment,
        uint256 amount,
        bytes calldata proof
    ) external {
        // 1. Verify ZK proof that commitment is well-formed
        require(
            verifier.verifyCommitmentProof(proof, commitment),
            "Invalid commitment proof"
        );

        // 2. Transfer USDC (from relayer or user)
        usdc.transferFrom(msg.sender, address(this), amount);

        // 3. Deposit to yield vault
        usdc.approve(address(vault), amount);
        vault.deposit(amount, address(this));

        // 4. Insert commitment into Merkle tree
        uint256 leafIndex = _insert(commitment);

        // 5. Update totals (aggregate data stays public)
        totalRaised += amount;
        investorCount += 1;

        emit CommitmentAdded(commitment, amount, leafIndex, commitmentRoot);
    }

    // Claim tokens with ZK proof
    function claimTokens(
        bytes calldata proof,
        bytes32 nullifierHash,
        address recipient,
        uint256 tokenAmount
    ) external {
        // 1. Check nullifier not used
        require(!nullifiers[nullifierHash], "Already claimed");

        // 2. Verify ZK proof
        require(
            verifier.verifyClaimProof(
                proof,
                commitmentRoot,
                nullifierHash,
                tokenAmount,
                config.sharePrice
            ),
            "Invalid claim proof"
        );

        // 3. Mark nullifier as used
        nullifiers[nullifierHash] = true;

        // 4. Mint tokens to recipient (can be stealth address)
        equityToken.mintToInvestor(recipient, tokenAmount);

        emit TokensClaimed(nullifierHash, recipient, tokenAmount);
    }

    // Verify membership (for governance, tiered access, etc.)
    function verifyMembership(
        bytes calldata proof,
        bytes32 nullifierHash
    ) external view returns (bool) {
        return verifier.verifyMembershipProof(
            proof,
            commitmentRoot,
            nullifierHash
        );
    }

    // Internal: Insert into Merkle tree
    function _insert(bytes32 leaf) internal returns (uint256) {
        uint256 currentIndex = nextIndex;
        require(currentIndex < 2**TREE_DEPTH, "Tree full");

        bytes32 currentHash = leaf;

        for (uint256 i = 0; i < TREE_DEPTH; i++) {
            if (currentIndex % 2 == 0) {
                filledSubtrees[i] = currentHash;
                currentHash = _hashPair(currentHash, zeros[i]);
            } else {
                currentHash = _hashPair(filledSubtrees[i], currentHash);
            }
            currentIndex /= 2;
        }

        commitmentRoot = currentHash;
        nextIndex++;

        return nextIndex - 1;
    }

    function _hashPair(bytes32 left, bytes32 right) internal pure returns (bytes32) {
        // Poseidon hash (via precompile or library)
        return PoseidonT3.hash([left, right]);
    }
}
```

### New Contract: ZKVerifier.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Generated from circom circuits using snarkjs

interface IZKVerifier {
    function verifyCommitmentProof(
        bytes calldata proof,
        bytes32 commitment
    ) external view returns (bool);

    function verifyMembershipProof(
        bytes calldata proof,
        bytes32 merkleRoot,
        bytes32 nullifierHash
    ) external view returns (bool);

    function verifyMinimumInvestmentProof(
        bytes calldata proof,
        bytes32 merkleRoot,
        bytes32 nullifierHash,
        uint256 threshold
    ) external view returns (bool);

    function verifyClaimProof(
        bytes calldata proof,
        bytes32 merkleRoot,
        bytes32 nullifierHash,
        uint256 tokenAmount,
        uint256 sharePrice
    ) external view returns (bool);
}

// Actual verifier generated by:
// snarkjs zkey export solidityverifier circuit.zkey verifier.sol
```

### Modified: RoundFactory.sol

```solidity
// Changes needed:
// 1. Deploy PrivateRoundManager instead of RoundManager
// 2. Pass ZKVerifier address to constructor
// 3. No changes to factory pattern itself

function createRound(...) external returns (address) {
    // ... validation ...

    PrivateRoundManager newRound = new PrivateRoundManager(
        address(usdc),
        address(sharedYieldVault),
        config,
        companySymbol,
        msg.sender,
        address(identity),
        metadataURI,
        secondaryMarket,
        address(zkVerifier)  // NEW: ZK verifier
    );

    // ... rest same ...
}
```

---

## Backend Services

### 1. Relayer Service

**Purpose:** Submit transactions on behalf of users to hide their addresses

**File:** `backend/src/api/relayer.ts`

```typescript
// Endpoint: POST /api/private/invest
interface PrivateInvestRequest {
  commitment: string;           // bytes32
  amount: string;               // USDC amount
  proof: string;                // ZK proof bytes
  signature: string;            // User's signature authorizing relayer
  encryptedData?: string;       // Optional encrypted metadata
}

// Flow:
// 1. Receive encrypted/signed intent from user
// 2. Verify signature
// 3. Execute meta-transaction
// 4. Return tx hash

// Endpoint: POST /api/private/claim
interface PrivateClaimRequest {
  proof: string;
  nullifierHash: string;
  recipient: string;            // Can be stealth address
  tokenAmount: string;
  signature: string;
}
```

### 2. Merkle Tree Indexer

**Purpose:** Maintain off-chain copy of Merkle tree for proof generation

**File:** `backend/src/MerkleIndexer.ts`

```typescript
// Ponder event handler addition
// Listen to CommitmentAdded events
// Maintain full tree structure for generating proofs

interface MerkleTreeState {
  root: string;
  leaves: string[];              // All commitments
  nextIndex: number;
}

// API: GET /api/merkle/proof/:commitment
// Returns: Merkle proof (path + indices) for given commitment
```

### 3. Proof Generation API (Optional)

**Purpose:** Generate ZK proofs server-side for users without WASM support

**File:** `backend/src/api/proofs.ts`

```typescript
// Endpoint: POST /api/zk/membership-proof
interface MembershipProofRequest {
  commitment: string;
  salt: string;                 // Encrypted with user's key
  address: string;
  amount: string;
  roundAddress: string;
}

// Response:
interface MembershipProofResponse {
  proof: string;
  publicInputs: {
    merkleRoot: string;
    nullifierHash: string;
  };
}

// Note: For full privacy, proof generation should be client-side
// This is fallback for devices that can't run WASM
```

---

## Frontend Integration

### New Hooks

**File:** `frontend/src/hooks/usePrivateInvestment.ts`

```typescript
// Key functions:

function usePrivateInvestment(roundAddress: string) {
  // Generate commitment
  const generateCommitment = async (amount: bigint) => {
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const address = await getAccount();

    const commitment = poseidon([address, amount, salt]);

    // Store salt securely
    await storeSalt(roundAddress, commitment, salt);

    return { commitment, salt };
  };

  // Generate and submit investment
  const invest = async (amount: bigint) => {
    const { commitment, salt } = await generateCommitment(amount);

    // Generate ZK proof
    const proof = await generateCommitmentProof({
      address: await getAccount(),
      amount,
      salt,
      commitment
    });

    // Submit via relayer for full privacy
    // Or direct if partial privacy is acceptable
    await submitInvestment(commitment, amount, proof);
  };

  return { invest, generateCommitment };
}
```

**File:** `frontend/src/hooks/useZKProofs.ts`

```typescript
// WASM-based proof generation in browser

import { groth16 } from 'snarkjs';

async function generateMembershipProof(inputs: MembershipInputs) {
  const { proof, publicSignals } = await groth16.fullProve(
    {
      address: inputs.address,
      amount: inputs.amount,
      salt: inputs.salt,
      pathElements: inputs.merklePath,
      pathIndices: inputs.pathIndices,
      privateNonce: inputs.nonce
    },
    '/circuits/membership.wasm',
    '/circuits/membership.zkey'
  );

  return {
    proof: packProof(proof),
    merkleRoot: publicSignals[0],
    nullifierHash: publicSignals[1]
  };
}
```

**File:** `frontend/src/hooks/useSaltManager.ts`

```typescript
// Secure salt storage and backup

interface SaltEntry {
  roundAddress: string;
  commitment: string;
  salt: string;              // Encrypted
  timestamp: number;
}

function useSaltManager() {
  // Store salt (encrypted with user's wallet)
  const storeSalt = async (round: string, commitment: string, salt: Uint8Array) => {
    const encrypted = await encryptWithWallet(salt);
    localStorage.setItem(`fndr_salt_${commitment}`, JSON.stringify({
      roundAddress: round,
      commitment,
      salt: encrypted,
      timestamp: Date.now()
    }));
  };

  // Retrieve salt
  const getSalt = async (commitment: string): Promise<Uint8Array> => {
    const entry = localStorage.getItem(`fndr_salt_${commitment}`);
    if (!entry) throw new Error('Salt not found - cannot prove ownership');

    const { salt } = JSON.parse(entry);
    return await decryptWithWallet(salt);
  };

  // Export backup (user downloads encrypted file)
  const exportBackup = async () => {
    // Collect all salts, encrypt with password, download as file
  };

  // Import backup
  const importBackup = async (file: File, password: string) => {
    // Decrypt and restore salts to localStorage
  };

  return { storeSalt, getSalt, exportBackup, importBackup };
}
```

### New Components

**File:** `frontend/src/components/private/PrivateInvestFlow.tsx`

```typescript
// Multi-step investment flow:
// 1. Enter amount
// 2. Generate commitment (show progress)
// 3. Backup salt (CRITICAL - force user to acknowledge)
// 4. Submit investment
// 5. Confirmation
```

**File:** `frontend/src/components/private/SaltBackupModal.tsx`

```typescript
// CRITICAL UX component
// - Explain importance of salt backup
// - Provide download option
// - Show recovery phrase option
// - Require acknowledgment before proceeding
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

```
Tasks:
├── Set up Circom development environment
├── Implement CommitmentCircuit.circom
├── Generate verifier contract
├── Test commitment creation and verification
├── Create basic PrivateRoundManager contract
└── Unit tests for Merkle tree operations

Deliverables:
├── Working commitment circuit
├── Verifier.sol deployed to testnet
├── PrivateRoundManager with invest() function
└── Test suite passing

Dependencies:
├── circom ^2.1.0
├── snarkjs ^0.7.0
├── @zk-kit/incremental-merkle-tree
└── poseidon-lite (for contracts)
```

### Phase 2: Membership Proofs (Weeks 4-5)

```
Tasks:
├── Implement MembershipCircuit.circom
├── Implement MinimumInvestmentCircuit.circom
├── Add verifyMembership() to contracts
├── Build Merkle tree indexer (backend)
├── Create proof generation API
└── Integration tests

Deliverables:
├── Membership proof working end-to-end
├── Backend indexer deployed
├── API for Merkle proofs
└── Integration test suite
```

### Phase 3: Token Claims (Weeks 6-7)

```
Tasks:
├── Implement TokenClaimCircuit.circom
├── Add claimTokens() to contracts
├── Implement nullifier tracking
├── Stealth address generation (optional)
├── Frontend claim interface
└── Full flow testing

Deliverables:
├── Token claim working end-to-end
├── Nullifier system preventing double-claims
├── Frontend claim UI
└── E2E test suite
```

### Phase 4: Relayer & Privacy (Weeks 8-9)

```
Tasks:
├── Build relayer service
├── Meta-transaction support
├── Encrypted intent submission
├── Salt backup/restore system
├── Frontend integration
└── Privacy audit

Deliverables:
├── Relayer service deployed
├── Full address privacy working
├── Salt management UI
├── Privacy documentation
```

### Phase 5: Integration & Audit (Weeks 10-12)

```
Tasks:
├── Integration with existing Fndr contracts
├── Migration path for existing rounds (if needed)
├── Gas optimization
├── Security audit preparation
├── Documentation
├── Testnet deployment
└── Bug bounty program

Deliverables:
├── Production-ready contracts
├── Audit report
├── Complete documentation
├── Testnet live
```

---

## Technology Stack

### ZK Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| Circom | ^2.1.0 | Circuit compiler |
| snarkjs | ^0.7.0 | Proof generation/verification |
| circomlib | ^2.0.5 | Standard circuit library |
| @zk-kit/incremental-merkle-tree | ^1.0.0 | Merkle tree implementation |

### Smart Contracts

| Library | Purpose |
|---------|---------|
| poseidon-solidity | On-chain Poseidon hash |
| @openzeppelin/merkle-tree | Merkle utilities |

### Frontend

| Library | Purpose |
|---------|---------|
| snarkjs (WASM) | Browser proof generation |
| @noble/hashes | Cryptographic primitives |

### Backend

| Service | Purpose |
|---------|---------|
| Ponder | Event indexing |
| Hono | API framework |
| PostgreSQL | Tree state storage |

---

## Security Considerations

### Critical Security Points

#### 1. Salt Storage

```
RISK: If user loses salt, they lose access to their investment
MITIGATION:
├── Encrypted local storage
├── Mandatory backup prompt before investing
├── Recovery phrase option (BIP39 derivation)
├── Cloud backup option (encrypted)
└── Warning banners throughout UI
```

#### 2. Trusted Setup

```
RISK: Compromised setup = fake proofs possible
MITIGATION:
├── Use existing Powers of Tau ceremony (Hermez)
├── Circuit-specific Phase 2 ceremony
├── Multiple independent contributors
└── Publish ceremony transcript
```

#### 3. Relayer Trust

```
RISK: Relayer sees investment intent before submission
MITIGATION:
├── Relayer cannot steal funds (signature required)
├── Multiple relayer options
├── Relayer reputation system
├── Self-relay option for paranoid users
└── No logging of sensitive data
```

#### 4. Nullifier Derivation

```
RISK: Predictable nullifiers = linkability
MITIGATION:
├── Use private nonce in nullifier
├── Different nullifiers per action type
├── Secure random nonce generation
└── Nonce stored with salt
```

#### 5. Merkle Tree Timing

```
RISK: Insertion order reveals timing = potential linkability
MITIGATION:
├── Batch insertions (every N minutes)
├── Random delay before insertion
├── Multiple simultaneous insertions
└── Note: Partial mitigation only
```

### Audit Checklist

```
□ Circuit constraints are complete (no under-constrained signals)
□ Nullifier cannot be predicted or reversed
□ Merkle tree implementation matches circuit expectations
□ No integer overflow in amount calculations
□ Salt entropy is sufficient (256 bits)
□ Proof verification cannot be bypassed
□ Double-spend prevention is complete
□ Gas limits cannot cause DoS
□ Relayer cannot front-run or censor
□ Recovery mechanisms don't leak privacy
```

---

## Gas Estimates

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| invest() with ZK proof | ~400,000 | Includes Merkle insert + verify |
| claimTokens() with ZK proof | ~350,000 | Includes verify + mint |
| verifyMembership() | ~250,000 | View function if off-chain |
| Merkle tree insert | ~50,000 | Per level update |
| SNARK verification | ~200,000 | Groth16 pairing check |

**Comparison to current:**
- Current invest(): ~150,000 gas
- Private invest(): ~400,000 gas
- Overhead: ~250,000 gas (~$0.50 at 20 gwei on Mantle)

---

## References

### Existing Implementations to Study

1. **Semaphore** - Anonymous signaling protocol
   - GitHub: https://github.com/semaphore-protocol/semaphore
   - Relevant: Membership proofs, nullifiers

2. **Tornado Cash (archived)** - Private transactions
   - Relevant: Commitment/nullifier pattern, Merkle trees

3. **Railgun** - Private DeFi
   - Relevant: Private token transfers

4. **Aztec** - Private L2
   - Relevant: Note-based model

### Documentation

- Circom docs: https://docs.circom.io/
- snarkjs: https://github.com/iden3/snarkjs
- Poseidon hash: https://www.poseidon-hash.info/
- EIP-5564 (Stealth Addresses): https://eips.ethereum.org/EIPS/eip-5564

### Academic Papers

- Groth16: https://eprint.iacr.org/2016/260
- Poseidon: https://eprint.iacr.org/2019/458

---

## File Structure (Target)

```
fndrv2/
├── contract/
│   └── src/
│       ├── private/
│       │   ├── PrivateRoundManager.sol
│       │   ├── PrivateRoundFactory.sol
│       │   ├── IncrementalMerkleTree.sol
│       │   └── verifiers/
│       │       ├── CommitmentVerifier.sol
│       │       ├── MembershipVerifier.sol
│       │       ├── MinInvestmentVerifier.sol
│       │       └── ClaimVerifier.sol
│       └── ... (existing contracts)
│
├── circuits/
│   ├── commitment.circom
│   ├── membership.circom
│   ├── minInvestment.circom
│   ├── claim.circom
│   ├── lib/
│   │   └── merkleTree.circom
│   ├── build/          (generated)
│   │   ├── *.wasm
│   │   ├── *.zkey
│   │   └── *.vkey
│   └── scripts/
│       ├── compile.sh
│       ├── setup.sh
│       └── generateVerifier.sh
│
├── backend/
│   └── src/
│       ├── api/
│       │   ├── relayer.ts
│       │   └── proofs.ts
│       ├── indexers/
│       │   └── merkleTree.ts
│       └── ... (existing)
│
├── frontend/
│   └── src/
│       ├── hooks/
│       │   ├── usePrivateInvestment.ts
│       │   ├── useZKProofs.ts
│       │   └── useSaltManager.ts
│       ├── components/
│       │   └── private/
│       │       ├── PrivateInvestFlow.tsx
│       │       ├── SaltBackupModal.tsx
│       │       ├── MembershipProver.tsx
│       │       └── TokenClaimer.tsx
│       └── ... (existing)
│
└── ZK_WORK.md          (this file)
```

---

## Next Steps

1. **Immediate:** Set up Circom development environment
2. **Week 1:** Implement and test CommitmentCircuit
3. **Week 2:** Deploy basic PrivateRoundManager to testnet
4. **Week 3:** Build frontend proof generation

---

*Last Updated: 2026-01-08*
*Status: Planning Complete - Ready for Implementation*
