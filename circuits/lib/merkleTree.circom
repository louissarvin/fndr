pragma circom 2.1.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

// Computes Poseidon hash of two inputs
template HashLeftRight() {
    signal input left;
    signal input right;
    signal output hash;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== left;
    hasher.inputs[1] <== right;
    hash <== hasher.out;
}

// Verifies a Merkle proof
// levels: depth of the Merkle tree
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
        // Ensure pathIndices[i] is binary (0 or 1)
        pathIndices[i] * (1 - pathIndices[i]) === 0;

        hashers[i] = HashLeftRight();
        mux[i] = MultiMux1(2);

        // If pathIndices[i] == 0: hash(current, sibling)
        // If pathIndices[i] == 1: hash(sibling, current)
        mux[i].c[0][0] <== hashes[i];
        mux[i].c[0][1] <== pathElements[i];
        mux[i].c[1][0] <== pathElements[i];
        mux[i].c[1][1] <== hashes[i];
        mux[i].s <== pathIndices[i];

        hashers[i].left <== mux[i].out[0];
        hashers[i].right <== mux[i].out[1];

        hashes[i + 1] <== hashers[i].hash;
    }

    // Final hash must equal the root
    root === hashes[levels];
}

// Computes the commitment: Poseidon(address, amount, salt)
template CommitmentHasher() {
    signal input address;
    signal input amount;
    signal input salt;
    signal output commitment;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== address;
    hasher.inputs[1] <== amount;
    hasher.inputs[2] <== salt;
    commitment <== hasher.out;
}

// Computes the nullifier: Poseidon(commitment, nonce)
template NullifierHasher() {
    signal input commitment;
    signal input nonce;
    signal output nullifierHash;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== commitment;
    hasher.inputs[1] <== nonce;
    nullifierHash <== hasher.out;
}
