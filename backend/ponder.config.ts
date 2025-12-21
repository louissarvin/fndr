import { createConfig, factory } from "ponder";
import { parseAbiItem } from "abitype";
import { http } from "viem";
import { mantleSepoliaTestnet } from "viem/chains";

import { FndrIdentityABI } from "./abis/FndrIdentityAbi";
import { RoundFactoryABI } from "./abis/RoundFactoryAbi";
import { RoundManagerABI } from "./abis/RoundManagerAbi";
import { StartupSecondaryMarketABI } from "./abis/StartupSecondaryMarketAbi";

// Contract addresses on Mantle Sepolia
const CONTRACTS = {
  FndrIdentity: "0x6a38d5C2ad241934E1FB3B4589AC4D13BB3927Fa",
  RoundFactory: "0xb8F35a014562c81f8EC99307439094A15916B281",
  StartupSecondaryMarket: "0x91A3cc97AE1d24B8f88c217A0Cf595277cdA63e7",
} as const;

const roundDeployedEvent = parseAbiItem(
  "event RoundDeployed(address indexed roundAddress, address indexed founder, uint256 targetRaise)"
);

const START_BLOCK = 32349172;

export default createConfig({
  chains: {
    mantleSepoliaTestnet: {
      id: 5003,
      rpc: process.env.PONDER_RPC_URL_5003,
    },
  },
  contracts: {
    FndrIdentity: {
      chain: "mantleSepoliaTestnet",
      abi: FndrIdentityABI,
      address: CONTRACTS.FndrIdentity,
      startBlock: START_BLOCK,
    },

    RoundFactory: {
      chain: "mantleSepoliaTestnet",
      abi: RoundFactoryABI,
      address: CONTRACTS.RoundFactory,
      startBlock: START_BLOCK,
    },

    RoundManager: {
      chain: "mantleSepoliaTestnet",
      abi: RoundManagerABI,
      address: factory({
        address: CONTRACTS.RoundFactory,
        event: roundDeployedEvent,
        parameter: "roundAddress",
      }),
      startBlock: START_BLOCK,
    },

    StartupSecondaryMarket: {
      chain: "mantleSepoliaTestnet",
      abi: StartupSecondaryMarketABI,
      address: CONTRACTS.StartupSecondaryMarket,
      startBlock: START_BLOCK,
    },
  },
});
