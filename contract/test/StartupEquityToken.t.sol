// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;

// import "forge-std/Test.sol";
// import "../src/StartupEquityToken.sol";

// contract StartupEquityTokenTest is Test {
//     StartupEquityToken token;
    
//     address founder = address(0x1);
//     address campaign = address(0x2);
//     address investor1 = address(0x3);
//     address investor2 = address(0x4);
//     address unauthorized = address(0x5);
    
//     string constant TOKEN_NAME = "TechStartup Equity Token";
//     string constant TOKEN_SYMBOL = "TECH";
//     string constant COMPANY_NAME = "TechStartup Inc";
//     uint256 constant EQUITY_PERCENTAGE = 1000; // 10%
    
//     bytes32 constant DEFAULT_PARTITION = 0x0000000000000000000000000000000000000000000000000000000000000000;
    
//     function setUp() public {
//         token = new StartupEquityToken(
//             TOKEN_NAME,
//             TOKEN_SYMBOL,
//             COMPANY_NAME,
//             EQUITY_PERCENTAGE,
//             founder,
//             campaign
//         );
//     }
    
//     function testInitialSetup() public view {
//         assertEq(token.name(), TOKEN_NAME);
//         assertEq(token.symbol(), TOKEN_SYMBOL);
//         assertEq(token.companyName(), COMPANY_NAME);
//         assertEq(token.equityPercentage(), EQUITY_PERCENTAGE);
//         assertEq(token.founder(), founder);
//         assertEq(token.campaign(), campaign);
//         assertEq(token.totalSupply(), 0);
        
//         assertTrue(token.isWhitelisted(founder));
//         assertTrue(token.isWhitelisted(campaign));
//         assertFalse(token.isWhitelisted(investor1));
//     }
    
//     function testMintToInvestor() public {
//         uint256 mintAmount = 1000 * 1e6;
        
//         vm.prank(campaign);
//         token.mintToInvestor(investor1, mintAmount);
        
//         assertEq(token.balanceOf(investor1), mintAmount);
//         assertEq(token.totalSupply(), mintAmount);
//         assertEq(token.balanceOfByPartition(DEFAULT_PARTITION, investor1), mintAmount);
//         assertTrue(token.isWhitelisted(investor1));
//     }
    
//     function testMintToInvestorOnlyCampaign() public {
//         uint256 mintAmount = 1000 * 1e6;
        
//         // Unauthorized address cannot mint
//         vm.prank(unauthorized);
//         vm.expectRevert("Only campaign can call this");
//         token.mintToInvestor(investor1, mintAmount);
        
//         // Founder cannot mint directly
//         vm.prank(founder);
//         vm.expectRevert("Only campaign can call this");
//         token.mintToInvestor(investor1, mintAmount);
//     }
    
//     function testTransferBetweenWhitelistedUsers() public {
//         uint256 mintAmount = 1000 * 1e6;
//         uint256 transferAmount = 100 * 1e6;
        
//         // Mint tokens to investor1
//         vm.prank(campaign);
//         token.mintToInvestor(investor1, mintAmount);
        
//         // Whitelist investor2
//         vm.prank(founder);
//         token.addToWhitelist(investor2);
        
//         // Transfer should work between whitelisted users
//         vm.prank(investor1);
//         token.transfer(investor2, transferAmount);
        
//         assertEq(token.balanceOf(investor1), mintAmount - transferAmount);
//         assertEq(token.balanceOf(investor2), transferAmount);
//         assertEq(token.balanceOfByPartition(DEFAULT_PARTITION, investor1), mintAmount - transferAmount);
//         assertEq(token.balanceOfByPartition(DEFAULT_PARTITION, investor2), transferAmount);
//         assertEq(token.totalSupply(), mintAmount);
//     }
    
//     function testTransferRestrictionsForNonWhitelisted() public {
//         uint256 mintAmount = 1000 * 1e6;
//         uint256 transferAmount = 100 * 1e6;
        
