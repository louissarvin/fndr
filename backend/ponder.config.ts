import { createConfig, factory } from "ponder";
import { parseAbiItem } from "abitype";

import { FndrIdentityABI } from "./abis/FndrIdentityAbi";
import { RoundFactoryABI } from "./abis/RoundFactoryAbi";
import { RoundManagerABI } from "./abis/RoundManagerAbi";
import { StartupSecondaryMarketABI } from "./abis/StartupSecondaryMarketAbi";

// Contract addresses on Arbitrum Sepolia
const CONTRACTS = {
  FndrIdentity: "0xEEEdca533402B75dDF338ECF3EF1E1136C8f20cF",
  RoundFactory: "0x900bB95Ad371178EF48759E0305BECF649ecE553",
  StartupSecondaryMarket: "0xE7edb8902A71aB6709a99d34695edaE612afEB11",
} as const;

const roundDeployedEvent = parseAbiItem(
  "event RoundDeployed(address indexed roundAddress, address indexed founder, uint256 targetRaise, string metadataURI)"
);

const START_BLOCK = 232600000;

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
