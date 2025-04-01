require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { verifyDeposit } = require("./verifier");
const { handleIntent } = require("./signer");
const { ethers } = require("ethers");

const app = express();

// ✅ Enable CORS for all origins and routes
app.use(cors());
app.use(express.json());

app.post("/solve", async (req, res) => {
  try {
    const { txId, userAddress, chainName, intentType, distributions } = req.body;
    console.log("Received request:", req.body);
    if (!txId || !userAddress || !distributions || !chainName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const totalRequired = distributions.reduce((sum, dist) => sum + BigInt(dist[2]), 0n);

    const totalDeposited = await verifyDeposit(txId, userAddress, chainName);
    if (totalRequired > totalDeposited) {
      return res.status(400).json({ error: "Insufficient deposit" });
    }

    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(address[],uint256[],uint256,uint32)[]"],
      [distributions]
    );

    const result = await handleIntent(intentType, encodedData);
    res.json(result);

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ✅ Health check route (optional)
app.get("/", (req, res) => {
  res.send("Solver API is running!");
});

app.listen(3000, () => {
  console.log("✅ Solver server running at http://localhost:3000");
});
