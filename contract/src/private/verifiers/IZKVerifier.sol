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