//         // Mint tokens to investor1
//         vm.prank(campaign);
//         token.mintToInvestor(investor1, mintAmount);
        
//         // Transfer to non-whitelisted should fail
//         vm.prank(investor1);
//         vm.expectRevert("Transfer not allowed");
//         token.transfer(investor2, transferAmount);
        
//         // Verify balances unchanged
//         assertEq(token.balanceOf(investor1), mintAmount);
//         assertEq(token.balanceOf(investor2), 0);
//         assertEq(token.totalSupply(), mintAmount);
//     }
    
//     function testWhitelistManagement() public {
//         // Only founder or campaign can add to whitelist
//         vm.prank(founder);
//         token.addToWhitelist(investor1);
//         assertTrue(token.isWhitelisted(investor1));
        
//         vm.prank(campaign);
//         token.addToWhitelist(investor2);
//         assertTrue(token.isWhitelisted(investor2));
        
//         // Only founder can remove from whitelist
//         vm.prank(founder);
//         token.removeFromWhitelist(investor1);
//         assertFalse(token.isWhitelisted(investor1));
        
//         // Campaign cannot remove from whitelist
//         vm.prank(campaign);
//         vm.expectRevert("Only founder can call this");
//         token.removeFromWhitelist(investor2);
//     }
    
//     function testBlacklistFunctionality() public {
//         uint256 mintAmount = 1000 * 1e6;
        
//         // Mint tokens and whitelist investor2
//         vm.prank(campaign);
//         token.mintToInvestor(investor1, mintAmount);
//         vm.prank(founder);
//         token.addToWhitelist(investor2);
        
//         // Add investor1 to blacklist
//         vm.prank(founder);
//         token.addToBlacklist(investor1);
//         assertTrue(token.isBlacklisted(investor1));
        
//         // Transfer should fail from blacklisted address
//         vm.prank(investor1);
//         vm.expectRevert("Transfer not allowed");
//         token.transfer(investor2, 100 * 1e6);
        
//         // Remove from blacklist
//         vm.prank(founder);
//         token.removeFromBlacklist(investor1);
//         assertFalse(token.isBlacklisted(investor1));
        
//         // Transfer should work now
//         vm.prank(investor1);
//         token.transfer(investor2, 100 * 1e6);
//         assertEq(token.balanceOf(investor2), 100 * 1e6);
//         assertEq(token.balanceOf(investor1), mintAmount - 100 * 1e6);
//         assertEq(token.totalSupply(), mintAmount);
//         assertEq(token.balanceOfByPartition(DEFAULT_PARTITION, investor1), mintAmount - 100 * 1e6);
//         assertEq(token.balanceOfByPartition(DEFAULT_PARTITION, investor2), 100 * 1e6);
//     }
    
//     function testTransferControl() public {
//         uint256 mintAmount = 1000 * 1e6;
        
//         // Mint and setup transfer
//         vm.prank(campaign);
//         token.mintToInvestor(investor1, mintAmount);
//         vm.prank(founder);
//         token.addToWhitelist(investor2);
        
//         // Disable transfers
//         vm.prank(founder);
//         token.disableTransfers();
//         assertFalse(token.transfersEnabled());
        
//         // Transfer should fail when disabled
//         vm.prank(investor1);
//         vm.expectRevert("Transfer not allowed");
//         token.transfer(investor2, 100 * 1e6);
        
//         // Enable transfers
//         vm.prank(founder);
//         token.enableTransfers();
//         assertTrue(token.transfersEnabled());
        
//         // Transfer should work when enabled
//         vm.prank(investor1);
//         token.transfer(investor2, 100 * 1e6);
//         assertEq(token.balanceOf(investor2), 100 * 1e6);
//         assertEq(token.balanceOf(investor1), mintAmount - 100 * 1e6);
//         assertEq(token.totalSupply(), mintAmount);
//         assertEq(token.balanceOfByPartition(DEFAULT_PARTITION, investor1), mintAmount - 100 * 1e6);
//         assertEq(token.balanceOfByPartition(DEFAULT_PARTITION, investor2), 100 * 1e6);
//     }
    
