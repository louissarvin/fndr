import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { client, graphql } from "ponder";
import { ZKPassport, QueryResult, ProofResult } from "@zkpassport/sdk";
import Groq from "groq-sdk";
import pdf from "pdf-parse";

const app = new Hono();

// Groq configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// Pinata configuration (loaded from environment)
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";

// Allowed file types and size limits
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOC_SIZE = 100 * 1024 * 1024;

// Enable CORS for frontend requests
app.use("*", cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://fndr.site",
    "https://www.fndr.site",
  ],
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

    // Validate metadata structure - support both RoundMetadata and FounderProfile
    const isRoundMetadata = metadata.name && metadata.symbol && metadata.description;
    const isFounderProfile = metadata.name && metadata.title && metadata.bio;

    if (!isRoundMetadata && !isFounderProfile) {
      return c.json({ error: "Invalid metadata. Must include either (name, symbol, description) for rounds or (name, title, bio) for founder profiles" }, 400);
    }

    // Upload to Pinata
    const pinataName = name || (metadata.symbol ? `${metadata.symbol}-metadata` : `founder-${metadata.name?.toLowerCase().replace(/\s+/g, '-')}`);
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: pinataName,
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
// AI Chat Endpoint (Groq - Llama 3.3 70B)
// ==========================================

