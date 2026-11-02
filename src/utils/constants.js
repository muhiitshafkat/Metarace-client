import abi from "./Transactions.json";

// ── Legacy contracts (Sepolia test — kept for reference) ──────────
export const contractAddress = "0xE8A3bbCbaca793ad7ba601e9061123ac744b72a7";
export const contractABI = abi.abi;

export const nftCollectionAddress = "0xff6ee6969eaf27efcc4827becabc0d6b95801e5a";
export const nftCollectionABI = abi.nftCollectionABI;

export const nftStakingContractAddress = "0xd2775e97ebf4de6ab1f007be94e0dd2649885464";
export const nftStakingContractABI = abi.nftStakingABI;

export const testNftCollectionAddress = "0x16ae201b91A864289C52a0f38984cd74f9D79d72";
export const testNftCollectionABI = abi.testNftCollectionABI;

export const testNftStakingContractAddress = "0xd3dE51B8AB23a7EB9f8419563cC10C0d10252D82";
export const testNftStakingContractABI = abi.nftStakingABI;

// ── MRT Token contracts (Polygon Mainnet) ─────────────────────────
export const mrtTokenAddress    = "0x2A4C627677F422eb0B6e903878b2c78E8d709cd4";
export const rewardPoolAddress  = "0xA25D5E495a99172A902b927BefEE36709F2e1927";
export const mrtStakingAddress  = "0xd62e31eD99793e69226717876bD3414677D4Eaa5";

// ── MRT Token ABI (ERC20 + Burnable + Permit) ─────────────────────
export const mrtTokenABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function burn(uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

// ── GameRewardPool ABI ────────────────────────────────────────────
export const rewardPoolABI = [
  "function distributeReward(address player, uint8 placement, uint16 multiplier)",
  "function poolBalance() view returns (uint256)",
  "function dailyRemaining(address player) view returns (uint256)",
  "function totalDistributed() view returns (uint256)",
  "function reward1st() view returns (uint256)",
  "function reward2nd() view returns (uint256)",
  "function reward3rd() view returns (uint256)",
  "function reward4th() view returns (uint256)",
  "function DAILY_CAP() view returns (uint256)",
  "function serverWallet() view returns (address)",
  "function setServerWallet(address)",
  "function setRewards(uint256,uint256,uint256,uint256)",
  "function withdrawMRT(address to, uint256 amount)",
  "event RewardDistributed(address indexed player, uint256 amount, uint8 placement)",
];

// ── MRTStaking ABI ────────────────────────────────────────────────
export const mrtStakingABI = [
  "function stake(uint256 amount, uint8 tier)",
  "function unstake()",
  "function emergencyUnstake()",
  "function claimRewards()",
  "function depositRewards(uint256 amount)",
  "function recoverExcess(address to)",
  "function pendingReward(address user) view returns (uint256)",
  "function getRaceMultiplier(address user) view returns (uint16)",
  "function rewardReserve() view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function getStakeInfo(address user) view returns (uint256 amount, uint256 stakedAt, uint256 unlockAt, uint8 tier, uint256 pending, uint16 multiplier, uint256 daysRemaining)",
  "function stakes(address) view returns (uint256 amount, uint256 stakedAt, uint256 unlockAt, uint8 tier, uint256 rewardDebt)",
  "function tiers(uint8) view returns (uint256 lockDays, uint256 apyBps)",
  "event Staked(address indexed user, uint256 amount, uint8 tier, uint256 unlockAt)",
  "event Unstaked(address indexed user, uint256 principal, uint256 reward, uint256 penalty)",
  "event RewardsClaimed(address indexed user, uint256 amount)",
];
