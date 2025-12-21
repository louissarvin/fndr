// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoundManager.sol";
import "./MockVault.sol";
import "forge-std/interfaces/IERC20.sol";
import "./FndrIdentity.sol";

contract RoundFactory {
    error InvalidParams();
    error NotVerifiedFounder();
    error RoundExists();
    error FeeFailed();

    IERC20 public immutable usdc;
    MockVault public immutable sharedYieldVault;
    FndrIdentity public immutable identity;

    uint256 public constant ROUND_CREATION_FEE = 10 * 1e6;
    address public immutable platformWallet = 0x564323aE0D8473103F3763814c5121Ca9e48004B;

    address[] public rounds;
    mapping(address => bool) public isActiveRound;
    mapping(address => address) public founderToRound;

    event RoundDeployed(
        address indexed roundAddress,
        address indexed founder,
        uint256 targetRaise,
        string metadataURI
    );

    constructor(address _usdc, address _sharedYieldVault, address _fndrIdentity) {
        if (_usdc == address(0) || _sharedYieldVault == address(0) || _fndrIdentity == address(0))
            revert InvalidParams();

        usdc = IERC20(_usdc);
        sharedYieldVault = MockVault(_sharedYieldVault);
        identity = FndrIdentity(_fndrIdentity);
    }

    function createRound(
        uint256 targetRaise,
        uint256 equityPercentage,
        uint256 sharePrice,
        uint256 deadline,
        string calldata companySymbol,
        string calldata metadataURI
    ) external returns (address) {
        if (!identity.isFounder(msg.sender)) revert NotVerifiedFounder();
        if (founderToRound[msg.sender] != address(0)) revert RoundExists();
        if (targetRaise == 0 || equityPercentage == 0 || equityPercentage > 10000 ||
            sharePrice == 0 || deadline <= block.timestamp) revert InvalidParams();

        if (!usdc.transferFrom(msg.sender, platformWallet, ROUND_CREATION_FEE))
            revert FeeFailed();

        RoundManager.RoundConfig memory config = RoundManager.RoundConfig({
            targetRaise: targetRaise,
            equityPercentage: equityPercentage,
            sharePrice: sharePrice,
            deadline: deadline
        });

        RoundManager newRound = new RoundManager(
            address(usdc),
            address(sharedYieldVault),
            config,
            companySymbol,
            msg.sender,
            address(identity),
            metadataURI
        );

        address roundAddress = address(newRound);
        rounds.push(roundAddress);
        isActiveRound[roundAddress] = true;
        founderToRound[msg.sender] = roundAddress;

        emit RoundDeployed(roundAddress, msg.sender, targetRaise, metadataURI);
        return roundAddress;
    }

    function getAllRounds() external view returns (address[] memory) {
        return rounds;
    }

    function getRoundByFounder(address founder) external view returns (address) {
        return founderToRound[founder];
    }

    function getTotalRoundsCount() external view returns (uint256) {
        return rounds.length;
    }

    function markRoundInactive(address roundAddress) external {
        require(msg.sender == roundAddress);
        isActiveRound[roundAddress] = false;
    }
}
