// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {MockVault} from "../src/MockVault.sol";
import {FndrIdentity} from "../src/FndrIdentity.sol";
import {RoundFactory} from "../src/RoundFactory.sol";
import {StartupSecondaryMarket} from "../src/StartupSecondaryMarket.sol";

contract DeployFndr is Script {
    address public constant PLATFORM_WALLET = 0x564323aE0D8473103F3763814c5121Ca9e48004B;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("FNDR Protocol Deployment to Mantle Sepolia");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("Platform Wallet:", PLATFORM_WALLET);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockUSDC
        console.log("1. Deploying MockUSDC...");
        MockUSDC usdc = new MockUSDC();
        console.log("   MockUSDC deployed at:", address(usdc));

        // 2. Deploy MockVault (ERC4626 yield vault)
        console.log("2. Deploying MockVault...");
        MockVault vault = new MockVault(
            address(usdc),
            "Fndr Yield Vault",
            "fvUSDC"
        );
        console.log("   MockVault deployed at:", address(vault));

        // 3. Deploy FndrIdentity
        console.log("3. Deploying FndrIdentity...");
        FndrIdentity identity = new FndrIdentity();
        console.log("   FndrIdentity deployed at:", address(identity));

        // 4. Deploy StartupSecondaryMarket FIRST (needed by RoundFactory)
        console.log("4. Deploying StartupSecondaryMarket...");
        StartupSecondaryMarket market = new StartupSecondaryMarket(
            address(identity),
            address(usdc),
            PLATFORM_WALLET
        );
        console.log("   StartupSecondaryMarket deployed at:", address(market));

        // 5. Deploy RoundFactory (with secondary market for auto-linking)
        console.log("5. Deploying RoundFactory...");
        RoundFactory factory = new RoundFactory(
            address(usdc),
            address(vault),
            address(identity),
            address(market)  // Auto-link secondary market to new rounds
        );
        console.log("   RoundFactory deployed at:", address(factory));

        // Seed the vault with USDC for yield generation
        console.log("6. Seeding vault with initial USDC for yield...");
        uint256 seedAmount = 100_000 * 1e6; // 100k USDC
        usdc.mint(address(vault), seedAmount);

        vm.stopBroadcast();

        // Print deployment summary
        console.log("");
        console.log("===========================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("===========================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("-------------------------------------------");
        console.log("MockUSDC:              ", address(usdc));
        console.log("MockVault:             ", address(vault));
        console.log("FndrIdentity:          ", address(identity));
        console.log("RoundFactory:          ", address(factory));
        console.log("StartupSecondaryMarket:", address(market));
        console.log("-------------------------------------------");
        console.log("");
        console.log("Network: Mantle Sepolia (Chain ID: 5003)");
        console.log("Explorer: https://explorer.sepolia.mantle.xyz");
    }
}
