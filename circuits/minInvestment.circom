pragma circom 2.1.0;

include "./node_modules/circomlib/circuits/poseidon.circom";
include "./node_modules/circomlib/circuits/comparators.circom";
include "./lib/merkleTree.circom";

/*
 * MinimumInvestmentCircuit
 *
 * Purpose: Prove that investment amount >= threshold (for tiered access)
 *
 * Public inputs:
 *   - merkleRoot: Current root of the commitment Merkle tree
 *   - nullifierHash: Unique identifier for this proof
 *   - threshold: Minimum investment amount to prove
 *
 * Private inputs:
 *   - address: Investor's Ethereum address
 *   - amount: Actual investment amount
 *   - salt: Original salt
 *   - pathElements: Merkle proof siblings
 *   - pathIndices: Merkle proof path
 *   - privateNonce: Secret nonce for nullifier
 *
 * Use Cases:
 *   - Tiered access to pitch decks (e.g., >$50K gets full access)
 *   - Governance voting power tiers
 *   - Exclusive investor benefits
 */

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
    signal input threshold;

    // ========================================
    // Step 1: Compute commitment
    // ========================================
    component commitmentHasher = CommitmentHasher();
    commitmentHasher.address <== address;
    commitmentHasher.amount <== amount;
    commitmentHasher.salt <== salt;

    signal commitment <== commitmentHasher.commitment;

    // ========================================
    // Step 2: Verify Merkle proof (same as membership)
    // ========================================
    component merkleChecker = MerkleTreeChecker(levels);
    merkleChecker.leaf <== commitment;
    merkleChecker.root <== merkleRoot;

    for (var i = 0; i < levels; i++) {
        merkleChecker.pathElements[i] <== pathElements[i];
        merkleChecker.pathIndices[i] <== pathIndices[i];
    }

    // ========================================
    // Step 3: Verify nullifier
    // ========================================
    component nullifierHasher = NullifierHasher();
    nullifierHasher.commitment <== commitment;
    nullifierHasher.nonce <== privateNonce;

    nullifierHash === nullifierHasher.nullifierHash;

    // ========================================
    // Step 4: Verify amount >= threshold
    // ========================================
    component gte = GreaterEqThan(64);
    gte.in[0] <== amount;
    gte.in[1] <== threshold;
    gte.out === 1;
}

component main {public [merkleRoot, nullifierHash, threshold]} = MinimumInvestmentCircuit(20);
