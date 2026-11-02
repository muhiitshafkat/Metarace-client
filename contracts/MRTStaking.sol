// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MRTStaking
 * @notice Stake MRT tokens to earn MRT rewards + race multipliers.
 *
 * Fixes applied:
 *   1. SafeERC20 — all token transfers use safeTransfer/safeTransferFrom
 *   2. Reward pool tracking — rewards only paid if contract holds enough MRT
 *      above the total principal (rewardReserve = balance - totalStaked)
 *   3. No front-running risk — stake/unstake amounts are fully determined
 *      on-chain, no user-supplied slippage parameters needed for ERC20
 *
 * Lock Tiers:
 *   Tier 0 — 30 days  →  8% APY
 *   Tier 1 — 90 days  → 20% APY
 *   Tier 2 — 180 days → 40% APY
 *
 * Race Multipliers (staked amount):
 *   0       MRT → ×1.0 (100)
 *   1,000+  MRT → ×1.5 (150)
 *   5,000+  MRT → ×2.0 (200)
 *   10,000+ MRT → ×3.0 (300)
 *
 * Early Unstake Penalty:
 *   Principal always returned in full.
 *   50% of accrued rewards burned, 50% returned to user.
 */
contract MRTStaking is Ownable, ReentrancyGuard {

    // ── Fix 1: SafeERC20 ─────────────────────────────────────
    using SafeERC20 for IERC20;

    IERC20 public immutable mrtToken;

    // Dead address used for burns
    address private constant DEAD = 0x000000000000000000000000000000000000dEaD;

    // ── Tier config ───────────────────────────────────────────
    struct Tier {
        uint256 lockDays;
        uint256 apyBps;   // basis points: 800 = 8%, 2000 = 20%, 4000 = 40%
    }
    Tier[3] public tiers;

    // ── Stake record ──────────────────────────────────────────
    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 unlockAt;
        uint8   tier;
        uint256 rewardDebt; // rewards already paid out to this staker
    }
    mapping(address => StakeInfo) public stakes;

    // ── Fix 2: Reward pool tracking ───────────────────────────
    // Tracks total MRT principal locked by all stakers.
    // rewardReserve = contract balance - totalStaked
    // Rewards are only paid from rewardReserve, never from principal.
    uint256 public totalStaked;

    // ── Events ────────────────────────────────────────────────
    event Staked(address indexed user, uint256 amount, uint8 tier, uint256 unlockAt);
    event Unstaked(address indexed user, uint256 principal, uint256 reward, uint256 penalty);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDeposited(uint256 amount);

    // ── Constructor ───────────────────────────────────────────
    constructor(address _mrtToken, address _owner) Ownable(_owner) {
        require(_mrtToken != address(0), "Invalid token");
        mrtToken = IERC20(_mrtToken);

        tiers[0] = Tier({ lockDays: 30,  apyBps: 800  });
        tiers[1] = Tier({ lockDays: 90,  apyBps: 2000 });
        tiers[2] = Tier({ lockDays: 180, apyBps: 4000 });
    }

    // ── Stake ─────────────────────────────────────────────────
    function stake(uint256 amount, uint8 tier) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(tier <= 2, "Invalid tier");
        require(stakes[msg.sender].amount == 0, "Already staking");

        // Fix 1: safeTransferFrom instead of raw transferFrom
        mrtToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 unlockAt = block.timestamp + (tiers[tier].lockDays * 1 days);

        stakes[msg.sender] = StakeInfo({
            amount:     amount,
            stakedAt:   block.timestamp,
            unlockAt:   unlockAt,
            tier:       tier,
            rewardDebt: 0
        });

        totalStaked += amount;

        emit Staked(msg.sender, amount, tier, unlockAt);
    }

    // ── Normal unstake (after lock expires) ───────────────────
    function unstake() external nonReentrant {
        StakeInfo storage s = stakes[msg.sender];
        require(s.amount > 0, "Nothing staked");
        require(block.timestamp >= s.unlockAt, "Still locked - use emergencyUnstake");

        uint256 principal = s.amount;

        // Fix 2: cap reward to available reserve
        uint256 reward = _cappedReward(msg.sender);

        totalStaked -= principal;
        delete stakes[msg.sender];

        // Fix 1: safeTransfer
        mrtToken.safeTransfer(msg.sender, principal + reward);

        emit Unstaked(msg.sender, principal, reward, 0);
    }

    // ── Emergency unstake (before lock, penalty applies) ──────
    function emergencyUnstake() external nonReentrant {
        StakeInfo storage s = stakes[msg.sender];
        require(s.amount > 0, "Nothing staked");
        require(block.timestamp < s.unlockAt, "Lock expired - use unstake");

        uint256 principal = s.amount;

        // Fix 2: cap reward to available reserve
        uint256 reward = _cappedReward(msg.sender);

        uint256 penalty    = reward / 2;
        uint256 userReward = reward - penalty;

        totalStaked -= principal;
        delete stakes[msg.sender];

        // Fix 1: safeTransfer for burn
        if (penalty > 0) {
            mrtToken.safeTransfer(DEAD, penalty);
        }

        // Fix 1: safeTransfer for user payout
        mrtToken.safeTransfer(msg.sender, principal + userReward);

        emit Unstaked(msg.sender, principal, userReward, penalty);
    }

    // ── Claim rewards without unstaking ───────────────────────
    function claimRewards() external nonReentrant {
        StakeInfo storage s = stakes[msg.sender];
        require(s.amount > 0, "Nothing staked");

        // Fix 2: cap reward to available reserve
        uint256 reward = _cappedReward(msg.sender);
        require(reward > 0, "No rewards available");

        // Record as paid before transfer (reentrancy safe)
        s.rewardDebt += reward;

        // Fix 1: safeTransfer
        mrtToken.safeTransfer(msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward);
    }

    // ── Views ─────────────────────────────────────────────────

    /// @notice How much MRT is available as reward reserve
    function rewardReserve() public view returns (uint256) {
        uint256 balance = mrtToken.balanceOf(address(this));
        return balance > totalStaked ? balance - totalStaked : 0;
    }

    /// @notice Pending reward for a user (capped to reserve)
    function pendingReward(address user) external view returns (uint256) {
        return _cappedReward(user);
    }

    /// @notice Race multiplier (×100 scale)
    function getRaceMultiplier(address user) external view returns (uint16) {
        uint256 staked = stakes[user].amount;
        if      (staked >= 10_000 * 10 ** 18) return 300;
        else if (staked >=  5_000 * 10 ** 18) return 200;
        else if (staked >=  1_000 * 10 ** 18) return 150;
        else                                   return 100;
    }

    /// @notice Full stake info for a user
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 stakedAt,
        uint256 unlockAt,
        uint8   tier,
        uint256 pending,
        uint16  multiplier,
        uint256 daysRemaining
    ) {
        StakeInfo storage s = stakes[user];
        amount        = s.amount;
        stakedAt      = s.stakedAt;
        unlockAt      = s.unlockAt;
        tier          = s.tier;
        pending       = _cappedReward(user);
        multiplier    = this.getRaceMultiplier(user);
        daysRemaining = s.unlockAt > block.timestamp
            ? (s.unlockAt - block.timestamp) / 1 days
            : 0;
    }

    // ── Internal ──────────────────────────────────────────────

    /// @dev Raw accrued reward based on APY formula
    function _calculateReward(address user) internal view returns (uint256) {
        StakeInfo storage s = stakes[user];
        if (s.amount == 0) return 0;

        uint256 elapsed = block.timestamp - s.stakedAt;
        uint256 apyBps  = tiers[s.tier].apyBps;

        // reward = principal × APY × (elapsed / 365 days)
        uint256 gross = (s.amount * apyBps * elapsed) / (10_000 * 365 days);

        if (gross <= s.rewardDebt) return 0;
        return gross - s.rewardDebt;
    }

    /// @dev Fix 2: reward capped to available reserve — never pays from principal
    function _cappedReward(address user) internal view returns (uint256) {
        uint256 raw     = _calculateReward(user);
        uint256 reserve = rewardReserve();
        return raw < reserve ? raw : reserve;
    }

    // ── Admin ─────────────────────────────────────────────────

    /// @notice Owner deposits MRT to top up the reward reserve
    function depositRewards(uint256 amount) external onlyOwner {
        // Fix 1: safeTransferFrom
        mrtToken.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardsDeposited(amount);
    }

    /// @notice Recover only excess MRT (above totalStaked) — never touches principal
    function recoverExcess(address to) external onlyOwner {
        uint256 excess = rewardReserve();
        require(excess > 0, "No excess to recover");
        // Fix 1: safeTransfer
        mrtToken.safeTransfer(to, excess);
    }
}
