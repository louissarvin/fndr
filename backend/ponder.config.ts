import { createConfig, factory } from "ponder";
import { parseAbiItem } from "abitype";

import { FndrIdentityABI } from "./abis/FndrIdentityAbi";
import { RoundFactoryABI } from "./abis/RoundFactoryAbi";
import { RoundManagerABI } from "./abis/RoundManagerAbi";
import { StartupSecondaryMarketABI } from "./abis/StartupSecondaryMarketAbi";

// Contract addresses on Arbitrum Sepolia
const CONTRACTS = {
  FndrIdentity: "0x11d2c7178Cf55ee1b2a85f7EBC29Fa1F81cf7e71",
  RoundFactory: "0x56c34f3f859101Fd650B4968D4b9dFdC1A3CF630",
  StartupSecondaryMarket: "0xD44a29d95Fd6F39cbe3e5De7A64fD8EC10588f9D",
} as const;

const roundDeployedEvent = parseAbiItem(
  "event RoundDeployed(address indexed roundAddress, address indexed founder, uint256 targetRaise, string metadataURI)"
);

const START_BLOCK = 232802980;

export default createConfig({
  chains: {
    arbitrumSepolia: {
      id: 421614,
      rpc: process.env.PONDER_RPC_URL_421614,
    },
  },
  contracts: {
    FndrIdentity: {
      chain: "arbitrumSepolia",
      abi: FndrIdentityABI,
      address: CONTRACTS.FndrIdentity,
      startBlock: START_BLOCK,
    },

    RoundFactory: {
      chain: "arbitrumSepolia",
      abi: RoundFactoryABI,
      address: CONTRACTS.RoundFactory,
      startBlock: START_BLOCK,
    },

    // Factory pattern automatically detects all rounds deployed via RoundFactory
    RoundManager: {
      chain: "arbitrumSepolia",
      abi: RoundManagerABI,
      address: factory({
        address: CONTRACTS.RoundFactory,
        event: roundDeployedEvent,
        parameter: "roundAddress",
      }),
      startBlock: START_BLOCK,
    },

    StartupSecondaryMarket: {
      chain: "arbitrumSepolia",
      abi: StartupSecondaryMarketABI,
      address: CONTRACTS.StartupSecondaryMarket,
      startBlock: START_BLOCK,
    },
  },
});
