import { ponder } from "ponder:registry";
import * as schema from "ponder:schema";

// Handle sell order creation
ponder.on("StartupSecondaryMarket:OrderCreated", async ({ event, context }) => {
  const orderId = event.args.orderId;
  const seller = event.args.seller.toLowerCase();
  const tokenContract = event.args.tokenContract.toLowerCase();
  const amount = event.args.amount;
  const pricePerToken = event.args.pricePerToken;
  const expiryTime = event.args.expiryTime;
  const timestamp = event.block.timestamp;
  const txHash = event.transaction.hash;

  // Create sell order record
  await context.db.insert(schema.sellOrder).values({
    id: orderId.toString(),
    orderId: orderId,
    seller: seller,
    tokenContract: tokenContract,
    amount: amount,
    originalAmount: amount,
    pricePerToken: pricePerToken,
    expiryTime: expiryTime,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    transactionHash: txHash,
  });
});

// Handle order execution (trade)
ponder.on("StartupSecondaryMarket:OrderExecuted", async ({ event, context }) => {
  const orderId = event.args.orderId;
  const buyer = event.args.buyer.toLowerCase();
  const seller = event.args.seller.toLowerCase();
  const amount = event.args.amount;
  const pricePerToken = event.args.pricePerToken;
  const totalPrice = event.args.totalPrice;
  const platformFee = event.args.platformFee;
  const timestamp = event.block.timestamp;
  const txHash = event.transaction.hash;
  const logIndex = event.log.logIndex;

  // Get the order to find tokenContract
  const existingOrder = await context.db.find(schema.sellOrder, {
    id: orderId.toString(),
  });

  const tokenContract = existingOrder?.tokenContract ?? "";

  // Create trade record
  const tradeId = `${txHash}-${logIndex}`;
  await context.db.insert(schema.trade).values({
    id: tradeId,
    orderId: orderId.toString(),
    buyer: buyer,
    seller: seller,
    tokenContract: tokenContract,
    amount: amount,
    pricePerToken: pricePerToken,
    totalPrice: totalPrice,
    platformFee: platformFee,
    timestamp: timestamp,
    transactionHash: txHash,
  });

  // Update sell order (reduce amount or deactivate)
  if (existingOrder) {
    const remainingAmount = existingOrder.amount - amount;
    const isFullyFilled = remainingAmount <= 0n;

    await context.db.update(schema.sellOrder, { id: orderId.toString() }).set({
      amount: remainingAmount > 0n ? remainingAmount : 0n,
      active: !isFullyFilled,
      updatedAt: timestamp,
    });
  }

  // Update platform stats
  const stats = await context.db.find(schema.platformStats, { id: "global" });

  if (stats) {
    await context.db.update(schema.platformStats, { id: "global" }).set({
      totalTrades: stats.totalTrades + 1,
      totalTradeVolume: stats.totalTradeVolume + totalPrice,
      updatedAt: timestamp,
    });
  } else {
    await context.db.insert(schema.platformStats).values({
      id: "global",
      totalUsers: 0,
      totalFounders: 0,
      totalInvestors: 0,
      totalRounds: 0,
      totalRaised: 0n,
      totalTrades: 1,
      totalTradeVolume: totalPrice,
      updatedAt: timestamp,
    });
  }
});

// Handle order cancellation
ponder.on("StartupSecondaryMarket:OrderCancelled", async ({ event, context }) => {
  const orderId = event.args.orderId;
  const timestamp = event.block.timestamp;

  // Update order to inactive
  await context.db.update(schema.sellOrder, { id: orderId.toString() }).set({
    active: false,
    updatedAt: timestamp,
  });
});
