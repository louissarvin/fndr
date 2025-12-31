import { useQuery } from "@tanstack/react-query";

const PONDER_GRAPHQL_URL =
  import.meta.env.VITE_BACKEND_API_URL || "http://localhost:42069";

// GraphQL query helper
async function queryPonder<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${PONDER_GRAPHQL_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0]?.message || "GraphQL error");
  }

  return json.data;
}

// ============================================
// Types
// ============================================

export interface Round {
  id: string;
  founder: string;
  equityToken: string | null;
  companyName: string | null;
  metadataURI: string | null;
  targetRaise: string;
  equityPercentage: string | null;
  totalRaised: string;
  totalWithdrawn: string;
  tokensIssued: string;
  investorCount: number;
  state: number;
  completionTime: string | null;
  completionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  roundId: string;
  investor: string;
  usdcAmount: string;
  tokensReceived: string;
  totalRaisedAtTime: string;
  timestamp: string;
  transactionHash: string;
}

export interface SellOrder {
  id: string;
  orderId: string;
  seller: string;
  tokenContract: string;
  amount: string;
  originalAmount: string;
  pricePerToken: string;
  expiryTime: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  transactionHash: string;
}

export interface Trade {
  id: string;
  orderId: string;
  buyer: string;
  seller: string;
  tokenContract: string;
  amount: string;
  pricePerToken: string;
  totalPrice: string;
  platformFee: string;
  timestamp: string;
  transactionHash: string;
}

export interface User {
  id: string;
  role: number;
  isZKPassportVerified: boolean;
  zkPassportHash: string | null;
  registeredAt: string;
  updatedAt: string;
}

export interface PlatformStats {
  id: string;
  totalUsers: number;
  totalFounders: number;
  totalInvestors: number;
  totalRounds: number;
  totalRaised: string;
  totalTrades: number;
  totalTradeVolume: string;
  updatedAt: string;
}

// ============================================
// Hooks
// ============================================

// Fetch all rounds
export function useRounds() {
  return useQuery({
    queryKey: ["ponder", "rounds"],
    queryFn: async () => {
      const data = await queryPonder<{ rounds: { items: Round[] } }>(`
        query GetRounds {
          rounds(orderBy: "createdAt", orderDirection: "desc") {
            items {
              id
              founder
              equityToken
              companyName
              metadataURI
              targetRaise
              equityPercentage
              totalRaised
              totalWithdrawn
              tokensIssued
              investorCount
              state
              completionTime
              completionReason
              createdAt
              updatedAt
            }
          }
        }
      `);
      return data.rounds.items;
    },
    staleTime: 30000, // 30 seconds
  });
}

// Fetch active rounds (state = 0 = Fundraising)
export function useActiveRounds() {
  return useQuery({
    queryKey: ["ponder", "rounds", "active"],
    queryFn: async () => {
      const data = await queryPonder<{ rounds: { items: Round[] } }>(`
        query GetActiveRounds {
          rounds(where: { state: 0 }, orderBy: "createdAt", orderDirection: "desc") {
            items {
              id
              founder
              equityToken
              companyName
              metadataURI
              targetRaise
              equityPercentage
              totalRaised
              investorCount
              state
              createdAt
            }
          }
        }
      `);
      return data.rounds.items;
    },
    staleTime: 30000,
  });
}

// Fetch a single round by ID
export function useRound(roundId: string | undefined) {
  return useQuery({
    queryKey: ["ponder", "round", roundId],
    queryFn: async () => {
      if (!roundId) return null;
      const data = await queryPonder<{ round: Round | null }>(`
        query GetRound($id: String!) {
          round(id: $id) {
            id
            founder
            equityToken
            companyName
            metadataURI
            targetRaise
            equityPercentage
            totalRaised
            totalWithdrawn
            tokensIssued
            investorCount
            state
            completionTime
            completionReason
            createdAt
            updatedAt
          }
        }
      `, { id: roundId });
      return data.round;
    },
    enabled: !!roundId,
    staleTime: 30000,
  });
}

