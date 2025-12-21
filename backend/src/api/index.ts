import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { client, graphql } from "ponder";
import { ZKPassport, QueryResult, ProofResult } from "@zkpassport/sdk";

const app = new Hono();

// Pinata configuration (loaded from environment)
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";

// Allowed file types and size limits
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

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

// ==========================================
// IPFS Upload Endpoints (Secure Backend)
// ==========================================

// Upload file to IPFS (images, PDFs)
app.post("/api/ipfs/upload-file", async (c) => {
  try {
    if (!PINATA_JWT) {
      return c.json({ error: "IPFS service not configured" }, 500);
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const fileType = formData.get("type") as string | null; // "image" or "document"

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Validate file type and size
    if (fileType === "image") {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return c.json({ error: "Invalid image type. Allowed: JPEG, PNG, GIF, WebP" }, 400);
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return c.json({ error: "Image too large. Maximum size: 5MB" }, 400);
      }
    } else if (fileType === "document") {
      if (!ALLOWED_DOC_TYPES.includes(file.type)) {
        return c.json({ error: "Invalid document type. Allowed: PDF" }, 400);
      }
      if (file.size > MAX_DOC_SIZE) {
        return c.json({ error: "Document too large. Maximum size: 10MB" }, 400);
      }
    } else {
      return c.json({ error: "Invalid file type parameter" }, 400);
    }

    // Create form data for Pinata
    const pinataFormData = new FormData();
    pinataFormData.append("file", file);

    // Upload to Pinata
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: pinataFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pinata upload error:", errorText);
      return c.json({ error: "Failed to upload to IPFS" }, 500);
    }

    const data = await response.json();

    return c.json({
      success: true,
      ipfsHash: data.IpfsHash,
      ipfsUrl: `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
    });
  } catch (error) {
    console.error("IPFS upload error:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      500
    );
  }
});

// Upload JSON metadata to IPFS
app.post("/api/ipfs/upload-json", async (c) => {
  try {
    if (!PINATA_JWT) {
      return c.json({ error: "IPFS service not configured" }, 500);
    }

    const body = await c.req.json();
    const { metadata, name } = body;

    if (!metadata) {
      return c.json({ error: "No metadata provided" }, 400);
    }

    // Validate metadata structure
    if (!metadata.name || !metadata.symbol || !metadata.description) {
      return c.json({ error: "Metadata must include name, symbol, and description" }, 400);
    }

    // Upload to Pinata
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: name || `${metadata.symbol}-metadata`,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pinata JSON upload error:", errorText);
      return c.json({ error: "Failed to upload metadata to IPFS" }, 500);
    }

    const data = await response.json();

    return c.json({
      success: true,
      ipfsHash: data.IpfsHash,
      ipfsUrl: `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
      metadataURI: `ipfs://${data.IpfsHash}`,
    });
  } catch (error) {
    console.error("IPFS JSON upload error:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      500
    );
  }
});

// Get IPFS gateway URL
app.get("/api/ipfs/gateway", async (c) => {
  return c.json({
    gateway: PINATA_GATEWAY,
    configured: !!PINATA_JWT,
  });
});

// ==========================================
// Ponder built-in routes
// ==========================================

app.use("/sql/*", client({ db, schema }));

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

export default app;
