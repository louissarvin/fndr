import { createConfig, factory } from "ponder";
import { parseAbiItem } from "abitype";

import { FndrIdentityABI } from "./abis/FndrIdentityAbi";
import { RoundFactoryABI } from "./abis/RoundFactoryAbi";
import { RoundManagerABI } from "./abis/RoundManagerAbi";
import { StartupSecondaryMarketABI } from "./abis/StartupSecondaryMarketAbi";

// Contract addresses on Mantle Sepolia
const CONTRACTS = {
  FndrIdentity: "0x342F7e47E9F62cf1f0f1E0e62c9F7F641de114DE",
  RoundFactory: "0x9D05244Bf4D091734da61e21396c74Cd92346E6f",
  StartupSecondaryMarket: "0x7fB1E1C25F47acf921d9d89480586111dEf65CBb",
} as const;

const roundDeployedEvent = parseAbiItem(
  "event RoundDeployed(address indexed roundAddress, address indexed founder, uint256 targetRaise, string metadataURI)"
);

const START_BLOCK = 32935200;

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

    // Factory pattern automatically detects all rounds deployed via RoundFactory
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