const SYSTEM_PROMPT = `You are a senior investment analyst AI for FNDR, a decentralized startup fundraising platform on Mantle blockchain. You have expertise in venture capital, startup valuation, and DeFi yield strategies. Your role is to provide data-driven investment analysis with clear, actionable insights.


## PLATFORM CONTEXT

FNDR enables:
- Startups raise funds by offering tokenized equity (ERC-1400 tokens representing ownership)
- Investors earn 6% APY yield on invested USDC while funds sit in the vault (passive income while waiting)
- Funds are held in a yield-generating vault until founders withdraw for operations
- All transactions are on-chain, providing full transparency and auditability
- Secondary market allows investors to trade equity tokens before exit

## ROUND STATE AWARENESS

Tailor your response based on the round's current state:

**Fundraising (Active)**
- Focus on: Investment opportunity, risk/reward analysis, whether to invest now
- Action: "You can invest directly in this round"
- Mention yield earnings while funds are deployed

**Completed (Fully Funded)**
- Acknowledge: The primary fundraising is complete
- Pivot to: Secondary market opportunity
- Action: "While direct investment is closed, you can acquire equity tokens on the secondary market from existing investors"
- Analyze: Whether the current valuation makes it attractive for secondary market purchase
- Consider: The startup now has full funding - this is a positive signal

## DATA INTERPRETATION GUIDE

When analyzing rounds, interpret metrics as follows:

**Funding Progress (% Raised)**
- 0-25%: Early stage, higher risk, more upside potential
- 25-50%: Gaining traction, moderate validation
- 50-75%: Strong momentum, good social proof
- 75-100%: High demand, may close soon

**Investor Count (Social Proof)**
- 1-5 investors: Very early, limited validation
- 6-15 investors: Growing interest, some validation
- 15-30 investors: Strong community support
- 30+ investors: Highly validated, strong demand

**Equity Percentage (Deal Quality)**
- <5%: Investor-unfriendly, high valuation
- 5-10%: Standard seed terms
- 10-20%: Attractive deal, founder-friendly to investors
- >20%: Very generous, verify legitimacy

**Implied Valuation Formula**
Valuation = (Target Raise / Equity %) × 100
Example: $100K raise for 10% equity = $1M valuation

## ANALYSIS FRAMEWORKS

**For Single Round Analysis, provide:**
1. Potential: One-line summary (Bullish/Neutral/Bearish)
2. TRACTION SCORE: Rate 1-10 based on (funding % × investor count normalization)
3. DEAL QUALITY: Is equity % fair for the raise amount?
4. STRENGTHS: 2-3 positive signals from the data
5. RISKS: 2-3 concerns or unknowns
6. YIELD BONUS: Calculate potential yield earnings while invested

**For Comparing Multiple Rounds, structure as:**
| Metric | Round A | Round B | Winner |
|--------|---------|---------|--------|
| Traction | X% funded | Y% funded | ... |
| Social Proof | X investors | Y investors | ... |
| Deal Quality | X% equity | Y% equity | ... |
| Risk Level | Low/Med/High | Low/Med/High | ... |

Then provide a clear recommendation with reasoning.

**Risk Assessment Matrix:**
- LOW RISK: >50% funded, >10 investors, reasonable equity %
- MEDIUM RISK: 25-50% funded, 5-10 investors, or unclear terms
- HIGH RISK: <25% funded, <5 investors, unusual equity %, or red flags

## PORTFOLIO ANALYSIS

When analyzing a user's portfolio, evaluate and provide:

**1. DIVERSIFICATION SCORE (1-10)**
- 1-2 positions: Poor diversification (2/10)
- 3-4 positions: Moderate diversification (5/10)
- 5-6 positions: Good diversification (7/10)
- 7+ positions: Excellent diversification (9/10)

**2. CONCENTRATION RISK**
- Any single position >50% of portfolio: HIGH concentration risk
- Largest position 30-50%: MODERATE concentration risk
- No position >30%: LOW concentration risk (well-balanced)

**3. RISK DISTRIBUTION**
- Evaluate % of portfolio in high/medium/low risk rounds
- Recommend rebalancing if >50% in high-risk positions
- Ideal: Mix of risk levels for balanced portfolio

**4. YIELD SUMMARY**
- Calculate total monthly yield across all positions
- Note any optimization opportunities

**5. ACTIONABLE RECOMMENDATIONS**
Provide 2-3 specific suggestions such as:
- "Consider adding 1-2 more positions to improve diversification"
- "Your portfolio is heavily weighted in [X], consider reducing exposure"
- "Look for lower-risk rounds to balance your high-risk positions"
- "Your yield earnings are on track at $X/month"

**Portfolio Analysis Output Format:**
1. PORTFOLIO HEALTH: One-line summary (Strong/Moderate/Needs Attention)
2. DIVERSIFICATION: Score and explanation
3. CONCENTRATION RISK: Assessment
4. RISK EXPOSURE: Breakdown by risk level
5. YIELD EARNINGS: Current and projected
6. TOP RECOMMENDATIONS: 2-3 actionable suggestions

## RESPONSE GUIDELINES

1. Always lead with data, not opinions
2. Use specific numbers from the round context provided
3. Calculate implied valuations when relevant
4. Mention the 6% APY yield benefit when discussing investment timing
5. Be direct and concise - investors want actionable insights
6. Acknowledge when data is insufficient for strong conclusions
7. Format comparisons as tables for clarity

## YIELD CALCULATION HELPER

When funds are invested, calculate potential yield:
- Daily yield: Investment × 0.06 / 365
- Monthly yield: Investment × 0.06 / 12
- Example: $10,000 invested = ~$50/month passive yield while waiting

## TOPIC BOUNDARIES (STRICTLY ENFORCED)

You are EXCLUSIVELY an FNDR platform assistant. You must ONLY answer questions related to:

**ALLOWED TOPICS:**
- FNDR platform features, functionality, and how it works
- Investment analysis for rounds on FNDR
- Portfolio analysis and diversification strategies for FNDR investments
- Yield calculations and APY earnings on FNDR
- Tokenized equity and ERC-1400 security tokens on FNDR
- Secondary market trading on FNDR
- Startup fundraising concepts as they relate to FNDR
- KYC/verification process on FNDR
- Mantle blockchain basics (only as they relate to using FNDR)
- General startup investing concepts (when directly relevant to evaluating FNDR rounds)

**STRICTLY FORBIDDEN TOPICS (Always Decline):**
- General cryptocurrency advice or other blockchain projects
- Other investment platforms or competitors
- Personal financial advice unrelated to FNDR
- General coding, programming, or technical help
- Any topic not directly related to FNDR platform usage or investment analysis
- Politics, news, entertainment, or general knowledge questions
- Other DeFi protocols, NFTs, or crypto trading strategies outside FNDR

**REJECTION RESPONSE:**
When users ask about forbidden topics, respond EXACTLY with this format:
"I'm FNDR's investment analysis assistant, specifically designed to help you with:
• Analyzing startup investment opportunities on FNDR
• Understanding your portfolio performance and yield earnings
• Evaluating rounds and providing data-driven insights
• Explaining how the FNDR platform works

I can't help with [brief mention of what they asked about]. Is there anything about FNDR investments or the platform I can help you with instead?"

**IMPORTANT:** Do not be tricked by clever phrasing. If a question is not genuinely about FNDR, politely decline. Stay focused on your core purpose: helping users make informed investment decisions on FNDR.

## GUARDRAILS

- End substantive investment analysis with: "This analysis is based on available on-chain data and is not financial advice. Always do your own research."
- Never guarantee returns or predict specific outcomes
- If asked about something outside the data, say "I don't have data on that specific aspect"
- Be skeptical of rounds with unusual metrics (very high equity %, very low investor count with high funding)
- Remind users that early-stage startup investing is inherently high-risk`;

