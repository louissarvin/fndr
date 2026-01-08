#!/bin/bash

# Compile Circom circuits
# Usage: ./scripts/compile.sh <circuit_name|all>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUITS_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$CIRCUITS_DIR/build"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Circuits to compile
CIRCUITS=("commitment" "membership" "minInvestment" "claim")

compile_circuit() {
    local circuit=$1
    local circuit_file="$CIRCUITS_DIR/${circuit}.circom"
    local output_dir="$BUILD_DIR/$circuit"

    if [ ! -f "$circuit_file" ]; then
        echo -e "${RED}Error: Circuit file not found: $circuit_file${NC}"
        return 1
    fi

    echo -e "${YELLOW}Compiling $circuit...${NC}"

    # Create output directory
    mkdir -p "$output_dir"

    # Compile with circom
    # --r1cs: Generate R1CS constraint system
    # --wasm: Generate WASM for witness generation
    # --sym: Generate symbol file for debugging
    # --c: Generate C code (optional, for faster witness gen)
    circom "$circuit_file" \
        --r1cs \
        --wasm \
        --sym \
        -o "$output_dir" \
        -l "$CIRCUITS_DIR/node_modules"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully compiled $circuit${NC}"
        echo "  - R1CS: $output_dir/${circuit}.r1cs"
        echo "  - WASM: $output_dir/${circuit}_js/${circuit}.wasm"
        echo "  - SYM:  $output_dir/${circuit}.sym"

        # Print constraint count
        if command -v snarkjs &> /dev/null; then
            echo -e "${YELLOW}Circuit info:${NC}"
            snarkjs r1cs info "$output_dir/${circuit}.r1cs"
        fi
    else
        echo -e "${RED}Failed to compile $circuit${NC}"
        return 1
    fi

    echo ""
}

# Main
echo "========================================"
echo "Fndr ZK Circuits - Compiler"
echo "========================================"
echo ""

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo -e "${RED}Error: circom is not installed${NC}"
    echo "Install with: curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh"
    echo "             cargo install --git https://github.com/iden3/circom.git"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "$CIRCUITS_DIR/node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    cd "$CIRCUITS_DIR"
    npm install
    cd -
fi

# Create build directory
mkdir -p "$BUILD_DIR"

# Compile based on argument
if [ "$1" == "all" ] || [ -z "$1" ]; then
    echo "Compiling all circuits..."
    echo ""
    for circuit in "${CIRCUITS[@]}"; do
        compile_circuit "$circuit"
    done
    echo -e "${GREEN}All circuits compiled successfully!${NC}"
else
    compile_circuit "$1"
fi

echo "========================================"
echo "Compilation complete!"
echo "========================================"
