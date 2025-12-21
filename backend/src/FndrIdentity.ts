import { ponder } from "ponder:registry";
import * as schema from "ponder:schema";

// Handle user role registration
ponder.on("FndrIdentity:UserRoleRegistered", async ({ event, context }) => {
  const userId = event.args.user.toLowerCase();
  const role = Number(event.args.role);
  const timestamp = event.block.timestamp;

  // Check if user already exists
  const existingUser = await context.db.find(schema.user, { id: userId });

  if (existingUser) {
    // Update existing user
    await context.db.update(schema.user, { id: userId }).set({
      role: role,
      updatedAt: timestamp,
    });
  } else {
    // Create new user
    await context.db.insert(schema.user).values({
      id: userId,
      role: role,
      isZKPassportVerified: false,
      registeredAt: timestamp,
      updatedAt: timestamp,
    });
  }

  // Update platform stats
  const stats = await context.db.find(schema.platformStats, { id: "global" });

  if (stats) {
    await context.db.update(schema.platformStats, { id: "global" }).set({
      totalUsers: stats.totalUsers + 1,
      totalFounders: role === 2 ? stats.totalFounders + 1 : stats.totalFounders,
      totalInvestors: role === 1 ? stats.totalInvestors + 1 : stats.totalInvestors,
      updatedAt: timestamp,
    });
  } else {
    await context.db.insert(schema.platformStats).values({
      id: "global",
      totalUsers: 1,
      totalFounders: role === 2 ? 1 : 0,
      totalInvestors: role === 1 ? 1 : 0,
      totalRounds: 0,
      totalRaised: 0n,
      totalTrades: 0,
      totalTradeVolume: 0n,
      updatedAt: timestamp,
    });
  }
});

// Handle ZK Passport verification
ponder.on("FndrIdentity:ZKPassportVerified", async ({ event, context }) => {
  const userId = event.args.user.toLowerCase();
  const nullifierHash = event.args.nullifierHash;
  const timestamp = event.block.timestamp;

  // Check if user exists
  const existingUser = await context.db.find(schema.user, { id: userId });

  if (existingUser) {
    // Update existing user with ZK verification
    await context.db.update(schema.user, { id: userId }).set({
      isZKPassportVerified: true,
      zkPassportHash: nullifierHash,
      updatedAt: timestamp,
    });
  } else {
    // Create new user with ZK verification (shouldn't happen normally)
    await context.db.insert(schema.user).values({
      id: userId,
      role: 0, // None - will be updated when they register role
      isZKPassportVerified: true,
      zkPassportHash: nullifierHash,
      registeredAt: timestamp,
      updatedAt: timestamp,
    });
  }
});
