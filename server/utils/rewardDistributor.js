const { ethers } = require("ethers");

const RPC_URL             = process.env.REACT_APP_RPC_URL || "https://polygon-rpc.com";
const REWARD_POOL_ADDRESS = process.env.REACT_APP_REWARD_POOL_ADDRESS;
const PRIVATE_KEY         = process.env.REWARD_WALLET_PRIVATE_KEY;

const REWARD_POOL_ABI = [
  "function distributeReward(address player, uint8 placement, uint16 multiplier)",
  "function poolBalance() view returns (uint256)",
  "function dailyRemaining(address player) view returns (uint256)",
];

const MRT_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];

// ── Build fresh provider + wallet each call ───────────────────────
function buildWallet() {
  if (!PRIVATE_KEY)         throw new Error("REWARD_WALLET_PRIVATE_KEY not set in .env");
  if (!REWARD_POOL_ADDRESS) throw new Error("REACT_APP_REWARD_POOL_ADDRESS not set in .env");
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
  return { wallet, provider };
}

// ── Fetch live gas price ──────────────────────────────────────────
async function getGasOverrides(provider) {
  try {
    const feeData = await provider.getFeeData();
    const minTip  = ethers.utils.parseUnits("30", "gwei");
    const tip     = feeData.maxPriorityFeePerGas?.gt(minTip)
      ? feeData.maxPriorityFeePerGas : minTip;
    const maxFee  = feeData.maxFeePerGas?.gt(tip.mul(2))
      ? feeData.maxFeePerGas : tip.mul(2);
    return { gasLimit: 180_000, maxPriorityFeePerGas: tip, maxFeePerGas: maxFee };
  } catch {
    const gasPrice = await provider.getGasPrice();
    return { gasLimit: 180_000, gasPrice: gasPrice.mul(130).div(100) };
  }
}

// ── Distribute race reward via GameRewardPool contract ────────────
async function distributeRaceReward(playerAddress, placement, multiplier) {
  try {
    const { wallet, provider } = buildWallet();
    const contract = new ethers.Contract(REWARD_POOL_ADDRESS, REWARD_POOL_ABI, wallet);

    const balance = await contract.poolBalance();
    if (balance.eq(0)) return { error: "Reward pool is empty" };

    const remaining = await contract.dailyRemaining(playerAddress);
    if (remaining.eq(0)) return { error: "Player daily cap reached" };

    const gasOverrides = await getGasOverrides(provider);

    console.log("[RewardDistributor] distributeReward:", {
      player: playerAddress, placement, multiplier,
      expectedMRT: [50, 30, 15, 5][placement - 1] * multiplier / 100,
    });

    const tx      = await contract.distributeReward(playerAddress, placement, multiplier, gasOverrides);
    const receipt = await tx.wait();

    const iface = new ethers.utils.Interface([
      "event RewardDistributed(address indexed player, uint256 amount, uint8 placement)",
    ]);

    let rewardAmount = "0";
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed.name === "RewardDistributed") {
          rewardAmount = ethers.utils.formatEther(parsed.args.amount);
          break;
        }
      } catch { /* not our event */ }
    }

    console.log(`[RewardDistributor] Sent ${rewardAmount} MRT to ${playerAddress} — tx: ${receipt.transactionHash}`);
    return { txHash: receipt.transactionHash, reward: rewardAmount };

  } catch (err) {
    console.error("[RewardDistributor] Error:", err.message);
    return { error: err.message };
  }
}

// ── Send fixed MRT amount directly (welcome bonus, referrals) ─────
async function sendFixedReward(playerAddress, amountMRT) {
  try {
    const { wallet, provider } = buildWallet();
    const MRT_ADDRESS = process.env.REACT_APP_MRT_TOKEN_ADDRESS;
    if (!MRT_ADDRESS) throw new Error("REACT_APP_MRT_TOKEN_ADDRESS not set");

    const token     = new ethers.Contract(MRT_ADDRESS, MRT_ABI, wallet);
    const amountWei = ethers.utils.parseEther(String(amountMRT));

    const bal = await token.balanceOf(wallet.address);
    if (bal.lt(amountWei)) return { error: "Insufficient MRT in reward wallet" };

    const gasOverrides = await getGasOverrides(provider);
    const tx           = await token.transfer(playerAddress, amountWei, gasOverrides);
    const receipt      = await tx.wait();

    console.log(`[RewardDistributor] Fixed ${amountMRT} MRT to ${playerAddress} — tx: ${receipt.transactionHash}`);
    return { txHash: receipt.transactionHash, reward: String(amountMRT) };

  } catch (err) {
    console.error("[RewardDistributor] sendFixedReward error:", err.message);
    return { error: err.message };
  }
}

// ── Pool balance ──────────────────────────────────────────────────
async function getPoolBalance() {
  try {
    const { wallet } = buildWallet();
    const contract   = new ethers.Contract(REWARD_POOL_ADDRESS, REWARD_POOL_ABI, wallet);
    const balance    = await contract.poolBalance();
    return ethers.utils.formatEther(balance);
  } catch {
    return "0";
  }
}

// ── Single export at the bottom ───────────────────────────────────
module.exports = { distributeRaceReward, sendFixedReward, getPoolBalance };
