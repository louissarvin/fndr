// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StartupEquityToken.sol";
import "./MockVault.sol";
import "forge-std/interfaces/IERC20.sol";

/**
 * @title CampaignManager
 * @notice Manages startup funding campaigns with yield-enhanced capital deployment
 * @dev Coordinates between equity tokens, yield vault, and campaign lifecycle
 */
contract CampaignManager {
    // Campaign states
    enum CampaignState {
        FUNDRAISING,    // Accepting investments
        COMPLETED,      // Target reached, withdrawals enabled  
        FULLY_DEPLOYED  // All funds withdrawn
    }
    
    // Campaign configuration (for manager - simplified without metadata)
    struct CampaignConfig {
        uint256 targetRaise;        // Target amount in USDC
        uint256 equityPercentage;   // Equity offered in basis points (1000 = 10%)
        uint256 sharePrice;         // Price per token in USDC (with 6 decimals)
        uint256 deadline;           // Campaign deadline timestamp
    }
    
    // Campaign state
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
        uint256 completionTime;     // When campaign completed
    }
    
    // Protocol components
    IERC20 public immutable usdc;
    MockVault public immutable vault;
    address public immutable platformWallet = 0x564323aE0D8473103F3763814c5121Ca9e48004B;
    
    // Campaign management
    CampaignConfig public config;
    CampaignData public campaign;
    
    // Yield tracking
    mapping(address => uint256) public investorYieldBalance;
    mapping(address => uint256) public investorYieldClaimed;
    uint256 public totalYieldDistributed;
    uint256 public founderYieldClaimed;
    uint256 public lastYieldUpdate;
    
    // Constants
    uint256 public constant SECONDS_PER_MONTH = 30 days;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant PLATFORM_SUCCESS_FEE = 50;
    uint256 public constant MAX_WITHDRAWAL_RATE = 200; // 2% per month - immutable for security
    uint256 public immutable FOUNDER_YIELD_SHARE = 5000; // 50% - fair split with investors 
    
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
        require(msg.sender == campaign.founder, "Only founder can call this");
        _;
    }
    
    modifier onlyDuringFundraising() {
        require(campaign.state == CampaignState.FUNDRAISING, "Campaign not in fundraising state");
        require(block.timestamp <= config.deadline, "Campaign deadline passed");
        _;
    }
    
    modifier onlyAfterCompletion() {
        require(campaign.state == CampaignState.COMPLETED, "Campaign not completed");
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
        require(_usdc != address(0), "Invalid USDC address");
        require(_vault != address(0), "Invalid vault address");
        require(_founder != address(0), "Invalid founder address");
        require(_fndrIdentity != address(0), "Invalid FndrIdentity address");
        require(_config.targetRaise > 0, "Invalid target raise");
        require(_config.equityPercentage > 0 && _config.equityPercentage <= BASIS_POINTS, "Invalid equity percentage");
        require(_config.sharePrice > 0, "Invalid share price");
        require(_config.deadline > block.timestamp, "Invalid deadline");
        
        usdc = IERC20(_usdc);
        vault = MockVault(_vault);
        config = _config;
        
        // Initialize campaign
        campaign.founder = _founder;
        campaign.state = CampaignState.FUNDRAISING;
        lastYieldUpdate = block.timestamp;
        
        // Deploy equity token - using generic name since company name is in IPFS
        string memory tokenName = string(abi.encodePacked("Fndr Equity Token - ", _companySymbol));
        string memory tokenSymbol = string(abi.encodePacked("FNDR-", _companySymbol));
        
        campaign.equityToken = new StartupEquityToken(
            tokenName,
            tokenSymbol,
            _companySymbol,  // Use symbol as company identifier since name is in IPFS
            _config.equityPercentage,
            _founder,
            address(this),
            _fndrIdentity
        );
        
        emit CampaignCreated(
            _founder,
            address(campaign.equityToken),
            _companySymbol,  // Emit symbol since company name is in IPFS
            _config.targetRaise,
            _config.equityPercentage
        );
    }
    
    /**
     * @notice Invest USDC in the campaign
     * @param usdcAmount Amount of USDC to invest (6 decimals)
     */
    function invest(uint256 usdcAmount) external onlyDuringFundraising updateCampaignState {
        require(usdcAmount > 0, "Investment amount must be greater than 0");
        require(campaign.totalRaised + usdcAmount <= config.targetRaise, "Investment exceeds target raise");
        
        // Calculate tokens to mint (both USDC and token use 6 decimals)
        uint256 tokensToMint = usdcAmount / config.sharePrice;
        require(tokensToMint > 0, "Investment too small");
        
        // Transfer USDC from investor
        require(usdc.transferFrom(msg.sender, address(this), usdcAmount), "USDC transfer failed");
        
        // Deposit USDC to yield vault
        usdc.approve(address(vault), usdcAmount);
        vault.deposit(usdcAmount, address(this));
        
        // Mint equity tokens to investor
        campaign.equityToken.mintToInvestor(msg.sender, tokensToMint);
        
        // Initialize holding period for secondary market trading
        campaign.equityToken.initializeInvestorHoldingPeriod(msg.sender);
        
        // Update campaign state
        if (campaign.investorContributions[msg.sender] == 0) {
            campaign.investors.push(msg.sender);
        }
        campaign.investorContributions[msg.sender] += usdcAmount;
        campaign.totalRaised += usdcAmount;
        campaign.tokensIssued += tokensToMint;
        
        emit InvestmentMade(msg.sender, usdcAmount, tokensToMint, campaign.totalRaised);
    }
    
    /**
     * @notice Founder withdraws funds (only after campaign completion)
     * @param usdcAmount Amount of USDC to withdraw
     */
    function founderWithdraw(uint256 usdcAmount) external onlyFounder updateCampaignState onlyAfterCompletion {
        require(usdcAmount > 0, "Withdrawal amount must be greater than 0");
        
        // Update and distribute yield before withdrawal
        _updateYield();
        
        // Get current vault balance for withdrawal limit calculation
        uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        
        // ALWAYS enforce 2% monthly withdrawal rate - immutable security feature
        uint256 maxMonthlyWithdrawal = (vaultBalance * MAX_WITHDRAWAL_RATE) / BASIS_POINTS;
        require(usdcAmount <= maxMonthlyWithdrawal, "Exceeds 2% monthly withdrawal limit");
        
        // Check time-based withdrawal limits (for multiple withdrawals within same month)
        _checkWithdrawalLimits(usdcAmount);
        
        // Verify sufficient vault balance
        require(vaultBalance >= usdcAmount, "Insufficient vault balance");
        
        // Calculate shares to withdraw
        uint256 shares = vault.convertToShares(usdcAmount);
        
        // Withdraw from vault
        vault.redeem(shares, address(this), address(this));
        
        // Transfer to founder
        require(usdc.transfer(campaign.founder, usdcAmount), "USDC transfer failed");
        
        // Update state
        campaign.totalWithdrawn += usdcAmount;
        campaign.lastWithdrawal = block.timestamp;
        
        emit FounderWithdrawal(campaign.founder, usdcAmount, 0, usdcAmount);
        
        // Check if fully deployed
        uint256 remainingBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        if (remainingBalance < 1e6) { // Less than 1 USDC remaining
            campaign.state = CampaignState.FULLY_DEPLOYED;
        }
    }
    
    /**
     * @notice Claim yield rewards for investor
     */
    function claimYield() external updateCampaignState {
        require(investorYieldBalance[msg.sender] > 0, "No yield to claim");
        
        uint256 claimableYield = investorYieldBalance[msg.sender];
        investorYieldBalance[msg.sender] = 0;
        investorYieldClaimed[msg.sender] += claimableYield;
        
        // Withdraw the yield amount from vault first
        uint256 shares = vault.convertToShares(claimableYield);
        vault.redeem(shares, address(this), address(this));
        
        // Then transfer to investor
        require(usdc.transfer(msg.sender, claimableYield), "USDC transfer failed");
        
        emit InvestorYieldClaimed(msg.sender, claimableYield);
    }
    
    /**
     * @notice Update and distribute yield
     */
    function updateYield() external {
        _updateYield();
    }
    
    /**
     * @notice Get founder address
     */
    function getFounder() external view returns (address) {
        return campaign.founder;
    }
    
    /**
     * @notice Get equity token address
     */
    function getEquityToken() external view returns (address) {
        return address(campaign.equityToken);
    }
    
    /**
     * @notice Get campaign information (with state update)
     */
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
    
    /**
     * @notice Get campaign information (read-only, no state update)
     */
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
    
    /**
     * @notice Get investor information (with state update)
     */
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
    
    /**
     * @notice Get investor information (read-only, no state update)
     */
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
    
    /**
     * @notice Get current vault yield information (with state update)
     */
    function getYieldInfo() external updateCampaignState returns (
        uint256 totalVaultBalance,
        uint256 totalYieldAccrued,
        uint256 currentAPY
    ) {
        if (vault.balanceOf(address(this)) > 0) {
            totalVaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
            currentAPY = vault.getCurrentAPY();
        }
        
        // Calculate total yield accrued (simplified)
        totalYieldAccrued = totalYieldDistributed;
    }
    
    /**
     * @notice Get current vault yield information (read-only, no state update)
     */
    function getYieldInfoView() external view returns (
        uint256 totalVaultBalance,
        uint256 totalYieldAccrued,
        uint256 currentAPY
    ) {
        if (vault.balanceOf(address(this)) > 0) {
            totalVaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
            currentAPY = vault.getCurrentAPY();
        }
        
        // Calculate total yield accrued (simplified)
        totalYieldAccrued = totalYieldDistributed;
    }
    
    /**
     * @notice Check if founder can withdraw amount (with state update)
     */
    function canFounderWithdraw(uint256 usdcAmount) external updateCampaignState returns (bool, string memory) {
        if (campaign.state != CampaignState.COMPLETED) {
            return (false, "Campaign not completed");
        }
        
        // Get current vault balance
        uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        
        // ALWAYS enforce 2% monthly withdrawal rate - immutable security feature
        uint256 maxMonthlyWithdrawal = (vaultBalance * MAX_WITHDRAWAL_RATE) / BASIS_POINTS;
        if (usdcAmount > maxMonthlyWithdrawal) {
            return (false, "Exceeds 2% monthly withdrawal limit");
        }
        
        // Check time-based limits (for multiple withdrawals within same month)
        uint256 timeSinceLastWithdrawal = block.timestamp - campaign.lastWithdrawal;
        if (timeSinceLastWithdrawal < SECONDS_PER_MONTH && usdcAmount > maxMonthlyWithdrawal) {
            return (false, "Multiple withdrawals within month exceed limit");
        }
        
        if (vaultBalance < usdcAmount) {
            return (false, "Insufficient vault balance");
        }
        
        return (true, "Withdrawal allowed");
    }
    
    /**
     * @notice Check if founder can withdraw amount (read-only, no state update)
     */
    function canFounderWithdrawView(uint256 usdcAmount) external view returns (bool, string memory) {
        if (campaign.state != CampaignState.COMPLETED) {
            return (false, "Campaign not completed");
        }
        
        // Get current vault balance
        uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        
        // ALWAYS enforce 2% monthly withdrawal rate - immutable security feature
        uint256 maxMonthlyWithdrawal = (vaultBalance * MAX_WITHDRAWAL_RATE) / BASIS_POINTS;
        if (usdcAmount > maxMonthlyWithdrawal) {
            return (false, "Exceeds 2% monthly withdrawal limit");
        }
        
        // Check time-based limits (for multiple withdrawals within same month)
        uint256 timeSinceLastWithdrawal = block.timestamp - campaign.lastWithdrawal;
        if (timeSinceLastWithdrawal < SECONDS_PER_MONTH && usdcAmount > maxMonthlyWithdrawal) {
            return (false, "Multiple withdrawals within month exceed limit");
        }
        
        if (vaultBalance < usdcAmount) {
            return (false, "Insufficient vault balance");
        }
        
        return (true, "Withdrawal allowed");
    }
    
    // ============== INTERNAL FUNCTIONS ==============
    
    /**
     * @notice Complete the campaign
     */
    function _completeCampaign() internal {
        campaign.state = CampaignState.COMPLETED;
        campaign.completionTime = block.timestamp;
        
        // Different completion reasons
        bool reachedTarget = campaign.totalRaised >= config.targetRaise;
        bool reachedDeadline = block.timestamp >= config.deadline;
        
        // Charge platform success fee if target was reached
        if (reachedTarget || reachedDeadline) {
            uint256 platformFee = (campaign.totalRaised * PLATFORM_SUCCESS_FEE) / BASIS_POINTS;
            uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
            
            // Only charge fee if there are sufficient funds in vault
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
    
    /**
     * @notice Update and distribute yield
     */
    function _updateYield() internal {
        if (vault.balanceOf(address(this)) == 0) return;
        
        uint256 currentVaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
        uint256 lastBalance = campaign.totalRaised - campaign.totalWithdrawn + totalYieldDistributed;
        
        if (currentVaultBalance <= lastBalance) return;
        
        uint256 newYield = currentVaultBalance - lastBalance;
        if (newYield == 0) return;
        
        // Split yield according to immutable founder share (50/50)
        uint256 founderYield = (newYield * FOUNDER_YIELD_SHARE) / BASIS_POINTS;
        uint256 investorYield = newYield - founderYield;
        
        // Distribute to investors pro-rata
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
    
    /**
     * @notice Check withdrawal limits
     */
    function _checkWithdrawalLimits(uint256 usdcAmount) internal view {
        uint256 timeSinceLastWithdrawal = block.timestamp - campaign.lastWithdrawal;
        
        // If less than a month has passed, check limits
        if (timeSinceLastWithdrawal < SECONDS_PER_MONTH) {
            uint256 vaultBalance = vault.convertToAssets(vault.balanceOf(address(this)));
            uint256 maxMonthlyWithdrawal = (vaultBalance * MAX_WITHDRAWAL_RATE) / BASIS_POINTS;
            require(usdcAmount <= maxMonthlyWithdrawal, "Exceeds monthly withdrawal limit");
        }
    }
}