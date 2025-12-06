// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/StartupSecondaryMarket.sol";
import "../src/FndrIdentity.sol";
import "../src/StartupEquityToken.sol";

contract MockUSDC {
    string public name = "Mock USDC";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply = 10000000 * 1e6;
    
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

contract StartupSecondaryMarketTest is Test {
    StartupSecondaryMarket market;
    FndrIdentity identity;
    StartupEquityToken equityToken;
    MockUSDC usdc;
    
    address seller = address(0x1);
    address buyer = address(0x2);
    address platformWallet = address(0x999);
    
    uint256 constant TOKEN_AMOUNT = 10000 * 1e6; // 10,000 tokens
    uint256 constant TOKEN_PRICE = 2 * 1e6; // $2 per token
    
    function setUp() public {
        // Deploy contracts
        usdc = new MockUSDC();
        identity = new FndrIdentity();
        market = new StartupSecondaryMarket(address(identity), address(usdc), platformWallet);
        
        // Create equity token
        equityToken = new StartupEquityToken(
            "Test Equity",
            "TEST",
            "TestCorp",
            1000, // 10%
            seller,
            address(this),
            address(identity)
        );
        
        // Set up verified users
        vm.startPrank(seller);
        identity.registerZKPassportUser(bytes32("seller_id"));
        identity.registerUserRole(FndrIdentity.UserRole.Investor);
        vm.stopPrank();
        
        vm.startPrank(buyer);
        identity.registerZKPassportUser(bytes32("buyer_id"));
        identity.registerUserRole(FndrIdentity.UserRole.Investor);
        vm.stopPrank();
        
        // Mint tokens to seller
        equityToken.mintToInvestor(seller, TOKEN_AMOUNT);
        
        // Give users USDC
        usdc.transfer(seller, 100000 * 1e6);
        usdc.transfer(buyer, 100000 * 1e6);
        
        // Set secondary market in equity token
        vm.prank(seller);
        equityToken.setSecondaryMarket(address(market));
        
        // Fast forward to simulate holding period
        vm.warp(block.timestamp + 181 days); // Just past 180 day holding period
    }
    
    function testCreateSellOrder() public {
        vm.startPrank(seller);
        
        // Approve market to spend tokens
        equityToken.approve(address(market), TOKEN_AMOUNT);
        
        // Create sell order
        uint256 orderId = market.createSellOrder(
            address(equityToken),
            5000 * 1e6, // 5,000 tokens
            TOKEN_PRICE,
            24 // 24 hours
        );
        
        vm.stopPrank();
        
        // Verify order was created
        (
            uint256 orderIdReturned,
            address orderSeller,
            address tokenContract,
            uint256 amount,
            uint256 originalAmount,
            uint256 pricePerToken,
            uint256 createdAt,
            uint256 expiryTime,
            bool active,
            bytes32 partition
        ) = market.orders(orderId);
        
        assertEq(orderIdReturned, orderId);
        assertEq(orderSeller, seller);
        assertEq(tokenContract, address(equityToken));
        assertEq(amount, 5000 * 1e6);
        assertEq(originalAmount, 5000 * 1e6);
        assertEq(pricePerToken, TOKEN_PRICE);
        assertTrue(active);
        assertEq(expiryTime, block.timestamp + 24 hours);
        
        // Verify tokens were escrowed
        assertEq(equityToken.balanceOf(address(market)), 5000 * 1e6);
        assertEq(equityToken.balanceOf(seller), 5000 * 1e6); // Remaining tokens
    }
    
    function testBuyTokens() public {
        // Create sell order first
        vm.startPrank(seller);
        equityToken.approve(address(market), TOKEN_AMOUNT);
        uint256 orderId = market.createSellOrder(
            address(equityToken),
            5000 * 1e6,
            TOKEN_PRICE,
            24
        );
        vm.stopPrank();
        
        // Buy tokens
        vm.startPrank(buyer);
        uint256 buyAmount = 2000 * 1e6; // Buy 2,000 tokens
        uint256 totalPrice = buyAmount * TOKEN_PRICE; // $4,000
        uint256 platformFee = (totalPrice * 25) / 10000; // 0.25% fee
        uint256 sellerReceives = totalPrice - platformFee;
        
        // Approve USDC spending
        usdc.approve(address(market), totalPrice);
        
        // Record balances before
        uint256 sellerUSDCBefore = usdc.balanceOf(seller);
        uint256 buyerTokensBefore = equityToken.balanceOf(buyer);
        uint256 platformUSDCBefore = usdc.balanceOf(platformWallet);
        
        // Execute buy
        market.buyTokens(orderId, buyAmount);
        vm.stopPrank();
        
        // Verify transfers
        assertEq(usdc.balanceOf(seller), sellerUSDCBefore + sellerReceives);
        assertEq(usdc.balanceOf(platformWallet), platformUSDCBefore + platformFee);
        assertEq(equityToken.balanceOf(buyer), buyerTokensBefore + buyAmount);
        
        // Verify order was partially filled
        (, , , uint256 remainingAmount, , , , , bool active, ) = market.orders(orderId);
        assertEq(remainingAmount, 3000 * 1e6); // 5000 - 2000 = 3000
        assertTrue(active); // Order still active for remaining tokens
    }
    
    function testFullOrderFill() public {
        // Create sell order
        vm.startPrank(seller);
        equityToken.approve(address(market), TOKEN_AMOUNT);
        uint256 orderId = market.createSellOrder(
            address(equityToken),
            5000 * 1e6,
            TOKEN_PRICE,
            24
        );
        vm.stopPrank();
        
        // Buy all tokens
        vm.startPrank(buyer);
        uint256 totalPrice = 5000 * 1e6 * TOKEN_PRICE;
        usdc.approve(address(market), totalPrice);
        market.buyTokens(orderId, 5000 * 1e6);
        vm.stopPrank();
        
        // Verify order was completely filled
        (, , , uint256 remainingAmount, , , , , bool active, ) = market.orders(orderId);
        assertEq(remainingAmount, 0);
        assertFalse(active); // Order should be inactive
    }
    
    function testCancelSellOrder() public {
        // Create sell order
        vm.startPrank(seller);
        equityToken.approve(address(market), TOKEN_AMOUNT);
        uint256 orderId = market.createSellOrder(
            address(equityToken),
            5000 * 1e6,
            TOKEN_PRICE,
            24
        );
        
        // Record balance before cancellation
        uint256 balanceBefore = equityToken.balanceOf(seller);
        
        // Cancel order
        market.cancelSellOrder(orderId);
        vm.stopPrank();
        
        // Verify order was cancelled and tokens returned
        (, , , uint256 amount, , , , , bool active, ) = market.orders(orderId);
        assertEq(amount, 0);
        assertFalse(active);
        assertEq(equityToken.balanceOf(seller), balanceBefore + 5000 * 1e6);
        assertEq(equityToken.balanceOf(address(market)), 0);
    }
    
    function testGetActiveOrders() public {
        // Create multiple orders
        vm.startPrank(seller);
        equityToken.approve(address(market), TOKEN_AMOUNT);
        
        uint256 orderId1 = market.createSellOrder(address(equityToken), 2000 * 1e6, TOKEN_PRICE, 24);
        uint256 orderId2 = market.createSellOrder(address(equityToken), 3000 * 1e6, TOKEN_PRICE + 1e6, 48);
        vm.stopPrank();
        
        // Get active orders
        StartupSecondaryMarket.SellOrder[] memory activeOrders = market.getActiveOrdersForToken(address(equityToken));
        
        assertEq(activeOrders.length, 2);
        assertEq(activeOrders[0].orderId, orderId1);
        assertEq(activeOrders[1].orderId, orderId2);
        assertEq(activeOrders[0].amount, 2000 * 1e6);
        assertEq(activeOrders[1].amount, 3000 * 1e6);
    }
    
    function testHoldingPeriodRestriction() public {
        // Reset timestamp to simulate new purchase
        vm.warp(block.timestamp - 200 days);
        
        vm.startPrank(seller);
        equityToken.approve(address(market), TOKEN_AMOUNT);
        
        // Should fail due to holding period
        vm.expectRevert("Holding period not met");
        market.createSellOrder(address(equityToken), 1000 * 1e6, TOKEN_PRICE, 24);
        vm.stopPrank();
    }
    
    function testGetMarketSummary() public {
        // Create orders at different prices
        vm.startPrank(seller);
        equityToken.approve(address(market), TOKEN_AMOUNT);
        
        market.createSellOrder(address(equityToken), 1000 * 1e6, 1 * 1e6, 24); // $1
        market.createSellOrder(address(equityToken), 2000 * 1e6, 2 * 1e6, 24); // $2
        market.createSellOrder(address(equityToken), 1500 * 1e6, 3 * 1e6, 24); // $3
        vm.stopPrank();
        
        (
            uint256 totalActiveOrders,
            uint256 totalVolume,
            uint256 lowestPrice,
            uint256 highestPrice,
            uint256 lastPrice
        ) = market.getMarketSummary(address(equityToken));
        
        assertEq(totalActiveOrders, 3);
        assertEq(totalVolume, 4500 * 1e6); // 1000 + 2000 + 1500
        assertEq(lowestPrice, 1 * 1e6);
        assertEq(highestPrice, 3 * 1e6);
        assertEq(lastPrice, 0); // No trades yet
    }
    
    function testUnauthorizedAccess() public {
        // Try to create order without verification
        address unverified = address(0x999);
        vm.startPrank(unverified);
        
        vm.expectRevert("User not verified");
        market.createSellOrder(address(equityToken), 1000 * 1e6, TOKEN_PRICE, 24);
        vm.stopPrank();
    }
    
    function testCannotBuyOwnOrder() public {
        // Create sell order
        vm.startPrank(seller);
        equityToken.approve(address(market), TOKEN_AMOUNT);
        uint256 orderId = market.createSellOrder(address(equityToken), 1000 * 1e6, TOKEN_PRICE, 24);
        
        // Try to buy own order
        usdc.approve(address(market), 1000 * 1e6 * TOKEN_PRICE);
        vm.expectRevert("Cannot buy own order");
        market.buyTokens(orderId, 1000 * 1e6);
        vm.stopPrank();
    }
}