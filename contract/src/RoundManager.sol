// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StartupEquityToken.sol";
import "./MockVault.sol";
import "forge-std/interfaces/IERC20.sol";

contract RoundManager {
    error InsufficientFunds();
    error Unauthorized();
    error InvalidOperation(string reason);
    error InvalidUSDCAddress();
    error InvalidVaultAddress();
    error InvalidFounderAddress();
    error InvalidFndrIdentityAddress();
    error InvalidTargetRaise();
    error InvalidEquityPercentage();
    error InvalidSharePrice();
    error InvalidDeadline();
    error OnlyFounderCanCall();
    error RoundNotInFundraisingState();
    error RoundDeadlinePassed();
    error RoundNotCompleted();
    error InvestmentExceedsTargetRaise();
    error InvestmentTooSmall();
    error USDCTransferFailed();
    error WithdrawalAmountMustBeGreaterThanZero();
    error ExceedsMonthlyWithdrawalLimit();
    error MultipleWithdrawalsWithinMonthExceedLimit();
    error InsufficientVaultBalance();
    error InvalidRoundState();
    error InvalidRoundConfig();
    error InvalidCompanyName();
    error InvalidFndrIdentity();
    error InvalidPlatformWalletAddress();

    enum RoundState {
        FUNDRAISING,
        COMPLETED,
        FULLY_DEPLOYED
    }

    struct RoundConfig {
        uint256 targetRaise;
        uint256 equityPercentage;
        uint256 sharePrice;
        uint256 deadline;
    }

    struct RoundData {
        RoundState state;
        address founder;
        StartupEquityToken equityToken;
        uint256 totalRaised;
        uint256 totalWithdrawn;
        uint256 lastWithdrawal;
        uint256 tokensIssued;
        mapping(address => uint256) investorContributions;
        address[] investors;
        uint256 completionTime;
    }

    IERC20 public immutable usdc;
    MockVault public immutable vault;
    address public immutable platformWallet = 0x564323aE0D8473103F3763814c5121Ca9e48004B;

    RoundConfig public config;
    RoundData public round;

    mapping(address => uint256) public investorYieldBalance;
    mapping(address => uint256) public investorYieldClaimed;
    uint256 public totalYieldDistributed;
    uint256 public founderYieldClaimed;
    uint256 public lastYieldUpdate;

    uint256 public constant SECONDS_PER_MONTH = 30 days;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant PLATFORM_SUCCESS_FEE = 50;
    uint256 public constant MAX_WITHDRAWAL_RATE = 200;
    uint256 public immutable FOUNDER_YIELD_SHARE = 5000;

    string public metadataURI;

    // Events
    event RoundCreated(
        address indexed founder,
        address indexed equityToken,
        string companyName,
        uint256 targetRaise,
        uint256 equityPercentage,
        string metadataURI
    );

    event InvestmentMade(
        address indexed investor,
        uint256 usdcAmount,
        uint256 tokensReceived,
        uint256 totalRaised
    );

    event RoundCompleted(
        uint256 totalRaised,
        uint256 completionTime,
        string completionReason
    );

    event FounderWithdrawal(
        address indexed founder,
        uint256 principalAmount,
        uint256 yieldAmount,
        uint256 totalAmount
    );

    event YieldDistributed(
        uint256 totalYield,
        uint256 founderYield,
        uint256 investorYield
    );

    event InvestorYieldClaimed(
        address indexed investor,
        uint256 amount
    );

    event PlatformFeeCollected(
        address indexed platformWallet,
        uint256 feeAmount,
        uint256 totalRaised
    );

    modifier onlyFounder() {
        if(msg.sender != round.founder) {
            revert OnlyFounderCanCall();
        }
        _;
    }

    modifier onlyDuringFundraising() {
        if(round.state != RoundState.FUNDRAISING) {
            revert RoundNotInFundraisingState();
        }
        if(block.timestamp > config.deadline) {
            revert RoundDeadlinePassed();
        }
        _;
    }

    modifier onlyAfterCompletion() {
        if(round.state != RoundState.COMPLETED) {
            revert RoundNotCompleted();
        }
        _;
    }

    modifier updateRoundState() {
        if (round.state == RoundState.FUNDRAISING) {
            bool reachedTarget = round.totalRaised >= config.targetRaise;
            bool reachedDeadline = block.timestamp >= config.deadline;

            if (reachedTarget || reachedDeadline) {
                _completeRound();
            }
        }
        _;
    }

    constructor(
        address _usdc,
        address _vault,
        RoundConfig memory _config,
        string memory _companySymbol,
        address _founder,
        address _fndrIdentity,
        string memory _metadataURI
    ) {
        if(_usdc == address(0)) {
            revert InvalidUSDCAddress();
        }
        if(_vault == address(0)) {
            revert InvalidVaultAddress();
        }
        if(_founder == address(0)) {
            revert InvalidFounderAddress();
        }
        if(_fndrIdentity == address(0)) {
            revert InvalidFndrIdentityAddress();
        }
        if(_config.targetRaise == 0) {
            revert InvalidRoundConfig();
        }
        if(_config.equityPercentage == 0 || _config.equityPercentage > BASIS_POINTS) {
            revert InvalidRoundConfig();
        }
        if(_config.sharePrice == 0) {
            revert InvalidRoundConfig();
        }
        if(_config.deadline <= block.timestamp) {
            revert InvalidRoundConfig();
        }

        usdc = IERC20(_usdc);
        vault = MockVault(_vault);
        config = _config;
        metadataURI = _metadataURI;

        round.founder = _founder;
        round.state = RoundState.FUNDRAISING;
        lastYieldUpdate = block.timestamp;

        string memory tokenName = string(abi.encodePacked("Fndr Equity Token - ", _companySymbol));
        string memory tokenSymbol = string(abi.encodePacked("FNDR-", _companySymbol));

        round.equityToken = new StartupEquityToken(
            tokenName,
            tokenSymbol,
            _companySymbol,
            _config.equityPercentage,
            _founder,
            address(this),
            _fndrIdentity
        );

        emit RoundCreated(
            _founder,
            address(round.equityToken),
            _companySymbol,
            _config.targetRaise,
            _config.equityPercentage,
            _metadataURI
        );
    }

    function invest(uint256 usdcAmount) external onlyDuringFundraising updateRoundState {
        if(usdcAmount == 0) {
            revert InvalidOperation("Investment amount must be greater than 0");
        }
        if(round.totalRaised + usdcAmount > config.targetRaise) {
            revert InvalidOperation("Investment exceeds target raise");
        }

        uint256 tokensToMint = usdcAmount / config.sharePrice;
        if(tokensToMint == 0) {
            revert InvalidOperation("Investment amount too small for share price");
        }

        if(!usdc.transferFrom(msg.sender, address(this), usdcAmount)) {
            revert InvalidOperation("USDC transfer failed");
        }

        usdc.approve(address(vault), usdcAmount);
        vault.deposit(usdcAmount, address(this));

        round.equityToken.mintToInvestor(msg.sender, tokensToMint);

        round.equityToken.initializeInvestorHoldingPeriod(msg.sender);

        if (round.investorContributions[msg.sender] == 0) {
            round.investors.push(msg.sender);
        }
        round.investorContributions[msg.sender] += usdcAmount;
        round.totalRaised += usdcAmount;
        round.tokensIssued += tokensToMint;

        emit InvestmentMade(msg.sender, usdcAmount, tokensToMint, round.totalRaised);
    }

    function founderWithdraw(uint256 usdcAmount) external onlyFounder updateRoundState onlyAfterCompletion {
        if(usdcAmount == 0) {
            revert InvalidOperation("Withdrawal amount must be greater than 0");
        }

        _updateYield();

        uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));

        uint256 maxMonthlyWithdrawal = (vaultBalance * MAX_WITHDRAWAL_RATE) / BASIS_POINTS;
        if(usdcAmount > maxMonthlyWithdrawal) {
            revert InvalidOperation("Exceeds 2% monthly withdrawal limit");
        }

        _checkWithdrawalLimits(usdcAmount);

        if(vaultBalance < usdcAmount) {
            revert InvalidOperation("Insufficient vault balance");
        }

        uint256 shares = vault.convertToShares(usdcAmount);

        vault.redeem(shares, address(this), address(this));

        if(!usdc.transfer(round.founder, usdcAmount)) {
            revert InvalidOperation("USDC transfer failed");
        }

        round.totalWithdrawn += usdcAmount;
        round.lastWithdrawal = block.timestamp;

        emit FounderWithdrawal(round.founder, usdcAmount, 0, usdcAmount);

        uint256 remainingBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        if (remainingBalance < 1e6) {
            round.state = RoundState.FULLY_DEPLOYED;
        }
    }

    function claimYield() external updateRoundState {
        if(investorYieldBalance[msg.sender] == 0) {
            revert InvalidOperation("No yield to claim");
        }

        uint256 claimableYield = investorYieldBalance[msg.sender];
        investorYieldBalance[msg.sender] = 0;
        investorYieldClaimed[msg.sender] += claimableYield;

        uint256 shares = vault.convertToShares(claimableYield);
        vault.redeem(shares, address(this), address(this));

        if(!usdc.transfer(msg.sender, claimableYield)) {
            revert InvalidOperation("USDC transfer failed");
        }

        emit InvestorYieldClaimed(msg.sender, claimableYield);
    }

    function updateYield() external {
        _updateYield();
    }

    function getFounder() external view returns (address) {
        return round.founder;
    }

    function getEquityToken() external view returns (address) {
        return address(round.equityToken);
    }

    function getRoundInfo() external updateRoundState returns (
        RoundState state,
        uint256 totalRaised,
        uint256 totalWithdrawn,
        uint256 tokensIssued,
        uint256 investorCount,
        uint256 vaultBalance
    ) {
        state = round.state;
        totalRaised = round.totalRaised;
        totalWithdrawn = round.totalWithdrawn;
        tokensIssued = round.tokensIssued;
        investorCount = round.investors.length;

        if (vault.balanceOf(address(this)) > 0) {
            vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        }
    }

    function getRoundInfoView() external view returns (
        RoundState state,
        uint256 totalRaised,
        uint256 totalWithdrawn,
        uint256 tokensIssued,
        uint256 investorCount,
        uint256 vaultBalance
    ) {
        state = round.state;
        totalRaised = round.totalRaised;
        totalWithdrawn = round.totalWithdrawn;
        tokensIssued = round.tokensIssued;
        investorCount = round.investors.length;

        if (vault.balanceOf(address(this)) > 0) {
            vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        }
    }

    function getInvestorInfo(address investor) external updateRoundState returns (
        uint256 contribution,
        uint256 equityTokens,
        uint256 yieldBalance,
        uint256 yieldClaimed
    ) {
        contribution = round.investorContributions[investor];
        equityTokens = round.equityToken.balanceOf(investor);
        yieldBalance = investorYieldBalance[investor];
        yieldClaimed = investorYieldClaimed[investor];
    }

    function getInvestorInfoView(address investor) external view returns (
        uint256 contribution,
        uint256 equityTokens,
        uint256 yieldBalance,
        uint256 yieldClaimed
    ) {
        contribution = round.investorContributions[investor];
        equityTokens = round.equityToken.balanceOf(investor);
        yieldBalance = investorYieldBalance[investor];
        yieldClaimed = investorYieldClaimed[investor];
    }

    function getYieldInfo() external updateRoundState returns (
        uint256 totalVaultBalance,
        uint256 totalYieldAccrued,
        uint256 currentAPY
    ) {
        if (vault.balanceOf(address(this)) > 0) {
            totalVaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
            currentAPY = vault.getCurrentAPY();
        }

        totalYieldAccrued = totalYieldDistributed;
    }

    function getYieldInfoView() external view returns (
        uint256 totalVaultBalance,
        uint256 totalYieldAccrued,
        uint256 currentAPY
    ) {
        if (vault.balanceOf(address(this)) > 0) {
            totalVaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
            currentAPY = vault.getCurrentAPY();
        }

        totalYieldAccrued = totalYieldDistributed;
    }

    function canFounderWithdraw(uint256 usdcAmount) external updateRoundState returns (bool, string memory) {
        if (round.state != RoundState.COMPLETED) {
            return (false, "Round not completed");
        }

        uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));

        uint256 maxMonthlyWithdrawal = (vaultBalance * MAX_WITHDRAWAL_RATE) / BASIS_POINTS;
        if (usdcAmount > maxMonthlyWithdrawal) {
            return (false, "Exceeds 2% monthly withdrawal limit");
        }

        uint256 timeSinceLastWithdrawal = block.timestamp - round.lastWithdrawal;
        if (timeSinceLastWithdrawal < SECONDS_PER_MONTH && usdcAmount > maxMonthlyWithdrawal) {
            return (false, "Multiple withdrawals within month exceed limit");
        }

        if (vaultBalance < usdcAmount) {
            return (false, "Insufficient vault balance");
        }

        return (true, "Withdrawal allowed");
    }

    function canFounderWithdrawView(uint256 usdcAmount) external view returns (bool, string memory) {
        if (round.state != RoundState.COMPLETED) {
            return (false, "Round not completed");
        }

        uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));

        uint256 maxMonthlyWithdrawal = (vaultBalance * MAX_WITHDRAWAL_RATE) / BASIS_POINTS;
        if (usdcAmount > maxMonthlyWithdrawal) {
            return (false, "Exceeds 2% monthly withdrawal limit");
        }

        uint256 timeSinceLastWithdrawal = block.timestamp - round.lastWithdrawal;
        if (timeSinceLastWithdrawal < SECONDS_PER_MONTH && usdcAmount > maxMonthlyWithdrawal) {
            return (false, "Multiple withdrawals within month exceed limit");
        }

        if (vaultBalance < usdcAmount) {
            return (false, "Insufficient vault balance");
        }

        return (true, "Withdrawal allowed");
    }

    function _completeRound() internal {
        round.state = RoundState.COMPLETED;
        round.completionTime = block.timestamp;

        bool reachedTarget = round.totalRaised >= config.targetRaise;
        bool reachedDeadline = block.timestamp >= config.deadline;

        if (reachedTarget || reachedDeadline) {
            uint256 platformFee = (round.totalRaised * PLATFORM_SUCCESS_FEE) / BASIS_POINTS;
            uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));

            if (vaultBalance >= platformFee) {
                uint256 shares = vault.convertToShares(platformFee);
                vault.redeem(shares, address(this), address(this));
                usdc.transfer(platformWallet, platformFee);

                emit PlatformFeeCollected(platformWallet, platformFee, round.totalRaised);
            }
        }

        emit RoundCompleted(
            round.totalRaised,
            block.timestamp,
            reachedTarget ? "TARGET_REACHED" : "DEADLINE_REACHED"
        );
    }

    function _updateYield() internal {
        if (vault.balanceOf(address(this)) == 0) return;

        uint256 currentVaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        uint256 lastBalance = round.totalRaised - round.totalWithdrawn + totalYieldDistributed;

        if (currentVaultBalance <= lastBalance) return;

        uint256 newYield = currentVaultBalance - lastBalance;
        if (newYield == 0) return;

        uint256 founderYield = (newYield * FOUNDER_YIELD_SHARE) / BASIS_POINTS;
        uint256 investorYield = newYield - founderYield;

        if (investorYield > 0 && round.tokensIssued > 0) {
            for (uint256 i = 0; i < round.investors.length; i++) {
                address investor = round.investors[i];
                uint256 investorTokens = round.equityToken.balanceOf(investor);
                uint256 investorShare = (investorYield * investorTokens) / round.tokensIssued;
                investorYieldBalance[investor] += investorShare;
            }
        }

        totalYieldDistributed += newYield;
        lastYieldUpdate = block.timestamp;

        emit YieldDistributed(newYield, founderYield, investorYield);
    }

    function _checkWithdrawalLimits(uint256 usdcAmount) internal view {
        uint256 timeSinceLastWithdrawal = block.timestamp - round.lastWithdrawal;

        if (timeSinceLastWithdrawal < SECONDS_PER_MONTH) {
            uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
            uint256 maxMonthlyWithdrawal = (vaultBalance * MAX_WITHDRAWAL_RATE) / BASIS_POINTS;
            require(usdcAmount <= maxMonthlyWithdrawal, "Exceeds monthly withdrawal limit");
        }
    }
}