// Fetch investments for a specific investor
export function useInvestorInvestments(investorAddress: string | undefined) {
  return useQuery({
    queryKey: ["ponder", "investments", investorAddress],
    queryFn: async () => {
      if (!investorAddress) return [];
      const data = await queryPonder<{ investments: { items: Investment[] } }>(`
        query GetInvestorInvestments($investor: String!) {
          investments(where: { investor: $investor }, orderBy: "timestamp", orderDirection: "desc") {
            items {
              id
              roundId
              investor
              usdcAmount
              tokensReceived
              totalRaisedAtTime
              timestamp
              transactionHash
            }
          }
        }
      `, { investor: investorAddress.toLowerCase() });
      return data.investments.items;
    },
    enabled: !!investorAddress,
    staleTime: 30000,
  });
}

// Fetch all investments for a round
export function useRoundInvestments(roundId: string | undefined) {
  return useQuery({
    queryKey: ["ponder", "investments", "round", roundId],
    queryFn: async () => {
      if (!roundId) return [];
      const data = await queryPonder<{ investments: { items: Investment[] } }>(`
        query GetRoundInvestments($roundId: String!) {
          investments(where: { roundId: $roundId }, orderBy: "timestamp", orderDirection: "desc") {
            items {
              id
              roundId
              investor
              usdcAmount
              tokensReceived
              timestamp
              transactionHash
            }
          }
        }
      `, { roundId });
      return data.investments.items;
    },
    enabled: !!roundId,
    staleTime: 30000,
  });
}

// Fetch active sell orders
export function useActiveSellOrders() {
  return useQuery({
    queryKey: ["ponder", "sellOrders", "active"],
    queryFn: async () => {
      const data = await queryPonder<{ sellOrders: { items: SellOrder[] } }>(`
        query GetActiveSellOrders {
          sellOrders(where: { active: true }, orderBy: "createdAt", orderDirection: "desc") {
            items {
              id
              orderId
              seller
              tokenContract
              amount
              originalAmount
              pricePerToken
              expiryTime
              active
              createdAt
              transactionHash
            }
          }
        }
      `);
      return data.sellOrders.items;
    },
    staleTime: 30000,
  });
}

// Fetch sell orders for a specific token
export function useTokenSellOrders(tokenContract: string | undefined) {
  return useQuery({
    queryKey: ["ponder", "sellOrders", "token", tokenContract],
    queryFn: async () => {
      if (!tokenContract) return [];
      const data = await queryPonder<{ sellOrders: { items: SellOrder[] } }>(`
        query GetTokenSellOrders($tokenContract: String!) {
          sellOrders(where: { tokenContract: $tokenContract, active: true }, orderBy: "pricePerToken", orderDirection: "asc") {
            items {
              id
              orderId
              seller
              tokenContract
              amount
              pricePerToken
              expiryTime
              active
              createdAt
            }
          }
        }
      `, { tokenContract: tokenContract.toLowerCase() });
      return data.sellOrders.items;
    },
    enabled: !!tokenContract,
    staleTime: 30000,
  });
}

// Fetch recent trades
export function useRecentTrades(limit: number = 20) {
  return useQuery({
    queryKey: ["ponder", "trades", "recent", limit],
    queryFn: async () => {
      const data = await queryPonder<{ trades: { items: Trade[] } }>(`
        query GetRecentTrades($limit: Int!) {
          trades(orderBy: "timestamp", orderDirection: "desc", limit: $limit) {
            items {
              id
              orderId
              buyer
              seller
              tokenContract
              amount
              pricePerToken
              totalPrice
              platformFee
              timestamp
              transactionHash
            }
          }
        }
      `, { limit });
      return data.trades.items;
    },
    staleTime: 30000,
  });
}

// Fetch platform stats
export function usePlatformStats() {
  return useQuery({
    queryKey: ["ponder", "platformStats"],
    queryFn: async () => {
      const data = await queryPonder<{ platformStats: PlatformStats | null }>(`
        query GetPlatformStats {
          platformStats(id: "global") {
            id
            totalUsers
            totalFounders
            totalInvestors
            totalRounds
            totalRaised
            totalTrades
            totalTradeVolume
            updatedAt
          }
        }
      `);
      return data.platformStats;
    },
    staleTime: 60000, // 1 minute
  });
}