//     function testPartitionFunctionality() public {
//         uint256 mintAmount = 1000 * 1e6;
//         bytes32 customPartition = keccak256("SERIES_A");
        
//         // Issue tokens to custom partition
//         vm.prank(campaign);
//         token.issueByPartition(customPartition, investor1, mintAmount, "");
        
//         assertEq(token.balanceOf(investor1), mintAmount);
//         assertEq(token.balanceOfByPartition(customPartition, investor1), mintAmount);
//         assertEq(token.balanceOfByPartition(DEFAULT_PARTITION, investor1), 0);
        
//         // Check partitions
//         bytes32[] memory partitions = token.getPartitionsOf(investor1);
//         assertTrue(partitions.length >= 1);
//         assertEq(partitions[partitions.length - 1], customPartition);
//     }
    
//     function testTransferByPartition() public {
//         uint256 mintAmount = 1000 * 1e6;
//         uint256 transferAmount = 100 * 1e6;
//         bytes32 customPartition = keccak256("SERIES_A");
        
//         // Setup: issue tokens and whitelist recipient
//         vm.prank(campaign);
//         token.issueByPartition(customPartition, investor1, mintAmount, "");
//         vm.prank(founder);
//         token.addToWhitelist(investor2);
        
//         // Transfer by partition
//         vm.prank(investor1);
//         token.transferByPartition(customPartition, investor2, transferAmount, "");
        
//         assertEq(token.balanceOfByPartition(customPartition, investor1), mintAmount - transferAmount);
//         assertEq(token.balanceOfByPartition(customPartition, investor2), transferAmount);
//         assertEq(token.balanceOf(investor1), mintAmount - transferAmount);
//         assertEq(token.balanceOf(investor2), transferAmount);
//         assertEq(token.totalSupply(), mintAmount);
//         assertEq(token.balanceOfByPartition(DEFAULT_PARTITION, investor1), 0);
//         assertEq(token.balanceOfByPartition(DEFAULT_PARTITION, investor2), 0);
//     }
    
//     function testCanTransferView() public {
//         vm.prank(campaign);
//         token.mintToInvestor(investor1, 1000 * 1e6);
        
//         // Check can transfer to whitelisted
//         vm.prank(founder);
//         token.addToWhitelist(investor2);
//         vm.prank(investor1);
//         (bytes1 status, bytes32 reason) = token.canTransfer(investor2, 100 * 1e6, "");
//         assertTrue(status == 0x51); // Success
        
//         // Check cannot transfer to non-whitelisted
//         vm.prank(investor1);
//         (status, reason) = token.canTransfer(unauthorized, 100 * 1e6, "");
//         assertTrue(status == 0x50); // Failure
//     }
    
//     function testGetTokenInfo() public view {
//         (
//             string memory tokenName,
//             string memory tokenSymbol,
//             string memory company,
//             uint256 equity,
//             uint256 supply,
//             address tokenFounder
//         ) = token.getTokenInfo();
        
//         assertEq(tokenName, TOKEN_NAME);
//         assertEq(tokenSymbol, TOKEN_SYMBOL);
//         assertEq(company, COMPANY_NAME);
//         assertEq(equity, EQUITY_PERCENTAGE);
//         assertEq(supply, 0);
//         assertEq(tokenFounder, founder);
//     }
    
//     function testIssuanceControl() public {
//         // Disable issuance
//         vm.prank(founder);
//         token.disableIssuance();
//         assertFalse(token.issuanceEnabled());
        
//         // Issuance should fail when disabled
//         vm.prank(campaign);
//         vm.expectRevert("Issuance disabled");
//         token.mintToInvestor(investor1, 1000 * 1e18);
//     }
// }