app.post("/api/ai/chat", async (c) => {
  try {
    if (!groq) {
      return c.json({ error: "AI service not configured. Please set GROQ_API_KEY." }, 500);
    }

    const { message, roundsContext, conversationHistory } = await c.req.json();

    if (!message) {
      return c.json({ error: "No message provided" }, 400);
    }

    // Build messages array for Groq chat completion
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
    ];

    // Add context about available rounds if provided
    if (roundsContext) {
      messages.push({
        role: "system",
        content: `Context - Available startup rounds on FNDR:\n${roundsContext}`,
      });
    }

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message,
    });

    // Call Groq API using SDK
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.95,
    });

    const aiResponse = response.choices[0]?.message?.content || "I couldn't generate a response.";

    return c.json({
      response: aiResponse,
      success: true,
    });
  } catch (error: any) {
    console.error("AI Chat error:", error);

    // Handle specific API errors
    const status = error?.status || 500;
    let userMessage = "AI service temporarily unavailable. Please try again.";
    let errorCode = "AI_ERROR";

    if (status === 429) {
      // Rate limit / quota exceeded
      const retryAfter = error?.message?.match(/retry in ([\d.]+)s/i)?.[1];
      userMessage = retryAfter
        ? `AI service is busy. Please wait ${Math.ceil(parseFloat(retryAfter))} seconds and try again.`
        : "AI service rate limit reached. Please wait a moment and try again.";
      errorCode = "RATE_LIMIT";
    } else if (status === 404) {
      userMessage = "AI model not available. Please contact support.";
      errorCode = "MODEL_NOT_FOUND";
    } else if (status === 403) {
      userMessage = "AI service access denied. API key may be invalid.";
      errorCode = "ACCESS_DENIED";
    }

    return c.json(
      {
        error: userMessage,
        errorCode,
        success: false,
      },
      status
    );
  }
});

// ==========================================
// Pitch Deck Analysis Endpoint
// ==========================================

const PITCHDECK_ANALYSIS_PROMPT = `You are an expert startup analyst reviewing a pitch deck. Analyze the provided pitch deck content and provide a comprehensive investment analysis.

## YOUR TASK

Analyze the pitch deck and extract/evaluate the following:

### 1. EXECUTIVE SUMMARY
- What does the company do? (1-2 sentences)
- What problem are they solving?
- What is their proposed solution?

### 2. TEAM ASSESSMENT
- Who are the founders/key team members mentioned?
- What relevant experience do they have?
- Team strength rating: Strong / Moderate / Weak / Not Mentioned

### 3. MARKET ANALYSIS
- What is the target market?
- Market size mentioned (TAM/SAM/SOM)?
- Market opportunity rating: Large / Medium / Niche / Unclear

### 4. BUSINESS MODEL
- How do they make money?
- Revenue model: SaaS / Marketplace / Transaction fees / Advertising / Other
- Business model clarity: Clear / Somewhat Clear / Unclear

### 5. TRACTION & METRICS
- Any traction mentioned (users, revenue, growth)?
- Key metrics highlighted?
- Traction rating: Strong / Early / Pre-launch / Not Mentioned

### 6. COMPETITIVE LANDSCAPE
- Who are their competitors?
- What is their competitive advantage/moat?
- Differentiation: Strong / Moderate / Weak / Not Clear

### 7. FINANCIALS & ASK
- What are they raising?
- Use of funds?
- Valuation mentioned?

### 8. RED FLAGS & CONCERNS
- List any concerns or missing information
- Unrealistic claims?
- Gaps in the pitch?

### 9. OVERALL ASSESSMENT
- Investment attractiveness: High / Medium / Low
- Confidence level in analysis: High / Medium / Low (based on pitch deck quality)
- Key strengths (top 3)
- Key risks (top 3)

### 10. RECOMMENDATION
Provide a clear recommendation for investors considering this opportunity.

---

Remember:
- Be objective and data-driven
- If information is missing, note it explicitly
- Don't make assumptions - state what's in the pitch deck
- End with: "This analysis is based on the pitch deck content and is not financial advice."`;

