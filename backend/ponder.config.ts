import { createConfig, factory } from "ponder";
import { parseAbiItem } from "abitype";

import { FndrIdentityABI } from "./abis/FndrIdentityAbi";
import { RoundFactoryABI } from "./abis/RoundFactoryAbi";
import { RoundManagerABI } from "./abis/RoundManagerAbi";
import { StartupSecondaryMarketABI } from "./abis/StartupSecondaryMarketAbi";

// Contract addresses on Arbitrum Sepolia
const CONTRACTS = {
  FndrIdentity: "0x47B320A4ED999989AE3065Be28B208f177a7546D",
  RoundFactory: "0xecB93f03515DE67EA43272797Ea8eDa059985894",
  StartupSecondaryMarket: "0xd8EcF5D6D77bF2852c5e9313F87f31cc99c38dE9",
} as const;

const roundDeployedEvent = parseAbiItem(
  "event RoundDeployed(address indexed roundAddress, address indexed founder, uint256 targetRaise, string metadataURI)"
);

const START_BLOCK = 110000000;

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
