import { ponder } from "ponder:registry";
import * as schema from "ponder:schema";

// Handle round creation (emitted by RoundManager after deployment)
// Note: This event may fire BEFORE RoundDeployed due to log ordering
ponder.on("RoundManager:RoundCreated", async ({ event, context }) => {
  const roundId = event.log.address.toLowerCase();
  const founder = event.args.founder.toLowerCase();
  const equityToken = event.args.equityToken.toLowerCase();
  const companyName = event.args.companyName;
  const targetRaise = event.args.targetRaise;
  const equityPercentage = event.args.equityPercentage;
  const timestamp = event.block.timestamp;

  // Upsert round with info from RoundCreated event
  const existingRound = await context.db.find(schema.round, { id: roundId });

  if (existingRound) {
    await context.db.update(schema.round, { id: roundId }).set({
      equityToken: equityToken,
      companyName: companyName,
      equityPercentage: equityPercentage,
      updatedAt: timestamp,
    });
  } else {
    // RoundCreated fires before RoundDeployed, so create with all available info
    await context.db.insert(schema.round).values({
      id: roundId,
      founder: founder,
      equityToken: equityToken,
      companyName: companyName,
      targetRaise: targetRaise,
      equityPercentage: equityPercentage,
      totalRaised: 0n,
      totalWithdrawn: 0n,
      tokensIssued: 0n,
      investorCount: 0,
      state: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
});

// Handle investment made
ponder.on("RoundManager:InvestmentMade", async ({ event, context }) => {
  const roundId = event.log.address.toLowerCase();
  const investor = event.args.investor.toLowerCase();
  const usdcAmount = event.args.usdcAmount;
  const tokensReceived = event.args.tokensReceived;
  const totalRaised = event.args.totalRaised;
  const timestamp = event.block.timestamp;
  const txHash = event.transaction.hash;
  const logIndex = event.log.logIndex;

  // Create investment record
  const investmentId = `${txHash}-${logIndex}`;
  await context.db.insert(schema.investment).values({
    id: investmentId,
    roundId: roundId,
    investor: investor,
    usdcAmount: usdcAmount,
    tokensReceived: tokensReceived,
    totalRaisedAtTime: totalRaised,
    timestamp: timestamp,
    transactionHash: txHash,
  });

  // Update round totals
  const existingRound = await context.db.find(schema.round, { id: roundId });

  if (existingRound) {
    await context.db.update(schema.round, { id: roundId }).set({
      totalRaised: totalRaised,
      tokensIssued: existingRound.tokensIssued + tokensReceived,
      investorCount: existingRound.investorCount + 1,
      updatedAt: timestamp,
    });
  }

  // Update platform stats
  const stats = await context.db.find(schema.platformStats, { id: "global" });

  if (stats) {
    await context.db.update(schema.platformStats, { id: "global" }).set({
      totalRaised: stats.totalRaised + usdcAmount,
      updatedAt: timestamp,
    });
  }
});

// Handle round completion
ponder.on("RoundManager:RoundCompleted", async ({ event, context }) => {
  const roundId = event.log.address.toLowerCase();
  const totalRaised = event.args.totalRaised;
  const completionTime = event.args.completionTime;
  const completionReason = event.args.completionReason;
  const timestamp = event.block.timestamp;

  await context.db.update(schema.round, { id: roundId }).set({
    state: 1, // Completed
    totalRaised: totalRaised,
    completionTime: completionTime,
    completionReason: completionReason,
    updatedAt: timestamp,
  });
});

// Handle founder withdrawal
ponder.on("RoundManager:FounderWithdrawal", async ({ event, context }) => {
  const roundId = event.log.address.toLowerCase();
  const founder = event.args.founder.toLowerCase();
  const principalAmount = event.args.principalAmount;
  const yieldAmount = event.args.yieldAmount;
  const totalAmount = event.args.totalAmount;
  const timestamp = event.block.timestamp;
  const txHash = event.transaction.hash;
  const logIndex = event.log.logIndex;

  // Create withdrawal record
  const withdrawalId = `${txHash}-${logIndex}`;
  await context.db.insert(schema.withdrawal).values({
    id: withdrawalId,
    roundId: roundId,
    founder: founder,
    principalAmount: principalAmount,
    yieldAmount: yieldAmount,
    totalAmount: totalAmount,
    timestamp: timestamp,
    transactionHash: txHash,
  });

  // Update round totals
  const existingRound = await context.db.find(schema.round, { id: roundId });

  if (existingRound) {
    await context.db.update(schema.round, { id: roundId }).set({
      totalWithdrawn: existingRound.totalWithdrawn + totalAmount,
      updatedAt: timestamp,
    });
  }
});

// Handle investor yield claimed
ponder.on("RoundManager:InvestorYieldClaimed", async ({ event, context }) => {
  const roundId = event.log.address.toLowerCase();
  const investor = event.args.investor.toLowerCase();
  const amount = event.args.amount;
  const timestamp = event.block.timestamp;
  const txHash = event.transaction.hash;
  const logIndex = event.log.logIndex;

  // Create yield claim record
  const claimId = `${txHash}-${logIndex}`;
  await context.db.insert(schema.yieldClaim).values({
    id: claimId,
    roundId: roundId,
    investor: investor,
    amount: amount,
    timestamp: timestamp,
    transactionHash: txHash,
  });
});

// Handle yield distribution
ponder.on("RoundManager:YieldDistributed", async ({ event, context }) => {
  const roundId = event.log.address.toLowerCase();
  const totalYield = event.args.totalYield;
  const founderYield = event.args.founderYield;
  const investorYield = event.args.investorYield;
  const timestamp = event.block.timestamp;
  const txHash = event.transaction.hash;
  const logIndex = event.log.logIndex;

  // Create yield distribution record
  const distributionId = `${txHash}-${logIndex}`;
  await context.db.insert(schema.yieldDistribution).values({
    id: distributionId,
    roundId: roundId,
    totalYield: totalYield,
    founderYield: founderYield,
    investorYield: investorYield,
    timestamp: timestamp,
    transactionHash: txHash,
  });
});

// Handle platform fee collection (optional - for tracking)
ponder.on("RoundManager:PlatformFeeCollected", async ({ event, context }) => {
  // Log for debugging/monitoring - can add table if needed
  console.log(
    `Platform fee collected: ${event.args.feeAmount} from round ${event.log.address}`
  );
});