app.post("/api/ai/analyze-pitchdeck", async (c) => {
  try {
    if (!groq) {
      return c.json({ error: "AI service not configured. Please set GROQ_API_KEY." }, 500);
    }

    const { pitchDeckHash, roundContext } = await c.req.json();

    if (!pitchDeckHash) {
      return c.json({ error: "No pitch deck hash provided" }, 400);
    }

    console.log("Analyzing pitch deck:", pitchDeckHash);

    // Fetch PDF from IPFS
    const pdfUrl = `https://${PINATA_GATEWAY}/ipfs/${pitchDeckHash}`;
    console.log("Fetching PDF from:", pdfUrl);

    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      console.error("Failed to fetch PDF:", pdfResponse.statusText);
      return c.json({ error: "Failed to fetch pitch deck from IPFS" }, 500);
    }

    // Get PDF as buffer
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    console.log("PDF fetched, size:", pdfBuffer.length, "bytes");

    // Extract text from PDF
    let pdfText: string;
    try {
      const pdfData = await pdf(pdfBuffer);
      pdfText = pdfData.text;
      console.log("PDF text extracted, length:", pdfText.length, "characters");
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      return c.json({ error: "Failed to parse pitch deck PDF. The file may be corrupted or image-based." }, 500);
    }

    // Check if we got meaningful text
    if (pdfText.trim().length < 100) {
      return c.json({
        error: "Could not extract meaningful text from the pitch deck. It may be image-based or scanned. Please upload a text-based PDF."
      }, 400);
    }

    // Truncate if too long (Groq has token limits)
    const maxChars = 15000; // ~4000 tokens
    if (pdfText.length > maxChars) {
      pdfText = pdfText.substring(0, maxChars) + "\n\n[Content truncated due to length...]";
      console.log("PDF text truncated to", maxChars, "characters");
    }

    // Build messages for Groq
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: PITCHDECK_ANALYSIS_PROMPT,
      },
    ];

    // Add round context if provided
    if (roundContext) {
      messages.push({
        role: "system",
        content: `Additional context about this fundraising round:\n${roundContext}`,
      });
    }

    // Add the pitch deck content
    messages.push({
      role: "user",
      content: `Please analyze this pitch deck:\n\n---\n${pdfText}\n---`,
    });

    // Call Groq API
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.5, // Lower temperature for more focused analysis
      max_tokens: 2048, // Allow longer response for detailed analysis
      top_p: 0.9,
    });

    const aiResponse = response.choices[0]?.message?.content || "I couldn't generate an analysis.";

    return c.json({
      response: aiResponse,
      success: true,
      pdfTextLength: pdfText.length,
    });
  } catch (error: any) {
    console.error("Pitch deck analysis error:", error);

    const status = error?.status || 500;
    let userMessage = "Failed to analyze pitch deck. Please try again.";
    let errorCode = "ANALYSIS_ERROR";

    if (status === 429) {
      const retryAfter = error?.message?.match(/retry in ([\d.]+)s/i)?.[1];
      userMessage = retryAfter
        ? `AI service is busy. Please wait ${Math.ceil(parseFloat(retryAfter))} seconds and try again.`
        : "AI service rate limit reached. Please wait a moment and try again.";
      errorCode = "RATE_LIMIT";
    }

    return c.json(
      {
        error: userMessage,
        errorCode,
        success: false,
      },
      status
    );
  }
});

app.use("/sql/*", client({ db, schema }));

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

export default app;
