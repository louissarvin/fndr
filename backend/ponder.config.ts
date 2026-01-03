import { createConfig, factory, mergeAbis } from "ponder";
import { parseAbiItem } from "abitype";
import { http, createPublicClient, type Address } from "viem";
import { mantleSepoliaTestnet } from "viem/chains";

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

// Fetch all deployed round addresses from RoundFactory at build time
async function getDeployedRoundAddresses(): Promise<Address[]> {
  const rpcUrl = process.env.PONDER_RPC_URL_5003 || "https://rpc.sepolia.mantle.xyz";

  const client = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(rpcUrl),
  });

  try {
    // Get current block number
    const latestBlock = await client.getBlockNumber();
    const addresses: Address[] = [];

    // Query in chunks of 10000 blocks (RPC limit)
    const CHUNK_SIZE = 9000n;
    let fromBlock = BigInt(START_BLOCK);

    while (fromBlock < latestBlock) {
      const toBlock = fromBlock + CHUNK_SIZE > latestBlock ? latestBlock : fromBlock + CHUNK_SIZE;

      const logs = await client.getLogs({
        address: CONTRACTS.RoundFactory as Address,
        event: roundDeployedEvent,
        fromBlock,
        toBlock,
      });

      for (const log of logs) {
        if (log.args.roundAddress) {
          addresses.push(log.args.roundAddress as Address);
        }
      }

      fromBlock = toBlock + 1n;
    }

    console.log(`[ponder.config] Found ${addresses.length} deployed rounds:`, addresses);
    return addresses;
  } catch (error) {
    console.error("[ponder.config] Failed to fetch round addresses:", error);
    return [];
  }
}

// Get addresses synchronously at module load time
const deployedRounds = await getDeployedRoundAddresses();

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

    // Use explicitly fetched addresses for historical events + factory for new ones
    RoundManager: {
      chain: "mantleSepoliaTestnet",
      abi: RoundManagerABI,
      address: deployedRounds.length > 0
        ? deployedRounds
        : factory({
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
