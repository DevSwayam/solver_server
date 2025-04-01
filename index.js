require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { verifyDeposit } = require("./verifier");
const { handleIntent } = require("./signer");
const { ethers } = require("ethers");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/solve", async (req, res) => {
  try {
    const { txId, userAddress, chainName, intentType, encodedData } = req.body;
    console.log("Received request:", req.body);

    if (!txId || !userAddress || !chainName || !encodedData) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Decode the encodedData
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
      ["tuple(address[],uint256[],uint256,uint32)[]"],
      encodedData
    );

    const distributions = decoded[0];

    // ✅ Sum totalRequired from distributions
    const totalRequired = distributions.reduce((sum, dist) => {
      return sum + dist[2]; // dist[2] is already a BigInt (ethers v6)
    }, 0n);

    // ✅ Verify deposit
    const totalDeposited = await verifyDeposit(txId, userAddress, chainName);
    if (totalRequired > totalDeposited) {
      return res.status(400).json({ error: "Insufficient deposit" });
    }

    // ✅ Sign or send
    const result = await handleIntent(intentType, encodedData);
    res.json(result);

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Health route
app.get("/", (req, res) => {
  res.send("Solver API is running!");
});

app.listen(3000, () => {
  console.log("✅ Solver server running at http://localhost:3000");
});
