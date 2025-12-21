import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { client, graphql } from "ponder";
import { ZKPassport, QueryResult, ProofResult } from "@zkpassport/sdk";

const app = new Hono();

// Enable CORS for frontend requests
app.use("*", cors({
  origin: ["http://localhost:5173", "http://localhost:8080"],
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));

// ZKPassport verification endpoint
app.post("/api/zkpass/verify", async (c) => {
  try {
    const {
      queryResult,
      proofs,
      domain,
    }: {
      queryResult: QueryResult;
      proofs: ProofResult[];
      domain: string;
    } = await c.req.json();

    console.log("ZKPassport verification request received");
    console.log("Domain:", domain);
    console.log("Number of proofs:", proofs?.length);

    const zkpassport = new ZKPassport(domain);

    const { verified, uniqueIdentifier } = await zkpassport.verify({
      proofs,
      queryResult,
      devMode: true, // Enable dev mode for testing
    });

    console.log("Verified:", verified);
    console.log("Unique identifier:", uniqueIdentifier);

    // Convert uniqueIdentifier to bytes32 format for smart contract
    let uniqueIdentifierBytes32: string | undefined;
    if (uniqueIdentifier) {
      // Convert decimal string to BigInt, then to hex
      const bigIntId = BigInt(uniqueIdentifier);
      // Convert to hex string (without 0x prefix) and pad to 64 characters (32 bytes)
      const hexId = bigIntId.toString(16).padStart(64, "0");
      uniqueIdentifierBytes32 = hexId;
    }

    console.log("Unique identifier bytes32:", uniqueIdentifierBytes32);

    return c.json({
      verified,
      uniqueIdentifier,
      uniqueIdentifierBytes32,
      registered: verified,
    });
  } catch (error) {
    console.error("ZKPassport verification error:", error);
    return c.json(
      {
        verified: false,
        error: error instanceof Error ? error.message : "Unknown error",
        registered: false,
      },
      500
    );
  }
});

app.use("/sql/*", client({ db, schema }));

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

export default app;
