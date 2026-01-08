pragma circom 2.1.0;

include "./node_modules/circomlib/circuits/poseidon.circom";
include "./node_modules/circomlib/circuits/comparators.circom";
include "./lib/merkleTree.circom";

/*
 * TokenClaimCircuit
 *
 * Purpose: Prove entitlement to claim equity tokens based on investment
 *
 * Public inputs:
 *   - merkleRoot: Current root of the commitment Merkle tree
 *   - nullifierHash: Prevents double-claiming
 *   - expectedTokens: Number of tokens to receive
 *   - roundSharePrice: The share price of the round (public, from contract)
 *
 * Private inputs:
 *   - address: Investor's Ethereum address
 *   - amount: USDC investment amount
 *   - salt: Original salt
 *   - pathElements: Merkle proof siblings
 *   - pathIndices: Merkle proof path
 *   - privateNonce: Secret nonce for nullifier
 *
 * Proves:
 *   - I made a valid investment (in the tree)
 *   - The token amount I'm claiming is correct: tokens = amount / sharePrice
 *   - I haven't claimed before (nullifier)
 */

template TokenClaimCircuit(levels) {
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
    signal input expectedTokens;
    signal input roundSharePrice;

    // ========================================
    // Step 1: Compute commitment
    // ========================================
    component commitmentHasher = CommitmentHasher();
    commitmentHasher.address <== address;
    commitmentHasher.amount <== amount;
    commitmentHasher.salt <== salt;

    signal commitment <== commitmentHasher.commitment;

    // ========================================
    // Step 2: Verify Merkle proof
    // ========================================
    component merkleChecker = MerkleTreeChecker(levels);
    merkleChecker.leaf <== commitment;
    merkleChecker.root <== merkleRoot;

    for (var i = 0; i < levels; i++) {
        merkleChecker.pathElements[i] <== pathElements[i];
        merkleChecker.pathIndices[i] <== pathIndices[i];
    }

    // ========================================
    // Step 3: Verify nullifier (prevents double-claim)
    // ========================================
    component nullifierHasher = NullifierHasher();
    nullifierHasher.commitment <== commitment;
    nullifierHasher.nonce <== privateNonce;

    nullifierHash === nullifierHasher.nullifierHash;

    // ========================================
    // Step 4: Verify token calculation
    // tokens = amount / sharePrice (integer division)
    // ========================================

    // We verify: expectedTokens * roundSharePrice <= amount
    // AND: (expectedTokens + 1) * roundSharePrice > amount
    // This proves expectedTokens = floor(amount / roundSharePrice)

    signal tokensTimesPrice <== expectedTokens * roundSharePrice;
    signal tokensPlusOneTimesPrice <== (expectedTokens + 1) * roundSharePrice;

    // Constraint: tokensTimesPrice <= amount
    component lte = LessEqThan(64);
    lte.in[0] <== tokensTimesPrice;
    lte.in[1] <== amount;
    lte.out === 1;

    // Constraint: tokensPlusOneTimesPrice > amount
    component gt = GreaterThan(64);
    gt.in[0] <== tokensPlusOneTimesPrice;
    gt.in[1] <== amount;
    gt.out === 1;

    // ========================================
    // Step 5: Ensure share price is valid (> 0)
    // ========================================
    component priceGtZero = GreaterThan(64);
    priceGtZero.in[0] <== roundSharePrice;
    priceGtZero.in[1] <== 0;
    priceGtZero.out === 1;

    // ========================================
    // Step 6: Ensure tokens > 0
    // ========================================
    component tokensGtZero = GreaterThan(64);
    tokensGtZero.in[0] <== expectedTokens;
    tokensGtZero.in[1] <== 0;
    tokensGtZero.out === 1;
}

component main {public [merkleRoot, nullifierHash, expectedTokens, roundSharePrice]} = TokenClaimCircuit(20);
