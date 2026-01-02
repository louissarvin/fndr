import { createConfig, factory, mergeAbis } from "ponder";
import { parseAbiItem } from "abitype";
import { http, createPublicClient, type Address } from "viem";
import { liskSepolia } from "viem/chains";

import { FndrIdentityABI } from "./abis/FndrIdentityAbi";
import { RoundFactoryABI } from "./abis/RoundFactoryAbi";
import { RoundManagerABI } from "./abis/RoundManagerAbi";
import { StartupSecondaryMarketABI } from "./abis/StartupSecondaryMarketAbi";

// Contract addresses on Lisk Sepolia
const CONTRACTS = {
  FndrIdentity: "0x51b8808dD9E46933c345B58Ec7fa0ce16eC3c68E",
  RoundFactory: "0x4b188E84c7946Acd21aeB3F718E42C0f1b558950",
  StartupSecondaryMarket: "0x3363363702f98e8CE93871996c5163b79238cE5a",
} as const;

const roundDeployedEvent = parseAbiItem(
  "event RoundDeployed(address indexed roundAddress, address indexed founder, uint256 targetRaise, string metadataURI)"
);

const START_BLOCK = 31027539;

// Fetch all deployed round addresses from RoundFactory at build time
async function getDeployedRoundAddresses(): Promise<Address[]> {
  const rpcUrl = process.env.PONDER_RPC_URL_4202 || "https://lisk-sepolia.drpc.org";

  const client = createPublicClient({
    chain: liskSepolia,
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

    // Use explicitly fetched addresses for historical events + factory for new ones
    RoundManager: {
      chain: "liskSepolia",
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
      chain: "liskSepolia",
      abi: StartupSecondaryMarketABI,
      address: CONTRACTS.StartupSecondaryMarket,
      startBlock: START_BLOCK,
    },
  },
});
