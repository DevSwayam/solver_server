const { getRemoteDeposit } = require("./contracts");
const { ethers } = require("ethers");

async function verifyDeposit(txHash, userAddress, chainName) {
  const contract = getRemoteDeposit(chainName);
  const provider = contract.provider;
  const receipt = await provider.getTransactionReceipt(txHash);
  const iface = new ethers.Interface(contract.interface.fragments);

  let total = 0n;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed.name === "FundsDeposited" && parsed.args.user === userAddress) {
        total += parsed.args.amount;
      }
    } catch {}
  }

  return total;
}

module.exports = { verifyDeposit };