// Fetch user by address
export function useUser(address: string | undefined) {
  return useQuery({
    queryKey: ["ponder", "user", address],
    queryFn: async () => {
      if (!address) return null;
      const data = await queryPonder<{ user: User | null }>(`
        query GetUser($id: String!) {
          user(id: $id) {
            id
            role
            isZKPassportVerified
            zkPassportHash
            registeredAt
            updatedAt
          }
        }
      `, { id: address.toLowerCase() });
      return data.user;
    },
    enabled: !!address,
    staleTime: 30000,
  });
}

// Fetch rounds by founder
export function useFounderRounds(founderAddress: string | undefined) {
  return useQuery({
    queryKey: ["ponder", "rounds", "founder", founderAddress],
    queryFn: async () => {
      if (!founderAddress) return [];
      const data = await queryPonder<{ rounds: { items: Round[] } }>(`
        query GetFounderRounds($founder: String!) {
          rounds(where: { founder: $founder }, orderBy: "createdAt", orderDirection: "desc") {
            items {
              id
              founder
              equityToken
              companyName
              metadataURI
              targetRaise
              equityPercentage
              totalRaised
              totalWithdrawn
              tokensIssued
              investorCount
              state
              createdAt
              updatedAt
            }
          }
        }
      `, { founder: founderAddress.toLowerCase() });
      return data.rounds.items;
    },
    enabled: !!founderAddress,
    staleTime: 30000,
  });
}

// Fetch sell orders by seller address
export function useSellerSellOrders(sellerAddress: string | undefined) {
  return useQuery({
    queryKey: ["ponder", "sellOrders", "seller", sellerAddress],
    queryFn: async () => {
      if (!sellerAddress) return [];
      const data = await queryPonder<{ sellOrders: { items: SellOrder[] } }>(`
        query GetSellerSellOrders($seller: String!) {
          sellOrders(where: { seller: $seller }, orderBy: "createdAt", orderDirection: "desc") {
            items {
              id
              orderId
              seller
              tokenContract
              amount
              originalAmount
              pricePerToken
              expiryTime
              active
              createdAt
              transactionHash
            }
          }
        }
      `, { seller: sellerAddress.toLowerCase() });
      return data.sellOrders.items;
    },
    enabled: !!sellerAddress,
    staleTime: 30000,
  });
}

// Fetch round by equity token address
export function useRoundByEquityToken(equityTokenAddress: string | undefined) {
  return useQuery({
    queryKey: ["ponder", "round", "equityToken", equityTokenAddress],
    queryFn: async () => {
      if (!equityTokenAddress) return null;
      const data = await queryPonder<{ rounds: { items: Round[] } }>(`
        query GetRoundByEquityToken($equityToken: String!) {
          rounds(where: { equityToken: $equityToken }, limit: 1) {
            items {
              id
              founder
              equityToken
              companyName
              metadataURI
              targetRaise
              equityPercentage
              totalRaised
              tokensIssued
              investorCount
              state
              createdAt
            }
          }
        }
      `, { equityToken: equityTokenAddress.toLowerCase() });
      return data.rounds.items[0] || null;
    },
    enabled: !!equityTokenAddress,
    staleTime: 30000,
  });
}

// Fetch trades where user is the buyer (secondary market purchases)
export function useBuyerTrades(buyerAddress: string | undefined) {
  return useQuery({
    queryKey: ["ponder", "trades", "buyer", buyerAddress],
    queryFn: async () => {
      if (!buyerAddress) return [];
      const data = await queryPonder<{ trades: { items: Trade[] } }>(`
        query GetBuyerTrades($buyer: String!) {
          trades(where: { buyer: $buyer }, orderBy: "timestamp", orderDirection: "desc") {
            items {
              id
              orderId
              buyer
              seller
              tokenContract
              amount
              pricePerToken
              totalPrice
              platformFee
              timestamp
              transactionHash
            }
          }
        }
      `, { buyer: buyerAddress.toLowerCase() });
      return data.trades.items;
    },
    enabled: !!buyerAddress,
    staleTime: 30000,
  });
}
