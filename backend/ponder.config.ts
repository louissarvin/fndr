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
  FndrIdentity: "0x88A684C010B9286bd0b0c71738Df673c4A733fF3",
  RoundFactory: "0x456967939D5b14Ee0dEe8C7c05b1424132d5DDC8",
  StartupSecondaryMarket: "0x24F62664f2055DC220156D4d263fd5590Af96e53",
} as const;

const roundDeployedEvent = parseAbiItem(
  "event RoundDeployed(address indexed roundAddress, address indexed founder, uint256 targetRaise, string metadataURI)"
);

const START_BLOCK = 32393974;

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
