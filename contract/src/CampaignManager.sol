// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StartupEquityToken.sol";
import "./MockVault.sol";
import "forge-std/interfaces/IERC20.sol";

contract CampaignManager {
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
    error CampaignNotInFundraisingState();
    error CampaignDeadlinePassed();
    error CampaignNotCompleted();
    error InvestmentExceedsTargetRaise();
    error InvestmentTooSmall();
    error USDCTransferFailed();
    error WithdrawalAmountMustBeGreaterThanZero();
    error ExceedsMonthlyWithdrawalLimit();
    error MultipleWithdrawalsWithinMonthExceedLimit();
    error InsufficientVaultBalance();
    error InvalidCampaignState();
    error InvalidCampaignConfig();
    error InvalidCompanyName();
    error InvalidFndrIdentity();
    error InvalidPlatformWalletAddress();

    enum CampaignState {
        FUNDRAISING,    
        COMPLETED,    
        FULLY_DEPLOYED  
    }
    
    struct CampaignConfig {
        uint256 targetRaise;       
        uint256 equityPercentage;   
        uint256 sharePrice;         
        uint256 deadline;           
    }
    
    struct CampaignData {
        CampaignState state;
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
    
    CampaignConfig public config;
    CampaignData public campaign;
    
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
    
    // Events
    event CampaignCreated(
        address indexed founder,
        address indexed equityToken,
        string companyName,
        uint256 targetRaise,
        uint256 equityPercentage
    );
    
    event InvestmentMade(
        address indexed investor,
        uint256 usdcAmount,
        uint256 tokensReceived,
        uint256 totalRaised
    );
    
    event CampaignCompleted(
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
        if(msg.sender != campaign.founder) {
            revert OnlyFounderCanCall();
        }
        _;
    }
    
    modifier onlyDuringFundraising() {
        if(campaign.state != CampaignState.FUNDRAISING) {
            revert CampaignNotInFundraisingState();
        }
        if(block.timestamp > config.deadline) {
            revert CampaignDeadlinePassed();
        }
        _;
    }
    
    modifier onlyAfterCompletion() {
        if(campaign.state != CampaignState.COMPLETED) {
            revert CampaignNotCompleted();
        }
        _;
    }
    
    modifier updateCampaignState() {
        if (campaign.state == CampaignState.FUNDRAISING) {
            bool reachedTarget = campaign.totalRaised >= config.targetRaise;
            bool reachedDeadline = block.timestamp >= config.deadline;
            
            if (reachedTarget || reachedDeadline) {
                _completeCampaign();
            }
        }
        _;
    }
    
    constructor(
        address _usdc,
        address _vault,
        CampaignConfig memory _config,
        string memory _companySymbol,
        address _founder,
        address _fndrIdentity
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
            revert InvalidCampaignConfig();
        }
        if(_config.equityPercentage == 0 || _config.equityPercentage > BASIS_POINTS) {
            revert InvalidCampaignConfig();
        }
        if(_config.sharePrice == 0) {
            revert InvalidCampaignConfig();
        }
        if(_config.deadline <= block.timestamp) {
            revert InvalidCampaignConfig();
        }
        
        usdc = IERC20(_usdc);
        vault = MockVault(_vault);
        config = _config;
        
        campaign.founder = _founder;
        campaign.state = CampaignState.FUNDRAISING;
        lastYieldUpdate = block.timestamp;
        
        string memory tokenName = string(abi.encodePacked("Fndr Equity Token - ", _companySymbol));
        string memory tokenSymbol = string(abi.encodePacked("FNDR-", _companySymbol));
        
        campaign.equityToken = new StartupEquityToken(
            tokenName,
            tokenSymbol,
            _companySymbol,
            _config.equityPercentage,
            _founder,
            address(this),
            _fndrIdentity
        );
        
        emit CampaignCreated(
            _founder,
            address(campaign.equityToken),
            _companySymbol,
            _config.targetRaise,
            _config.equityPercentage
        );
    }
    
    function invest(uint256 usdcAmount) external onlyDuringFundraising updateCampaignState {
        if(usdcAmount == 0) {
            revert InvalidOperation("Investment amount must be greater than 0");
        }
        if(campaign.totalRaised + usdcAmount > config.targetRaise) {
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
        
        campaign.equityToken.mintToInvestor(msg.sender, tokensToMint);
        
        campaign.equityToken.initializeInvestorHoldingPeriod(msg.sender);
        
        if (campaign.investorContributions[msg.sender] == 0) {
            campaign.investors.push(msg.sender);
        }
        campaign.investorContributions[msg.sender] += usdcAmount;
        campaign.totalRaised += usdcAmount;
        campaign.tokensIssued += tokensToMint;
        
        emit InvestmentMade(msg.sender, usdcAmount, tokensToMint, campaign.totalRaised);
    }
    
    function founderWithdraw(uint256 usdcAmount) external onlyFounder updateCampaignState onlyAfterCompletion {
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
        
        if(!usdc.transfer(campaign.founder, usdcAmount)) {
            revert InvalidOperation("USDC transfer failed");
        }
        
        campaign.totalWithdrawn += usdcAmount;
        campaign.lastWithdrawal = block.timestamp;
        
        emit FounderWithdrawal(campaign.founder, usdcAmount, 0, usdcAmount);
        
        uint256 remainingBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        if (remainingBalance < 1e6) { 
            campaign.state = CampaignState.FULLY_DEPLOYED;
        }
    }

    function claimYield() external updateCampaignState {
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
        return campaign.founder;
    }
    
    function getEquityToken() external view returns (address) {
        return address(campaign.equityToken);
    }
    
    function getCampaignInfo() external updateCampaignState returns (
        CampaignState state,
        uint256 totalRaised,
        uint256 totalWithdrawn,
        uint256 tokensIssued,
        uint256 investorCount,
        uint256 vaultBalance
    ) {
        state = campaign.state;
        totalRaised = campaign.totalRaised;
        totalWithdrawn = campaign.totalWithdrawn;
        tokensIssued = campaign.tokensIssued;
        investorCount = campaign.investors.length;
        
        if (vault.balanceOf(address(this)) > 0) {
            vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        }
    }
    
    function getCampaignInfoView() external view returns (
        CampaignState state,
        uint256 totalRaised,
        uint256 totalWithdrawn,
        uint256 tokensIssued,
        uint256 investorCount,
        uint256 vaultBalance
    ) {
        state = campaign.state;
        totalRaised = campaign.totalRaised;
        totalWithdrawn = campaign.totalWithdrawn;
        tokensIssued = campaign.tokensIssued;
        investorCount = campaign.investors.length;
        
        if (vault.balanceOf(address(this)) > 0) {
            vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        }
    }
    
    function getInvestorInfo(address investor) external updateCampaignState returns (
        uint256 contribution,
        uint256 equityTokens,
        uint256 yieldBalance,
        uint256 yieldClaimed
    ) {
        contribution = campaign.investorContributions[investor];
        equityTokens = campaign.equityToken.balanceOf(investor);
        yieldBalance = investorYieldBalance[investor];
        yieldClaimed = investorYieldClaimed[investor];
    }
    
    function getInvestorInfoView(address investor) external view returns (
        uint256 contribution,
        uint256 equityTokens,
        uint256 yieldBalance,
        uint256 yieldClaimed
    ) {
        contribution = campaign.investorContributions[investor];
        equityTokens = campaign.equityToken.balanceOf(investor);
        yieldBalance = investorYieldBalance[investor];
        yieldClaimed = investorYieldClaimed[investor];
    }
    
    function getYieldInfo() external updateCampaignState returns (
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
    
    function canFounderWithdraw(uint256 usdcAmount) external updateCampaignState returns (bool, string memory) {
        if (campaign.state != CampaignState.COMPLETED) {
            return (false, "Campaign not completed");
        }
        
        uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        
        uint256 maxMonthlyWithdrawal = (vaultBalance * MAX_WITHDRAWAL_RATE) / BASIS_POINTS;
        if (usdcAmount > maxMonthlyWithdrawal) {
            return (false, "Exceeds 2% monthly withdrawal limit");
        }
        
        uint256 timeSinceLastWithdrawal = block.timestamp - campaign.lastWithdrawal;
        if (timeSinceLastWithdrawal < SECONDS_PER_MONTH && usdcAmount > maxMonthlyWithdrawal) {
            return (false, "Multiple withdrawals within month exceed limit");
        }
        
        if (vaultBalance < usdcAmount) {
            return (false, "Insufficient vault balance");
        }
        
        return (true, "Withdrawal allowed");
    }
    
    function canFounderWithdrawView(uint256 usdcAmount) external view returns (bool, string memory) {
        if (campaign.state != CampaignState.COMPLETED) {
            return (false, "Campaign not completed");
        }
        
        uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        
        uint256 maxMonthlyWithdrawal = (vaultBalance * MAX_WITHDRAWAL_RATE) / BASIS_POINTS;
        if (usdcAmount > maxMonthlyWithdrawal) {
            return (false, "Exceeds 2% monthly withdrawal limit");
        }
        
        uint256 timeSinceLastWithdrawal = block.timestamp - campaign.lastWithdrawal;
        if (timeSinceLastWithdrawal < SECONDS_PER_MONTH && usdcAmount > maxMonthlyWithdrawal) {
            return (false, "Multiple withdrawals within month exceed limit");
        }
        
        if (vaultBalance < usdcAmount) {
            return (false, "Insufficient vault balance");
        }
        
        return (true, "Withdrawal allowed");
    }
    
    function _completeCampaign() internal {
        campaign.state = CampaignState.COMPLETED;
        campaign.completionTime = block.timestamp;
        
        bool reachedTarget = campaign.totalRaised >= config.targetRaise;
        bool reachedDeadline = block.timestamp >= config.deadline;
        
        if (reachedTarget || reachedDeadline) {
            uint256 platformFee = (campaign.totalRaised * PLATFORM_SUCCESS_FEE) / BASIS_POINTS;
            uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
            
            if (vaultBalance >= platformFee) {
                uint256 shares = vault.convertToShares(platformFee);
                vault.redeem(shares, address(this), address(this));
                usdc.transfer(platformWallet, platformFee);
                
                emit PlatformFeeCollected(platformWallet, platformFee, campaign.totalRaised);
            }
        }
        
        emit CampaignCompleted(
            campaign.totalRaised, 
            block.timestamp,
            reachedTarget ? "TARGET_REACHED" : "DEADLINE_REACHED"
        );
    }

    function _updateYield() internal {
        if (vault.balanceOf(address(this)) == 0) return;
        
        uint256 currentVaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        uint256 lastBalance = campaign.totalRaised - campaign.totalWithdrawn + totalYieldDistributed;
        
        if (currentVaultBalance <= lastBalance) return;
        
        uint256 newYield = currentVaultBalance - lastBalance;
        if (newYield == 0) return;
        
        uint256 founderYield = (newYield * FOUNDER_YIELD_SHARE) / BASIS_POINTS;
        uint256 investorYield = newYield - founderYield;
        
        if (investorYield > 0 && campaign.tokensIssued > 0) {
            for (uint256 i = 0; i < campaign.investors.length; i++) {
                address investor = campaign.investors[i];
                uint256 investorTokens = campaign.equityToken.balanceOf(investor);
                uint256 investorShare = (investorYield * investorTokens) / campaign.tokensIssued;
                investorYieldBalance[investor] += investorShare;
            }
        }
        
        totalYieldDistributed += newYield;
        lastYieldUpdate = block.timestamp;
        
        emit YieldDistributed(newYield, founderYield, investorYield);
    }

    function _checkWithdrawalLimits(uint256 usdcAmount) internal view {
        uint256 timeSinceLastWithdrawal = block.timestamp - campaign.lastWithdrawal;
        
        if (timeSinceLastWithdrawal < SECONDS_PER_MONTH) {
            uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
            uint256 maxMonthlyWithdrawal = (vaultBalance * MAX_WITHDRAWAL_RATE) / BASIS_POINTS;
            require(usdcAmount <= maxMonthlyWithdrawal, "Exceeds monthly withdrawal limit");
        }
    }
}