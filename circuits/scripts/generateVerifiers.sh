#!/bin/bash

# Generate Solidity verifier contracts from zkeys
# Usage: ./scripts/generateVerifiers.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUITS_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$CIRCUITS_DIR/build"
VERIFIERS_DIR="$BUILD_DIR/verifiers"
CONTRACT_DIR="$CIRCUITS_DIR/../contract/src/private/verifiers"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Circuits
CIRCUITS=("commitment" "membership" "minInvestment" "claim")

generate_verifier() {
    local circuit=$1
    local zkey_file="$BUILD_DIR/$circuit/${circuit}_final.zkey"
    local verifier_file="$VERIFIERS_DIR/${circuit^}Verifier.sol"

    if [ ! -f "$zkey_file" ]; then
        echo -e "${RED}Error: zkey not found: $zkey_file${NC}"
        echo "Run ./scripts/setup.sh $circuit first"
        return 1
    fi

    echo -e "${YELLOW}Generating verifier for $circuit...${NC}"

    snarkjs zkey export solidityverifier \
        "$zkey_file" \
        "$verifier_file"

    # Rename the contract to match our naming convention
    # snarkjs generates "Groth16Verifier", we want "{Circuit}Verifier"
    local contract_name="${circuit^}Verifier"
    sed -i.bak "s/Groth16Verifier/${contract_name}/g" "$verifier_file"
    rm -f "${verifier_file}.bak"

    echo -e "${GREEN}Generated: $verifier_file${NC}"
}

# Main
echo "========================================"
echo "Fndr ZK Circuits - Verifier Generator"
echo "========================================"
echo ""

mkdir -p "$VERIFIERS_DIR"
mkdir -p "$CONTRACT_DIR"

for circuit in "${CIRCUITS[@]}"; do
    generate_verifier "$circuit"
done

# Create combined interface contract
echo -e "${YELLOW}Creating combined verifier interface...${NC}"

cat > "$VERIFIERS_DIR/IZKVerifier.sol" << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IZKVerifier
 * @notice Interface for ZK proof verification in Fndr private investments
 */
interface IZKVerifier {
    /**
     * @notice Verify a commitment proof
     * @param _pA Proof point A
     * @param _pB Proof point B
     * @param _pC Proof point C
     * @param _pubSignals Public signals [commitment]
     */
    function verifyCommitmentProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[1] calldata _pubSignals
    ) external view returns (bool);

    /**
     * @notice Verify a membership proof
     * @param _pA Proof point A
     * @param _pB Proof point B
     * @param _pC Proof point C
     * @param _pubSignals Public signals [merkleRoot, nullifierHash]
     */
    function verifyMembershipProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[2] calldata _pubSignals
    ) external view returns (bool);

    /**
     * @notice Verify a minimum investment proof
     * @param _pA Proof point A
     * @param _pB Proof point B
     * @param _pC Proof point C
     * @param _pubSignals Public signals [merkleRoot, nullifierHash, threshold]
     */
    function verifyMinInvestmentProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[3] calldata _pubSignals
    ) external view returns (bool);

    /**
     * @notice Verify a token claim proof
     * @param _pA Proof point A
     * @param _pB Proof point B
     * @param _pC Proof point C
     * @param _pubSignals Public signals [merkleRoot, nullifierHash, expectedTokens, roundSharePrice]
     */
    function verifyClaimProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[4] calldata _pubSignals
    ) external view returns (bool);
}
EOF

echo -e "${GREEN}Created: $VERIFIERS_DIR/IZKVerifier.sol${NC}"

# Copy to contract directory
echo -e "${YELLOW}Copying verifiers to contract directory...${NC}"
cp "$VERIFIERS_DIR"/*.sol "$CONTRACT_DIR/" 2>/dev/null || true

echo ""
echo -e "${GREEN}========================================"
echo "Verifier generation complete!"
echo "========================================${NC}"
echo ""
echo "Generated files:"
for circuit in "${CIRCUITS[@]}"; do
    echo "  - ${circuit^}Verifier.sol"
done
echo "  - IZKVerifier.sol (interface)"
echo ""
echo "Verifiers copied to: $CONTRACT_DIR"
