pragma circom 2.1.0;

include "./node_modules/circomlib/circuits/poseidon.circom";
include "./node_modules/circomlib/circuits/comparators.circom";
include "./lib/merkleTree.circom";

/*
 * CommitmentCircuit
 *
 * Purpose: Prove that a commitment is correctly formed from (address, amount, salt)
 *
 * Public inputs:
 *   - commitment: The hash to verify
 *
 * Private inputs:
 *   - address: Investor's Ethereum address (as field element)
 *   - amount: Investment amount in USDC (6 decimals)
 *   - salt: Random 256-bit salt for hiding
 *
 * Constraints:
 *   1. commitment === Poseidon(address, amount, salt)
 *   2. amount > 0
 *   3. amount <= MAX_INVESTMENT (10M USDC)
 */
template CommitmentCircuit() {
    // Private inputs
    signal input address;
    signal input amount;
    signal input salt;

    // Public inputs
    signal input commitment;

    // Constants
    // Max investment: 10,000,000 USDC with 6 decimals = 10^13
    var MAX_INVESTMENT = 10000000000000;

    // ========================================
    // Constraint 1: Verify commitment hash
    // ========================================
    component commitmentHasher = CommitmentHasher();
    commitmentHasher.address <== address;
    commitmentHasher.amount <== amount;
    commitmentHasher.salt <== salt;

    commitment === commitmentHasher.commitment;

    // ========================================
    // Constraint 2: Amount must be positive
    // ========================================
    component gtZero = GreaterThan(64);
    gtZero.in[0] <== amount;
    gtZero.in[1] <== 0;
    gtZero.out === 1;

    // ========================================
    // Constraint 3: Amount must be <= MAX_INVESTMENT
    // ========================================
    component leMax = LessEqThan(64);
    leMax.in[0] <== amount;
    leMax.in[1] <== MAX_INVESTMENT;
    leMax.out === 1;
}

component main {public [commitment]} = CommitmentCircuit();
