#!/bin/bash

# Setup proving keys for Circom circuits (Groth16)
# Usage: ./scripts/setup.sh <circuit_name|all>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUITS_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$CIRCUITS_DIR/build"
PTAU_DIR="$BUILD_DIR/ptau"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Circuits
CIRCUITS=("commitment" "membership" "minInvestment" "claim")

# Powers of Tau file (download if not exists)
# Using Hermez ceremony ptau files from Google Storage
# For circuits with up to 2^14 constraints (~16K), use powersOfTau28_hez_final_14.ptau
# Our circuits have ~5600 constraints max, so 2^14 is sufficient
PTAU_POWER=14
PTAU_FILE="powersOfTau28_hez_final_${PTAU_POWER}.ptau"
PTAU_URL="https://storage.googleapis.com/zkevm/ptau/${PTAU_FILE}"

download_ptau() {
    mkdir -p "$PTAU_DIR"

    if [ -f "$PTAU_DIR/$PTAU_FILE" ]; then
        echo -e "${GREEN}Powers of Tau file already exists${NC}"
        return 0
    fi

    echo -e "${YELLOW}Downloading Powers of Tau ceremony file...${NC}"
    echo "This is a one-time download (~1GB for power 20)"
    echo "Source: Hermez trusted setup ceremony"
    echo ""

    curl -L -o "$PTAU_DIR/$PTAU_FILE" "$PTAU_URL"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Downloaded successfully${NC}"
    else
        echo -e "${RED}Failed to download Powers of Tau file${NC}"
        echo "You can manually download from: $PTAU_URL"
        exit 1
    fi
}

setup_circuit() {
    local circuit=$1
    local r1cs_file="$BUILD_DIR/$circuit/${circuit}.r1cs"
    local output_dir="$BUILD_DIR/$circuit"

    if [ ! -f "$r1cs_file" ]; then
        echo -e "${RED}Error: R1CS file not found: $r1cs_file${NC}"
        echo "Run ./scripts/compile.sh $circuit first"
        return 1
    fi

    echo -e "${BLUE}========================================"
    echo "Setting up $circuit"
    echo "========================================${NC}"

    # Step 1: Generate initial zkey (Phase 1 contribution)
    echo -e "${YELLOW}Step 1: Generating initial zkey...${NC}"
    snarkjs groth16 setup \
        "$r1cs_file" \
        "$PTAU_DIR/$PTAU_FILE" \
        "$output_dir/${circuit}_0000.zkey"

    # Step 2: Contribute to Phase 2 ceremony (add entropy)
    echo -e "${YELLOW}Step 2: Contributing to Phase 2...${NC}"
    snarkjs zkey contribute \
        "$output_dir/${circuit}_0000.zkey" \
        "$output_dir/${circuit}_0001.zkey" \
        --name="Fndr contribution" \
        -v -e="$(head -c 64 /dev/urandom | xxd -p -c 256)"

    # Step 3: Apply random beacon (finalize)
    echo -e "${YELLOW}Step 3: Applying random beacon...${NC}"
    snarkjs zkey beacon \
        "$output_dir/${circuit}_0001.zkey" \
        "$output_dir/${circuit}_final.zkey" \
        "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f" \
        10 \
        -n="Final Beacon phase2"

    # Step 4: Export verification key
    echo -e "${YELLOW}Step 4: Exporting verification key...${NC}"
    snarkjs zkey export verificationkey \
        "$output_dir/${circuit}_final.zkey" \
        "$output_dir/${circuit}_verification_key.json"

    # Step 5: Verify the final zkey
    echo -e "${YELLOW}Step 5: Verifying final zkey...${NC}"
    snarkjs zkey verify \
        "$r1cs_file" \
        "$PTAU_DIR/$PTAU_FILE" \
        "$output_dir/${circuit}_final.zkey"

    # Cleanup intermediate files
    rm -f "$output_dir/${circuit}_0000.zkey"
    rm -f "$output_dir/${circuit}_0001.zkey"

    echo -e "${GREEN}Setup complete for $circuit${NC}"
    echo "  - Final zkey: $output_dir/${circuit}_final.zkey"
    echo "  - Verification key: $output_dir/${circuit}_verification_key.json"
    echo ""
}

# Main
echo "========================================"
echo "Fndr ZK Circuits - Trusted Setup"
echo "========================================"
echo ""

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    echo -e "${RED}Error: snarkjs is not installed${NC}"
    echo "Install with: npm install -g snarkjs"
    exit 1
fi

# Download Powers of Tau if needed
download_ptau

echo ""

# Setup based on argument
if [ "$1" == "all" ] || [ -z "$1" ]; then
    echo "Setting up all circuits..."
    echo ""
    for circuit in "${CIRCUITS[@]}"; do
        setup_circuit "$circuit"
    done
    echo -e "${GREEN}All circuits setup successfully!${NC}"
else
    setup_circuit "$1"
fi

echo "========================================"
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run ./scripts/generateVerifiers.sh to generate Solidity verifiers"
echo "  2. Copy verifiers to contract/src/private/verifiers/"
echo "========================================"
