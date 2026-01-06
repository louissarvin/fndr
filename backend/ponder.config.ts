import { createConfig, factory } from "ponder";
import { parseAbiItem } from "abitype";

import { FndrIdentityABI } from "./abis/FndrIdentityAbi";
import { RoundFactoryABI } from "./abis/RoundFactoryAbi";
import { RoundManagerABI } from "./abis/RoundManagerAbi";
import { StartupSecondaryMarketABI } from "./abis/StartupSecondaryMarketAbi";

// Contract addresses on Lisk Sepolia
const CONTRACTS = {
  FndrIdentity: "0xDC987dF013d655c8eEb89ACA2c14BdcFeEee850a",
  RoundFactory: "0x482DB11F63cC06CD5Fb56d54C942450871775c6B",
  StartupSecondaryMarket: "0xF09216A363FC5D88E899aa92239B2eeB1913913B",
} as const;

const roundDeployedEvent = parseAbiItem(
  "event RoundDeployed(address indexed roundAddress, address indexed founder, uint256 targetRaise, string metadataURI)"
);

const START_BLOCK = 31050043;

// Note: Using factory pattern to automatically detect all rounds deployed via RoundFactory
// This ensures new rounds are indexed without needing to restart the service

export default createConfig({
  chains: {
    liskSepolia: {
      id: 4202,
      rpc: process.env.PONDER_RPC_URL_4202,
    },
  },
  contracts: {
    FndrIdentity: {
      chain: "liskSepolia",
      abi: FndrIdentityABI,
      address: CONTRACTS.FndrIdentity,
      startBlock: START_BLOCK,
    },

    RoundFactory: {
      chain: "liskSepolia",
      abi: RoundFactoryABI,
      address: CONTRACTS.RoundFactory,
      startBlock: START_BLOCK,
    },

    // Factory pattern automatically detects all rounds deployed via RoundFactory
    RoundManager: {
      chain: "liskSepolia",
      abi: RoundManagerABI,
      address: factory({
        address: CONTRACTS.RoundFactory,
        event: roundDeployedEvent,
        parameter: "roundAddress",
      }),
      startBlock: START_BLOCK,
    },

    StartupSecondaryMarket: {
      chain: "liskSepolia",
      abi: StartupSecondaryMarketABI,
      address: CONTRACTS.StartupSecondaryMarket,
      startBlock: START_BLOCK,
    },
  },
});
