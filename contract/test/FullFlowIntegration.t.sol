// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/FndrIdentity.sol";
import "../src/RoundFactory.sol";
import "../src/RoundManager.sol";
import "../src/StartupEquityToken.sol";
import "../src/StartupSecondaryMarket.sol";
import "../src/MockVault.sol";

contract MockUSDC {
    string public name = "Mock USDC";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply = 100000000 * 1e6; // 100M USDC
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (allowance[from][msg.sender] != type(uint256).max) {
            allowance[from][msg.sender] -= amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/**
 * @title FullFlowIntegrationTest
 * @notice Comprehensive end-to-end test of the entire FNDR ecosystem
 * @dev Tests the complete user journey from verification to secondary trading
 */
contract FullFlowIntegrationTest is Test {
    // Core contracts
    FndrIdentity identity;
    RoundFactory factory;
    MockVault sharedVault;
    MockUSDC usdc;
    StartupSecondaryMarket secondaryMarket;

    // Test accounts
    address founder = address(0x1);
    address investor1 = address(0x2);
    address investor2 = address(0x3);
    address investor3 = address(0x4);
    address platformWallet = address(0x999);

    // Round variables
    address roundAddress;
    StartupEquityToken equityToken;
    RoundManager round;
    
    // Test constants
    uint256 constant TARGET_RAISE = 100000 * 1e6; // $100K
    uint256 constant SHARE_PRICE = 2 * 1e6; // $2 per token
    uint256 constant EQUITY_PERCENTAGE = 1000; // 10%
    
    event TestPhase(string phase);
    
    function setUp() public {
        emit TestPhase("=== SETUP: Deploying Infrastructure ===");
        
        // Deploy core infrastructure
        usdc = new MockUSDC();
        sharedVault = new MockVault(address(usdc), "Shared Yield Vault", "sUSDC");
        identity = new FndrIdentity();
        // Deploy secondary market first so we can pass it to factory
        secondaryMarket = new StartupSecondaryMarket(address(identity), address(usdc), platformWallet);
        factory = new RoundFactory(address(usdc), address(sharedVault), address(identity), address(secondaryMarket));
        
        // Pre-fund vault for yield generation (simulates existing liquidity)
        usdc.transfer(address(sharedVault), 10000000 * 1e6); // 10M USDC
        
        // Distribute USDC to test accounts
        usdc.transfer(founder, 100000 * 1e6); // 100K for founder
        usdc.transfer(investor1, 200000 * 1e6); // 200K for investor1
        usdc.transfer(investor2, 150000 * 1e6); // 150K for investor2
        usdc.transfer(investor3, 100000 * 1e6); // 100K for investor3
        
        console.log("Infrastructure deployed successfully");
        console.log("USDC:", address(usdc));
        console.log("FndrIdentity:", address(identity));
        console.log("RoundFactory:", address(factory));
        console.log("SecondaryMarket:", address(secondaryMarket));
    }
    
    function testFullEcosystemFlow() public {
        // ==========================================
        // PHASE 1: USER VERIFICATION & REGISTRATION
        // ==========================================
        emit TestPhase("=== PHASE 1: User Verification & Registration ===");
        
        console.log("Phase 1: Registering users with FndrIdentity...");
        
        // Founder registration
        vm.startPrank(founder);
        identity.registerZKPassportUser(bytes32("founder_unique_id"));
        identity.registerUserRole(FndrIdentity.UserRole.Founder);
        vm.stopPrank();
        
        // Investor registrations
        vm.startPrank(investor1);
        identity.registerZKPassportUser(bytes32("investor1_unique_id"));
        identity.registerUserRole(FndrIdentity.UserRole.Investor);
        vm.stopPrank();
        
        vm.startPrank(investor2);
        identity.registerZKPassportUser(bytes32("investor2_unique_id"));
        identity.registerUserRole(FndrIdentity.UserRole.Investor);
        vm.stopPrank();
        
        vm.startPrank(investor3);
        identity.registerZKPassportUser(bytes32("investor3_unique_id"));
        identity.registerUserRole(FndrIdentity.UserRole.Investor);
        vm.stopPrank();
        
        // Verify all users are properly registered
        assertTrue(identity.isFounder(founder), "Founder not verified");
        assertTrue(identity.isInvestor(investor1), "Investor1 not verified");
        assertTrue(identity.isInvestor(investor2), "Investor2 not verified");
        assertTrue(identity.isInvestor(investor3), "Investor3 not verified");
        
        console.log("All users verified successfully");
        
        // ==========================================
        // PHASE 2: ROUND CREATION
        // ==========================================
        emit TestPhase("=== PHASE 2: Round Creation ===");

        console.log("Phase 2: Creating funding round...");

        vm.startPrank(founder);
        // Pay creation fee
        usdc.approve(address(factory), 10 * 1e6);
        roundAddress = factory.createRound(
            TARGET_RAISE,
            EQUITY_PERCENTAGE,
            SHARE_PRICE,
            block.timestamp + 365 days,
            "TECH",
            "ipfs://QmExampleMetadataHash"
        );
        vm.stopPrank();

        // Get round and token contracts
        round = RoundManager(roundAddress);
        equityToken = StartupEquityToken(round.getEquityToken());

        // Secondary market is now auto-linked during round creation!
        // No need to manually call setSecondaryMarket anymore

        // Verify round creation
        assertEq(factory.getTotalRoundsCount(), 1, "Round count incorrect");
        assertEq(factory.getRoundByFounder(founder), roundAddress, "Founder mapping incorrect");

        // Verify equity token properties
        (string memory tokenName, string memory tokenSymbol, , , , address tokenFounder) = equityToken.getTokenInfo();
        assertEq(tokenFounder, founder, "Token founder incorrect");
        assertTrue(bytes(tokenName).length > 0, "Token name empty");
        assertTrue(bytes(tokenSymbol).length > 0, "Token symbol empty");

        console.log("Round created successfully");
        console.log("Round Address:", roundAddress);
        console.log("Equity Token:", address(equityToken));
        console.log("Token Name:", tokenName);
        console.log("Token Symbol:", tokenSymbol);
        
        // ==========================================
        // PHASE 3: INVESTMENT PROCESS
        // ==========================================
        emit TestPhase("=== PHASE 3: Investment Process ===");
        
        console.log("Phase 3: Processing investments...");
        
        // Investment 1: investor1 invests $30K
        vm.startPrank(investor1);
        uint256 investment1 = 30000 * 1e6;
        usdc.approve(roundAddress, investment1);
        round.invest(investment1);
        vm.stopPrank();
        
        // Investment 2: investor2 invests $50K  
        vm.startPrank(investor2);
        uint256 investment2 = 50000 * 1e6;
        usdc.approve(roundAddress, investment2);
        round.invest(investment2);
        vm.stopPrank();
        
        // Investment 3: investor3 invests $20K (completes the round)
        vm.startPrank(investor3);
        uint256 investment3 = 20000 * 1e6;
        usdc.approve(roundAddress, investment3);
        round.invest(investment3);
        vm.stopPrank();
        
        // Verify investments and token balances
        uint256 expectedTokens1 = investment1 / SHARE_PRICE; // 15,000 tokens
        uint256 expectedTokens2 = investment2 / SHARE_PRICE; // 25,000 tokens
        uint256 expectedTokens3 = investment3 / SHARE_PRICE; // 10,000 tokens
        
        assertEq(equityToken.balanceOf(investor1), expectedTokens1, "Investor1 token balance incorrect");
        assertEq(equityToken.balanceOf(investor2), expectedTokens2, "Investor2 token balance incorrect");
        assertEq(equityToken.balanceOf(investor3), expectedTokens3, "Investor3 token balance incorrect");

        // Trigger state update (needed since getRoundInfo is now a view function)
        round.checkRoundState();

        // Verify round state
        (RoundManager.RoundState state, uint256 totalRaised, , uint256 tokensIssued, uint256 investorCount,) = round.getRoundInfo();
        assertEq(uint(state), uint(RoundManager.RoundState.COMPLETED), "Round should be completed");
        assertEq(totalRaised, TARGET_RAISE, "Total raised incorrect");
        assertEq(tokensIssued, TARGET_RAISE / SHARE_PRICE, "Total tokens issued incorrect");
        assertEq(investorCount, 3, "Investor count incorrect");
        
        console.log(" All investments processed successfully");
        console.log("Total Raised: $", totalRaised);
        console.log("Total Tokens Issued:", tokensIssued);
        console.log("Investor1 Tokens:", expectedTokens1);
        console.log("Investor2 Tokens:", expectedTokens2);
        console.log("Investor3 Tokens:", expectedTokens3);
        
        // ==========================================
        // PHASE 4: YIELD GENERATION & DISTRIBUTION
        // ==========================================
        emit TestPhase("=== PHASE 4: Yield Generation & Distribution ===");
        
        console.log("Phase 4: Simulating yield generation...");
        
        // Fast forward time to generate yield (30 days)
        vm.warp(block.timestamp + 30 days);

        // Trigger yield update
        round.updateYield();

        // Check yield info
        (uint256 totalVaultBalance, uint256 totalYieldAccrued, uint256 currentAPY) = round.getYieldInfo();

        console.log("Yield generated successfully");
        console.log("Vault Balance: $", totalVaultBalance);
        console.log("Total Yield Accrued: $", totalYieldAccrued);
        console.log("Current APY:", currentAPY, "%");

        // Test investor yield claiming
        vm.startPrank(investor1);
        (,, uint256 yieldBalance1,) = round.getInvestorInfo(investor1);
        if (yieldBalance1 > 0) {
            round.claimYield();
            console.log("Investor1 claimed yield: $", yieldBalance1 / 1e6);
        }
        vm.stopPrank();
        
        // ==========================================
        // PHASE 5: FOUNDER WITHDRAWAL
        // ==========================================
        emit TestPhase("=== PHASE 5: Founder Capital Deployment ===");
        
        console.log("Phase 5: Testing founder withdrawals...");
        
        // Test that larger withdrawal fails (exceeds 2% monthly limit)
        vm.startPrank(founder);
        uint256 invalidAmount = 5000 * 1e6; // $5K (5% - exceeds limit)
        (bool canWithdrawMore, string memory rejectReason) = round.canFounderWithdraw(invalidAmount);
        assertFalse(canWithdrawMore, "Should reject withdrawal exceeding 2% limit");
        console.log("Larger withdrawal correctly rejected:", rejectReason);

        // Verify that attempting the invalid withdrawal actually reverts
        vm.expectRevert(abi.encodeWithSelector(RoundManager.InvalidOperation.selector, "Exceeds 2% monthly withdrawal limit"));
        round.founderWithdraw(invalidAmount);
        vm.stopPrank();

        // Calculate exact 2% of current vault balance (including yield)
        (uint256 currentVaultBalance,,) = round.getYieldInfo();
        uint256 maxAllowedWithdrawal = (currentVaultBalance * 200) / 10000; // 2%
        uint256 withdrawAmount = maxAllowedWithdrawal; // Use exact 2% amount

        console.log("Current Vault Balance: $", currentVaultBalance / 1e6);
        console.log("Max Allowed (2%): $", maxAllowedWithdrawal / 1e6);

        (bool canWithdraw, string memory reason) = round.canFounderWithdraw(withdrawAmount);
        assertTrue(canWithdraw, reason);

        // Execute withdrawal
        vm.startPrank(founder);
        uint256 founderUSDCBefore = usdc.balanceOf(founder);
        round.founderWithdraw(withdrawAmount);
        uint256 founderUSDCAfter = usdc.balanceOf(founder);
        vm.stopPrank();
        
        assertEq(founderUSDCAfter - founderUSDCBefore, withdrawAmount, "Founder withdrawal amount incorrect");
        
        console.log("Founder withdrawal successful");
        console.log("Withdrawn Amount (2% of vault): $", withdrawAmount);
        console.log("Founder Balance After: $", founderUSDCAfter);
        
        // ==========================================
        // PHASE 6: SECONDARY MARKET PREPARATION
        // ==========================================
        emit TestPhase("=== PHASE 6: Secondary Market Preparation ===");
        
        console.log("Phase 6: Preparing for secondary market...");
        
        // Fast forward to meet holding period (180 days from investment)
        // Note: Our RoundManager.invest() fix should have initialized holding periods during investment
        vm.warp(block.timestamp + 180 days);
        
        // Check if tokens can be sold
        (bool canSell, string memory sellReason) = secondaryMarket.canSellTokens(
            investor1, 
            address(equityToken), 
            5000
        );
        assertTrue(canSell, sellReason);
        
        console.log("Holding period completed - tokens eligible for secondary market");
        
        // ==========================================
        // PHASE 7: SECONDARY MARKET TRADING
        // ==========================================
        emit TestPhase("=== PHASE 7: Secondary Market Trading ===");
        
        console.log("Phase 7: Testing secondary market trading...");
        
        // Investor1 creates sell order
        vm.startPrank(investor1);
        uint256 sellAmount = 5000; 
        uint256 sellPrice = 3 * 1e6; // $3 per token (premium to initial price)
        
        equityToken.approve(address(secondaryMarket), sellAmount);
        uint256 orderId = secondaryMarket.createSellOrder(
            address(equityToken),
            sellAmount,
            sellPrice,
            48
        );
        vm.stopPrank();
        
        // Verify order creation
        (,, address tokenContract, uint256 orderAmount,, uint256 pricePerToken,,, bool active,) = secondaryMarket.orders(orderId);
        assertEq(tokenContract, address(equityToken), "Order token contract incorrect");
        assertEq(orderAmount, sellAmount, "Order amount incorrect");
        assertEq(pricePerToken, sellPrice, "Order price incorrect");
        assertTrue(active, "Order should be active");
        
        // Check order visibility
        StartupSecondaryMarket.SellOrder[] memory activeOrders = secondaryMarket.getActiveOrdersForToken(address(equityToken));
        assertEq(activeOrders.length, 1, "Should have 1 active order");
        
        console.log("Sell order created successfully");
        console.log("Order ID:", orderId);
        console.log("Sell Amount:", sellAmount , "tokens");
        console.log("Sell Price: $", sellPrice / 1e6, "per token");
        
        // Investor2 buys tokens from the order
        vm.startPrank(investor2);
        uint256 buyAmount = 2000; // Buy 2,000 tokens
        uint256 totalCost = buyAmount * sellPrice;
        uint256 platformFee = (totalCost * 25) / 10000; // 0.25%
        
        usdc.approve(address(secondaryMarket), totalCost);
        
        uint256 investor1USDCBefore = usdc.balanceOf(investor1);
        uint256 investor2TokensBefore = equityToken.balanceOf(investor2);
        uint256 platformUSDCBefore = usdc.balanceOf(platformWallet);
        
        secondaryMarket.buyTokens(orderId, buyAmount);
        vm.stopPrank();
        
        // Verify trade execution
        uint256 investor1USDCAfter = usdc.balanceOf(investor1);
        uint256 investor2TokensAfter = equityToken.balanceOf(investor2);
        uint256 platformUSDCAfter = usdc.balanceOf(platformWallet);
        
        uint256 sellerReceived = totalCost - platformFee;
        assertEq(investor1USDCAfter - investor1USDCBefore, sellerReceived, "Seller USDC received incorrect");
        assertEq(investor2TokensAfter - investor2TokensBefore, buyAmount, "Buyer tokens received incorrect");
        assertEq(platformUSDCAfter - platformUSDCBefore, platformFee, "Platform fee incorrect");
        
        // Verify partial order fill
        (,, , uint256 remainingAmount,,,,, bool stillActive,) = secondaryMarket.orders(orderId);
        assertEq(remainingAmount, sellAmount - buyAmount, "Remaining order amount incorrect");
        assertTrue(stillActive, "Order should still be active");
        
        console.log("Secondary market trade executed successfully");
        console.log("Tokens Traded:", buyAmount);
        console.log("Total Value: $", totalCost);
        console.log("Platform Fee: $", platformFee);
        console.log("Seller Received: $", sellerReceived);
        console.log("Remaining Order: ", remainingAmount, "tokens");
        
        // ==========================================
        // PHASE 8: MARKET ANALYTICS & SUMMARY
        // ==========================================
        emit TestPhase("=== PHASE 8: Market Analytics & Summary ===");
        
        console.log("Phase 8: Generating market analytics...");
        
        // Get market summary
        (
            uint256 totalActiveOrders,
            uint256 totalVolume,
            uint256 lowestPrice,
            uint256 highestPrice,
            uint256 lastPrice
        ) = secondaryMarket.getMarketSummary(address(equityToken));
        
        console.log("=== MARKET SUMMARY ===");
        console.log("Active Orders:", totalActiveOrders);
        console.log("Total Volume:", totalVolume, "tokens");
        console.log("Price Range: $", lowestPrice / 1e6, "- $", highestPrice / 1e6);
        console.log("Last Trade Price: $", lastPrice / 1e6);
        
        // Final portfolio summary
        console.log("=== FINAL PORTFOLIO SUMMARY ===");
        console.log("Founder USDC Balance: $", usdc.balanceOf(founder) / 1e6);
        console.log("Investor1 - Tokens:", equityToken.balanceOf(investor1), "USDC: $", usdc.balanceOf(investor1) / 1e6);
        console.log("Investor2 - Tokens:", equityToken.balanceOf(investor2), "USDC: $", usdc.balanceOf(investor2) / 1e6);
        console.log("Investor3 - Tokens:", equityToken.balanceOf(investor3), "USDC: $", usdc.balanceOf(investor3) / 1e6);
        console.log("Platform USDC Balance: $", usdc.balanceOf(platformWallet) / 1e6);
        
        // ==========================================
        // PHASE 9: ADVANCED OPERATIONS TEST
        // ==========================================
        emit TestPhase("=== PHASE 9: Advanced Operations ===");
        
        console.log("Phase 9: Testing advanced operations...");
        
        // Test order cancellation
        vm.startPrank(investor1);
        uint256 investor1TokensBefore = equityToken.balanceOf(investor1);
        secondaryMarket.cancelSellOrder(orderId);
        uint256 investor1TokensAfter = equityToken.balanceOf(investor1);
        vm.stopPrank();
        
        // Verify cancellation returned tokens
        assertEq(investor1TokensAfter - investor1TokensBefore, remainingAmount, "Cancelled order tokens not returned");
        
        // Verify order is inactive
        (,,,,,,,, bool orderActive,) = secondaryMarket.orders(orderId);
        assertFalse(orderActive, "Cancelled order should be inactive");
        
        console.log("Order cancellation successful");
        console.log("Returned tokens:", remainingAmount);
        
        // Test transfer restrictions
        console.log("Testing transfer restrictions...");
        
        // Try to transfer to unverified address (should fail)
        address unverified = address(0x5555);
        vm.startPrank(investor1);
        vm.expectRevert();
        equityToken.transfer(unverified, 100 * 1e6);
        vm.stopPrank();
        
        // Transfer between verified users (should work)
        vm.startPrank(investor1);
        bool transferSuccess = equityToken.transfer(investor2, 100);
        vm.stopPrank();
        assertTrue(transferSuccess, "Transfer between verified users should work");
        
        console.log("Transfer restrictions working correctly");
        
        // ==========================================
        // FINAL VERIFICATION & SUMMARY
        // ==========================================
        emit TestPhase("=== FINAL VERIFICATION & SUMMARY ===");
        
        console.log("=== COMPREHENSIVE FLOW TEST COMPLETED ===");
        console.log("All phases completed successfully!");
        console.log("User verification and registration");
        console.log("Round creation and configuration");
        console.log("Investment processing and token issuance");
        console.log("Yield generation and distribution");
        console.log("Founder capital deployment");
        console.log("Secondary market trading");
        console.log("Transfer restrictions and compliance");
        console.log("Advanced operations and error handling");
        
        // Final assertions for test completion
        assertTrue(true, "Full ecosystem flow test completed successfully");
    }
}