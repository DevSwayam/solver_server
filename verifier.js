const { getRemoteDeposit } = require("./contracts");
const { ethers } = require("ethers");

async function verifyDeposit(txHash, userAddress, chainName) {
  try {
    const contract = getRemoteDeposit(chainName);
    const provider = contract.runner; // ✅ ethers v6 uses .runner for provider/signer
    const receipt = await provider.waitForTransaction(txHash); // ✅ updated way to get receipt

    if (!receipt || !receipt.logs) {
      throw new Error("Transaction receipt or logs not found");
    }

    const iface = contract.interface;

    let total = 0n;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed.name === "FundsDeposited" && parsed.args.user === userAddress) {
          total += parsed.args.amount;
        }
      } catch {
        // not a match for this contract/interface — skip
      }
    }

    return total;
  } catch (err) {
    console.error("⚠️ Error in verifyDeposit:", err.message);
    throw err;
  }
}

module.exports = { verifyDeposit };
