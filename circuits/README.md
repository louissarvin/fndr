# Fndr ZK Circuits

Zero-Knowledge circuits for private investment identity on Fndr.

## Overview

These circuits enable investors to prove membership and investment details without revealing their identity.

| Circuit | Purpose | Public Inputs |
|---------|---------|---------------|
| `commitment.circom` | Prove commitment is well-formed | commitment |
| `membership.circom` | Prove "I am an investor" | merkleRoot, nullifierHash |
| `minInvestment.circom` | Prove "I invested >= X" | merkleRoot, nullifierHash, threshold |
| `claim.circom` | Prove token entitlement | merkleRoot, nullifierHash, expectedTokens, sharePrice |

## Prerequisites

- **Circom** 2.1.0+ - Circuit compiler
- **snarkjs** 0.7.0+ - Proof generation and verification
- **Node.js** 18+ - For dependencies

### Install Circom

```bash
# Install Rust (if not installed)
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh

# Install Circom
cargo install --git https://github.com/iden3/circom.git

# Verify installation
circom --version
```

### Install snarkjs

```bash
npm install -g snarkjs
snarkjs --version
```

## Quick Start

```bash
# 1. Install dependencies
cd circuits
npm install

# 2. Compile all circuits
./scripts/compile.sh all

# 3. Setup proving keys (downloads ~1GB Powers of Tau)
./scripts/setup.sh all

# 4. Generate Solidity verifiers
./scripts/generateVerifiers.sh
```

## Directory Structure

```
circuits/
├── commitment.circom      # Commitment proof circuit
├── membership.circom      # Membership proof circuit
├── minInvestment.circom   # Minimum investment proof circuit
├── claim.circom           # Token claim proof circuit
├── lib/
│   └── merkleTree.circom  # Shared Merkle tree utilities
├── build/                 # Compiled outputs (generated)
│   ├── commitment/
│   │   ├── commitment.r1cs
│   │   ├── commitment_js/commitment.wasm
│   │   ├── commitment_final.zkey
│   │   └── commitment_verification_key.json
│   ├── membership/
│   ├── minInvestment/
│   ├── claim/
│   ├── ptau/              # Powers of Tau ceremony files
│   └── verifiers/         # Generated Solidity contracts
├── scripts/
│   ├── compile.sh         # Compile circuits
│   ├── setup.sh           # Generate proving keys
│   └── generateVerifiers.sh
├── test/                  # Circuit tests
├── package.json
└── README.md
```

## Circuits Detail

### 1. Commitment Circuit

Proves knowledge of `(address, amount, salt)` that hash to a commitment.

```
Public:  commitment
Private: address, amount, salt

Constraints: ~500
Proving time: ~1 second
```

### 2. Membership Circuit

Proves the prover knows a commitment in the Merkle tree without revealing which one.

```
Public:  merkleRoot, nullifierHash
Private: address, amount, salt, pathElements[20], pathIndices[20], privateNonce

Constraints: ~15,000
Proving time: ~3-5 seconds
```

### 3. Minimum Investment Circuit

Extends membership to prove `amount >= threshold`.

```
Public:  merkleRoot, nullifierHash, threshold
Private: (same as membership)

Constraints: ~15,500
Proving time: ~3-5 seconds
```

### 4. Token Claim Circuit

Proves entitlement to specific number of tokens based on investment.

```
Public:  merkleRoot, nullifierHash, expectedTokens, roundSharePrice
Private: (same as membership)

Constraints: ~16,000
Proving time: ~4-5 seconds
```

## Usage Examples

### Generate a Proof (JavaScript)

```javascript
const snarkjs = require("snarkjs");

// Load circuit artifacts
const wasmFile = "./build/membership/membership_js/membership.wasm";
const zkeyFile = "./build/membership/membership_final.zkey";

// Private inputs
const input = {
    address: "0x1234...",  // as BigInt
    amount: 50000000000n,  // 50,000 USDC (6 decimals)
    salt: "random_256_bit_value",
    pathElements: [...],   // Merkle proof
    pathIndices: [...],    // Path directions
    privateNonce: "secret_nonce"
};

// Generate proof
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmFile,
    zkeyFile
);

console.log("Proof:", proof);
console.log("Public signals:", publicSignals);
// publicSignals = [merkleRoot, nullifierHash]
```

### Verify a Proof (Solidity)

```solidity
import "./verifiers/MembershipVerifier.sol";

contract PrivateRoundManager {
    MembershipVerifier public verifier;

    function verifyInvestor(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[2] calldata _pubSignals  // [merkleRoot, nullifierHash]
    ) external view returns (bool) {
        require(_pubSignals[0] == commitmentRoot, "Wrong merkle root");
        require(!nullifiers[bytes32(_pubSignals[1])], "Nullifier used");

        return verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
    }
}
```

## Testing

```bash
# Run all tests
npm test

# Test specific circuit
npm test -- --grep "commitment"
```

## Security Notes

1. **Trusted Setup**: The setup uses Hermez Powers of Tau ceremony. For production, consider running your own Phase 2 ceremony with multiple contributors.

2. **Nullifier Security**: Nullifiers must be derived with a secret nonce to prevent linkability.

3. **Salt Backup**: Users MUST backup their salt - without it, they cannot prove ownership.

4. **Tree Depth**: Currently set to 20 levels (1M+ investors). Adjust `TREE_DEPTH` if needed.

## Gas Costs (Estimated)

| Operation | Gas |
|-----------|-----|
| Verify commitment proof | ~200,000 |
| Verify membership proof | ~250,000 |
| Verify claim proof | ~280,000 |

## References

- [Circom Documentation](https://docs.circom.io/)
- [snarkjs GitHub](https://github.com/iden3/snarkjs)
- [circomlib](https://github.com/iden3/circomlib)
- [Semaphore Protocol](https://semaphore.appliedzkp.org/)
