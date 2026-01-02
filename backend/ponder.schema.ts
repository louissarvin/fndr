import { onchainTable, relations } from "ponder";

// ============================================
// User & Identity Tables
// ============================================

export const user = onchainTable("user", (t) => ({
  id: t.text().primaryKey(), // wallet address
  role: t.integer().notNull(), // 0=None, 1=Investor, 2=Founder
  isZKPassportVerified: t.boolean().notNull().default(false),
  zkPassportHash: t.text(),
  registeredAt: t.bigint().notNull(),
  updatedAt: t.bigint().notNull(),
}));

export const founderProfile = onchainTable("founder_profile", (t) => ({
  id: t.text().primaryKey(), // founder wallet address
  metadataURI: t.text().notNull(), // IPFS URI (ipfs://...)
  createdAt: t.bigint().notNull(),
  updatedAt: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
}));

export const founderProfileRelations = relations(founderProfile, ({ one }) => ({
  user: one(user, { fields: [founderProfile.id], references: [user.id] }),
}));

// ============================================
// Funding Round Tables
// ============================================

export const round = onchainTable("round", (t) => ({
  id: t.text().primaryKey(), // round contract address
  founder: t.text().notNull(),
  equityToken: t.text(),
  companyName: t.text(),
  metadataURI: t.text(), // IPFS URI for metadata (ipfs://...)
  targetRaise: t.bigint().notNull(),
  equityPercentage: t.bigint(),
  totalRaised: t.bigint().notNull().default(0n),
  totalWithdrawn: t.bigint().notNull().default(0n),
  tokensIssued: t.bigint().notNull().default(0n),
  investorCount: t.integer().notNull().default(0),
  state: t.integer().notNull().default(0), // 0=Fundraising, 1=Completed, 2=Cancelled
  completionTime: t.bigint(),
  completionReason: t.text(),
  createdAt: t.bigint().notNull(),
  updatedAt: t.bigint().notNull(),
}));

export const roundRelations = relations(round, ({ many }) => ({
  investments: many(investment),
  withdrawals: many(withdrawal),
}));

// ============================================
// Investment Tables
// ============================================

export const investment = onchainTable("investment", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  roundId: t.text().notNull(),
  investor: t.text().notNull(),
  usdcAmount: t.bigint().notNull(),
  tokensReceived: t.bigint().notNull(),
  totalRaisedAtTime: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
}));

export const investmentRelations = relations(investment, ({ one }) => ({
  round: one(round, { fields: [investment.roundId], references: [round.id] }),
}));

// ============================================
// Withdrawal Tables
// ============================================

export const withdrawal = onchainTable("withdrawal", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  roundId: t.text().notNull(),
  founder: t.text().notNull(),
  principalAmount: t.bigint().notNull(),
  yieldAmount: t.bigint().notNull(),
  totalAmount: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
}));

export const withdrawalRelations = relations(withdrawal, ({ one }) => ({
  round: one(round, { fields: [withdrawal.roundId], references: [round.id] }),
}));

// ============================================
// Yield Tables
// ============================================

export const yieldClaim = onchainTable("yield_claim", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  roundId: t.text().notNull(),
  investor: t.text().notNull(),
  amount: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
}));

export const yieldDistribution = onchainTable("yield_distribution", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  roundId: t.text().notNull(),
  totalYield: t.bigint().notNull(),
  founderYield: t.bigint().notNull(),
  investorYield: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
}));

// ============================================
// Secondary Market Tables
// ============================================

export const sellOrder = onchainTable("sell_order", (t) => ({
  id: t.text().primaryKey(), // orderId as string
  orderId: t.bigint().notNull(),
  seller: t.text().notNull(),
  tokenContract: t.text().notNull(),
  amount: t.bigint().notNull(),
  originalAmount: t.bigint().notNull(),
  pricePerToken: t.bigint().notNull(),
  expiryTime: t.bigint().notNull(),
  active: t.boolean().notNull().default(true),
  createdAt: t.bigint().notNull(),
  updatedAt: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
}));

export const sellOrderRelations = relations(sellOrder, ({ many }) => ({
  trades: many(trade),
}));

export const trade = onchainTable("trade", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  orderId: t.text().notNull(),
  buyer: t.text().notNull(),
  seller: t.text().notNull(),
  tokenContract: t.text().notNull(),
  amount: t.bigint().notNull(),
  pricePerToken: t.bigint().notNull(),
  totalPrice: t.bigint().notNull(),
  platformFee: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
}));

export const tradeRelations = relations(trade, ({ one }) => ({
  order: one(sellOrder, { fields: [trade.orderId], references: [sellOrder.id] }),
}));

// ============================================
// Platform Stats Table (singleton)
// ============================================

export const platformStats = onchainTable("platform_stats", (t) => ({
  id: t.text().primaryKey().default("global"),
  totalUsers: t.integer().notNull().default(0),
  totalFounders: t.integer().notNull().default(0),
  totalInvestors: t.integer().notNull().default(0),
  totalRounds: t.integer().notNull().default(0),
  totalRaised: t.bigint().notNull().default(0n),
  totalTrades: t.integer().notNull().default(0),
  totalTradeVolume: t.bigint().notNull().default(0n),
  updatedAt: t.bigint().notNull(),
}));
