import { ponder } from "ponder:registry";
import * as schema from "ponder:schema";

// Handle new round deployment from factory
ponder.on("RoundFactory:RoundDeployed", async ({ event, context }) => {
  const roundId = event.args.roundAddress.toLowerCase();
  const founder = event.args.founder.toLowerCase();
  const targetRaise = event.args.targetRaise;
  const metadataURI = event.args.metadataURI;
  const timestamp = event.block.timestamp;

  // Upsert round entry (RoundCreated may have already created it)
  const existingRound = await context.db.find(schema.round, { id: roundId });

  if (existingRound) {
    await context.db.update(schema.round, { id: roundId }).set({
      founder: founder,
      targetRaise: targetRaise,
      metadataURI: metadataURI,
      updatedAt: timestamp,
    });
  } else {
    await context.db.insert(schema.round).values({
      id: roundId,
      founder: founder,
      targetRaise: targetRaise,
      metadataURI: metadataURI,
      totalRaised: 0n,
      totalWithdrawn: 0n,
      tokensIssued: 0n,
      investorCount: 0,
      state: 0, // Fundraising
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  // Update platform stats
  const stats = await context.db.find(schema.platformStats, { id: "global" });

  if (stats) {
    await context.db.update(schema.platformStats, { id: "global" }).set({
      totalRounds: stats.totalRounds + 1,
      updatedAt: timestamp,
    });
  } else {
    await context.db.insert(schema.platformStats).values({
      id: "global",
      totalUsers: 0,
      totalFounders: 0,
      totalInvestors: 0,
      totalRounds: 1,
      totalRaised: 0n,
      totalTrades: 0,
      totalTradeVolume: 0n,
      updatedAt: timestamp,
    });
  }
});
