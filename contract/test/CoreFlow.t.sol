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
    uint256 public totalSupply = 100000000 * 1e6;

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

contract CoreFlowTest is Test {
    FndrIdentity identity;
    RoundFactory factory;
    MockVault sharedVault;
    MockUSDC usdc;
    StartupSecondaryMarket secondaryMarket;

    address founder = address(0x1);
    address investor1 = address(0x2);
    address investor2 = address(0x3);
    address platformWallet = address(0x999);

    function setUp() public {
        // Deploy infrastructure
        usdc = new MockUSDC();
        sharedVault = new MockVault(address(usdc), "Shared Yield Vault", "sUSDC");
        identity = new FndrIdentity();
        // Deploy secondary market first so we can pass it to factory
        secondaryMarket = new StartupSecondaryMarket(address(identity), address(usdc), platformWallet);
        factory = new RoundFactory(address(usdc), address(sharedVault), address(identity), address(secondaryMarket));

        // Fund vault and users
        usdc.transfer(address(sharedVault), 1000000 * 1e6);
        usdc.transfer(founder, 50000 * 1e6);
        usdc.transfer(investor1, 100000 * 1e6);
        usdc.transfer(investor2, 100000 * 1e6);

        // Register users
        vm.prank(founder);
        identity.registerZKPassportUser(bytes32("founder_id"));
        vm.prank(founder);
        identity.registerUserRole(FndrIdentity.UserRole.Founder);

        vm.prank(investor1);
        identity.registerZKPassportUser(bytes32("investor1_id"));
        vm.prank(investor1);
        identity.registerUserRole(FndrIdentity.UserRole.Investor);

        vm.prank(investor2);
        identity.registerZKPassportUser(bytes32("investor2_id"));
        vm.prank(investor2);
        identity.registerUserRole(FndrIdentity.UserRole.Investor);
    }

    function testCompleteFlow() public {
        // 1. Create round
        vm.startPrank(founder);
        usdc.approve(address(factory), 10 * 1e6);

        address roundAddr = factory.createRound(
            50000 * 1e6,      // targetRaise
            1000,             // equityPercentage
            1 * 1e6,          // sharePrice
            block.timestamp + 365 days,  // deadline
            "TEST",           // companySymbol
            "ipfs://QmTestMetadata"  // metadataURI
        );
        vm.stopPrank();

        RoundManager round = RoundManager(roundAddr);
        StartupEquityToken token = StartupEquityToken(round.getEquityToken());

        // Set secondary market (automatically whitelists it)
        vm.prank(founder);
        token.setSecondaryMarket(address(secondaryMarket));

        // 2. Investments
        vm.startPrank(investor1);
        usdc.approve(roundAddr, 30000 * 1e6);
        round.invest(30000 * 1e6);
        vm.stopPrank();

        vm.startPrank(investor2);
        usdc.approve(roundAddr, 20000 * 1e6);
        round.invest(20000 * 1e6);
        vm.stopPrank();

        // Verify investments (tokens have 6 decimals, so no need for * 1e6)
        assertEq(token.balanceOf(investor1), 30000);
        assertEq(token.balanceOf(investor2), 20000);

        // 3. Round completion check (trigger state update first)
        round.checkRoundState();
        (RoundManager.RoundState state, uint256 totalRaised,,,,) = round.getRoundInfo();
        assertEq(uint(state), uint(RoundManager.RoundState.COMPLETED));
        assertEq(totalRaised, 50000 * 1e6);

        // 4. Yield generation
        vm.warp(block.timestamp + 30 days);
        round.updateYield();
        (uint256 vaultBalance,,) = round.getYieldInfo();
        assertTrue(vaultBalance > 49500 * 1e6); // Should have generated some yield

        // 5. Founder withdrawal (calculate exact 2% of current vault balance)
        vm.startPrank(founder);
        (uint256 currentVaultBalance,,) = round.getYieldInfo();
        uint256 validWithdrawal = (currentVaultBalance * 200) / 10000; // Exact 2%
        (bool canWithdraw,) = round.canFounderWithdraw(validWithdrawal);
        assertTrue(canWithdraw);
        round.founderWithdraw(validWithdrawal);

        // Test that larger withdrawal fails (use 5% of original balance as invalid amount)
        uint256 invalidWithdrawal = (currentVaultBalance * 500) / 10000; // 5% - exceeds 2% limit
        (bool canWithdrawMore,) = round.canFounderWithdraw(invalidWithdrawal);
        assertFalse(canWithdrawMore);
        vm.stopPrank();

        // 6. Secondary market (after holding period)
        vm.warp(block.timestamp + 180 days);

        vm.startPrank(investor1);
        uint256 sellAmount = 10000; // 10,000 tokens (no * 1e6 since tokens already have 6 decimals)
        token.approve(address(secondaryMarket), sellAmount);
        uint256 orderId = secondaryMarket.createSellOrder(
            address(token),
            sellAmount,
            2 * 1e6, // $2 per token (price in USDC needs 6 decimals)
            24
        );
        vm.stopPrank();

        // Buy from secondary market
        vm.startPrank(investor2);
        uint256 buyAmount = 5000; // 5,000 tokens
        uint256 totalCost = buyAmount * (2 * 1e6); // Calculate total USDC cost
        usdc.approve(address(secondaryMarket), totalCost);
        secondaryMarket.buyTokens(orderId, buyAmount);
        vm.stopPrank();

        // Verify secondary market trade
        assertTrue(token.balanceOf(investor2) > 20000); // Original + bought tokens
        assertTrue(token.balanceOf(investor1) < 30000); // Original - sold + escrowed tokens

        // Test complete!
        assertTrue(true);
    }

    function testTransferRestrictions() public {
        // Create a simple round and token
        vm.startPrank(founder);
        usdc.approve(address(factory), 10 * 1e6);

        address roundAddr = factory.createRound(
            10000 * 1e6,
            1000,
            1 * 1e6,
            block.timestamp + 365 days,
            "RESTRICT",
            ""
        );
        vm.stopPrank();

        RoundManager round = RoundManager(roundAddr);
        StartupEquityToken token = StartupEquityToken(round.getEquityToken());

        // Invest
        vm.startPrank(investor1);
        usdc.approve(roundAddr, 10000 * 1e6);
        round.invest(10000 * 1e6);
        vm.stopPrank();

        // Test restriction: unverified recipient
        address unverified = address(0x4444);
        vm.startPrank(investor1);
        vm.expectRevert();
        token.transfer(unverified, 1000); // 1,000 tokens
        vm.stopPrank();

        // Test allowed: verified recipient
        vm.startPrank(investor1);
        bool success = token.transfer(investor2, 1000); // 1,000 tokens
        vm.stopPrank();

        assertTrue(success);
        assertEq(token.balanceOf(investor2), 1000);
        assertEq(token.balanceOf(investor1), 9000);
    }

    function testYieldDistribution() public {
        // Create round and invest
        vm.startPrank(founder);
        usdc.approve(address(factory), 10 * 1e6);

        address roundAddr = factory.createRound(
            20000 * 1e6,
            1000,
            1 * 1e6,
            block.timestamp + 365 days,
            "YIELD",
            ""
        );
        vm.stopPrank();

        RoundManager round = RoundManager(roundAddr);

        // Two investors with different amounts
        vm.startPrank(investor1);
        usdc.approve(roundAddr, 15000 * 1e6); // 75% of round
        round.invest(15000 * 1e6);
        vm.stopPrank();

        vm.startPrank(investor2);
        usdc.approve(roundAddr, 5000 * 1e6); // 25% of round
        round.invest(5000 * 1e6);
        vm.stopPrank();

        // Generate yield
        vm.warp(block.timestamp + 60 days); // 2 months
        round.updateYield();

        // Check investor yield balances
        (,, uint256 yield1,) = round.getInvestorInfo(investor1);
        (,, uint256 yield2,) = round.getInvestorInfo(investor2);

        // investor1 should get ~75% of investor yield share
        // investor2 should get ~25% of investor yield share
        assertTrue(yield1 > 0);
        assertTrue(yield2 > 0);
        assertTrue(yield1 > yield2 * 2); // Roughly 3:1 ratio (75:25)

        // Test yield claiming
        vm.startPrank(investor1);
        if (yield1 > 0) {
            uint256 balanceBefore = usdc.balanceOf(investor1);
            round.claimYield();
            uint256 balanceAfter = usdc.balanceOf(investor1);
            assertEq(balanceAfter - balanceBefore, yield1);
        }
        vm.stopPrank();
    }
}
