const { getProvider } = require("./contracts");
const { ethers } = require("ethers");
const MultiSenderABI = require("./abis/MultiSender.json");

const solverWallet = new ethers.Wallet(process.env.SOLVER_PRIVATE_KEY, getProvider("disburse"));

async function handleIntent(intentType, encodedData) {
  const rawHash = ethers.keccak256(encodedData);
  const signature = await solverWallet.signMessage(ethers.getBytes(rawHash));

  if (intentType === "self") {
    return { signature };
  }

  if (intentType === "solver") {
    const contract = new ethers.Contract(
      process.env.MULTISENDER_ADDRESS,
      MultiSenderABI,
      solverWallet
    );

    const tx = await contract.multiSend(encodedData, signature);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  throw new Error("Invalid intentType");
}

module.exports = { handleIntent };
