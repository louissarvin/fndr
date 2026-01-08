pragma circom 2.1.0;

include "./node_modules/circomlib/circuits/poseidon.circom";
include "./lib/merkleTree.circom";

/*
 * MembershipCircuit
 *
 * Purpose: Prove membership in the investor set without revealing identity
 *
 * Public inputs:
 *   - merkleRoot: Current root of the commitment Merkle tree
 *   - nullifierHash: Unique identifier for this proof (prevents double-use)
 *
 * Private inputs:
 *   - address: Investor's Ethereum address
 *   - amount: Investment amount
 *   - salt: Original salt used in commitment
 *   - pathElements: Merkle proof siblings
 *   - pathIndices: Merkle proof path directions (0=left, 1=right)
 *   - privateNonce: Secret nonce for nullifier derivation
 *
 * Proves:
 *   - "I know a valid commitment in this Merkle tree"
 *   - Without revealing which commitment or any details
 */

// Tree depth: 20 levels = 2^20 = ~1M possible investors

template MembershipCircuit(levels) {
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

    // ========================================
    // Step 1: Compute commitment from private inputs
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
    // Step 3: Compute and verify nullifier
    // ========================================
    component nullifierHasher = NullifierHasher();
    nullifierHasher.commitment <== commitment;
    nullifierHasher.nonce <== privateNonce;

    nullifierHash === nullifierHasher.nullifierHash;
}

component main {public [merkleRoot, nullifierHash]} = MembershipCircuit(20);
