// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MockVault.sol";

contract MockUSDC {
    string public name = "Mock USDC";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply = 1000000 * 1e6; // 1M USDC
    
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

contract MockYieldVaultTest is Test {
    MockVault vault;
    MockUSDC usdc;
    address alice = address(0x1);
    address bob = address(0x2);
    
    function setUp() public {
        usdc = new MockUSDC();
        vault = new MockVault(address(usdc), "Fndr Vault", "fUSDC");
        
        // Give Alice and Bob some USDC
        usdc.transfer(alice, 10000 * 1e6);
        usdc.transfer(bob, 10000 * 1e6);
        
        // Pre-fund the vault with extra USDC to simulate yield generation
        usdc.transfer(address(vault), 100000 * 1e6); // 100K USDC for yield
    }
    
    function testDeposit() public {
        uint256 depositAmount = 1000 * 1e6; // 1000 USDC
        
        vm.startPrank(alice);
        usdc.approve(address(vault), depositAmount);
        
        console.log("Alice USDC balance before deposit:", usdc.balanceOf(alice));
        console.log("Total assets in vault before deposit:", vault.totalAssets());
        console.log("Vault USDC balance before deposit:", usdc.balanceOf(address(vault)));
        uint256 sharesBefore = vault.balanceOf(alice);
        vault.deposit(depositAmount, alice);
        uint256 sharesAfter = vault.balanceOf(alice);
        console.log("Alice USDC balance after deposit:", usdc.balanceOf(alice));
        console.log("Shares received:", sharesAfter - sharesBefore);
        console.log("Total assets in vault after deposit:", vault.totalAssets());
        console.log("Vault USDC balance after deposit:", usdc.balanceOf(address(vault)));

        
        assertEq(sharesAfter - sharesBefore, depositAmount);
        assertEq(vault.totalAssets(), depositAmount);
        vm.stopPrank();
    }
    
    function testYieldGeneration() public {
        uint256 depositAmount = 1000 * 1e6; // 1000 USDC
        
        // Alice deposits
        vm.startPrank(alice);
        usdc.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, alice);
        vm.stopPrank();
        
        // Fast forward 1 year
        vm.warp(block.timestamp + 365 days);
        
        // Check yield generation (should be ~6% = 60 USDC)
        uint256 totalAssetsAfterYear = vault.totalAssets();
        uint256 expectedYield = (depositAmount * 6) / 100; // 6% of 1000 = 60 USDC
        
        // Allow 1% margin for precision
        assertApproxEqRel(totalAssetsAfterYear, depositAmount + expectedYield, 0.01e18);
    }
    
    function testWithdrawAfterYield() public {
        uint256 depositAmount = 1000 * 1e6; // 1000 USDC
        
        // Alice deposits
        vm.startPrank(alice);
        uint256 aliceBalancesBeforeDeposit = usdc.balanceOf(alice);
        usdc.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, alice);
        vm.stopPrank();
        
        // Fast forward 6 months
        vm.warp(block.timestamp + 182 days);
        
        // Alice withdraws everything
        vm.startPrank(alice);
        uint256 shares = vault.balanceOf(alice);
        
        vault.redeem(shares, alice, alice);
        
        uint256 aliceBalanceAfterWithdraw = usdc.balanceOf(alice);
        uint256 expectedYield = (depositAmount * 3) / 100; // ~3% for 6 months
        
        // Alice should have original amount + ~3% yield
        assertGt(aliceBalanceAfterWithdraw, aliceBalancesBeforeDeposit);
        assertApproxEqRel(aliceBalancesBeforeDeposit + expectedYield, aliceBalanceAfterWithdraw, 0.01e18);
        vm.stopPrank();
    }
    
    function testMultipleUsers() public {
        uint256 aliceDeposit = 1000 * 1e6; // 1000 USDC
        uint256 bobDeposit = 500 * 1e6;   // 500 USDC
        
        // Alice deposits
        console.log("=== Alice before deposits ===");
        console.log("Alice USDC balance before deposit:", usdc.balanceOf(alice));
        console.log("Total assets in vault before deposit:", vault.totalAssets());
        console.log("Alice shares before deposit:", vault.balanceOf(alice));   
        console.log("Total shares in vault before Alice deposit:", vault.totalSupply());
        vm.startPrank(alice);
        usdc.approve(address(vault), aliceDeposit);
        vault.deposit(aliceDeposit, alice);
        vm.stopPrank();

        console.log("=== Alice after deposits ===");
        console.log("Alice USDC balance after deposit:", usdc.balanceOf(alice));
        console.log("Total assets in vault after deposit:", vault.totalAssets());
        console.log("Alice shares after deposit:", vault.balanceOf(alice));
        console.log("Total shares in vault after Alice deposit:", vault.totalSupply());
        
        // Bob deposits after 3 months
        console.log("=== Bob before deposits ===");
        console.log("Bob USDC balance before deposit:", usdc.balanceOf(bob));
        console.log("Total assets in vault before deposit:", vault.totalAssets());
        console.log("Bob shares before deposit:", vault.balanceOf(bob));
        
        vm.warp(block.timestamp + 90 days);
        assertGt(vault.totalAssets(), aliceDeposit);
        assertEq(vault.totalSupply(), aliceDeposit);

        console.log("=== Time warped 3 months (Alice Yield Accrual) ===");
        console.log("Total assets in vault after 3 months:", vault.totalAssets());
        vm.startPrank(bob);
        usdc.approve(address(vault), bobDeposit);
        vault.deposit(bobDeposit, bob);
        vm.stopPrank();
        assertEq(vault.totalSupply(), vault.balanceOf(alice) + vault.balanceOf(bob));
        
        console.log("=== Bob after deposits ===");
        console.log("Bob USDC balance after deposit:", usdc.balanceOf(bob));
        console.log("Total assets in vault after deposit:", vault.totalAssets());
        console.log("Bob shares after deposit:", vault.balanceOf(bob));
        console.log("Total shares in vault after Bob deposit:", vault.totalSupply());

        // Fast forward another 3 months
        vm.warp(block.timestamp + 90 days);

        console.log("=== Time warped after 6 months (Both Yield Accrual) ===");
        console.log("Total assets in vault after 6 months:", vault.totalAssets());
        console.log("Total shares in vault after 6 months:", vault.totalSupply());

        assertEq(vault.totalSupply(), vault.balanceOf(alice) + vault.balanceOf(bob));
        
        // Both withdraw
        vm.prank(alice);
        uint256 aliceShares = vault.balanceOf(alice);
        vm.prank(alice);
        vault.redeem(aliceShares, alice, alice);

        console.log("=== Alice after withdrawal ===");
        console.log("Alice USDC balance after withdrawal:", usdc.balanceOf(alice));
        console.log("Total assets in vault after Alice withdrawal:", vault.totalAssets());
        console.log("Total shares in vault after Alice withdrawal:", vault.totalSupply());
        console.log("Alice shares after withdrawal:", vault.balanceOf(alice));

        assertEq(vault.totalSupply(), vault.balanceOf(bob));
        assertEq(vault.balanceOf(alice), 0);
        
        vm.prank(bob);
        uint256 bobShares = vault.balanceOf(bob);
        vm.prank(bob);
        vault.redeem(bobShares, bob, bob);

        console.log("=== Bob after withdrawal ===");
        console.log("Bob USDC balance after withdrawal:", usdc.balanceOf(bob));
        console.log("Total assets in vault after Bob withdrawal:", vault.totalAssets());
        console.log("Total shares in vault after Bob withdrawal:", vault.totalSupply());
        console.log("Bob shares after withdrawal:", vault.balanceOf(bob));

        assertEq(vault.totalSupply(), 0);
        assertEq(vault.balanceOf(bob), 0);
        assertEq(vault.totalAssets(), 0);
    }
    
    function testAPYView() public view {
        assertEq(vault.getCurrentAPY(), 6);
    }
}