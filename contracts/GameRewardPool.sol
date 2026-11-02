// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GameRewardPool
 * @notice Holds MRT and distributes race rewards to players.
 */
contract GameRewardPool is Ownable, ReentrancyGuard {

    using SafeERC20 for IERC20;

    IERC20 public immutable mrtToken;

    // The server wallet address (0x7fD8d82A595e99Ebdb9a2812416f58DE1E72C761)
    address public serverWallet;

    // Daily reward cap per player
    uint256 public constant DAILY_CAP = 500 * 10 ** 18;       // 500 MRT
    uint256 public constant MAX_SINGLE_REWARD = 150 * 10 ** 18; // 150 MRT max per race

    // Race placement base rewards (in MRT, 18 decimals)
    uint256 public reward1st = 50 * 10 ** 18;
    uint256 public reward2nd = 30 * 10 ** 18;
    uint256 public reward3rd = 15 * 10 ** 18;
    uint256 public reward4th =  5 * 10 ** 18;

    // Track daily usage per player: wallet → day → amount claimed
    mapping(address => mapping(uint256 => uint256)) public dailyClaimed;

    // Total distributed ever
    uint256 public totalDistributed;

    // ── Events ────────────────────────────────────────────────
    event RewardDistributed(address indexed player, uint256 amount, uint8 placement);
    event ServerWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event RewardsWithdrawn(address indexed to, uint256 amount);

    // ── Modifiers ─────────────────────────────────────────────
    modifier onlyServer() {
        require(msg.sender == serverWallet, "GameRewardPool: caller is not server wallet");
        _;
    }

    // ── Constructor ───────────────────────────────────────────
    constructor(
        address _mrtToken,
        address _serverWallet,
        address _owner
    ) Ownable(_owner) {
        require(_mrtToken != address(0), "Invalid token address");
        require(_serverWallet != address(0), "Invalid server wallet");
        mrtToken = IERC20(_mrtToken);
        serverWallet = _serverWallet;
    }

    // ── Core: distribute reward after race ────────────────────
    /**
     * @param player    The player's wallet address
     * @param placement Race finish position (1, 2, 3, or 4)
     * @param multiplier Staking multiplier × 100 (100=×1.0, 150=×1.5, 200=×2.0, 300=×3.0)
     */
    function distributeReward(
        address player,
        uint8 placement,
        uint16 multiplier
    ) external onlyServer nonReentrant {
        require(player != address(0), "Invalid player address");
        require(placement >= 1 && placement <= 4, "Invalid placement");
        require(multiplier >= 100 && multiplier <= 300, "Invalid multiplier");

        // Base reward by placement
        uint256 base;
        if      (placement == 1) base = reward1st;
        else if (placement == 2) base = reward2nd;
        else if (placement == 3) base = reward3rd;
        else                     base = reward4th;

        // Apply multiplier (multiplier is ×100 to avoid decimals)
        uint256 reward = (base * multiplier) / 100;

        // Cap single reward
        if (reward > MAX_SINGLE_REWARD) reward = MAX_SINGLE_REWARD;

        // Check daily cap
        uint256 today = block.timestamp / 1 days;
        uint256 alreadyClaimed = dailyClaimed[player][today];
        require(alreadyClaimed < DAILY_CAP, "Daily cap reached");

        // Reduce reward if it would exceed daily cap
        if (alreadyClaimed + reward > DAILY_CAP) {
            reward = DAILY_CAP - alreadyClaimed;
        }

        // Check pool balance
        require(mrtToken.balanceOf(address(this)) >= reward, "Insufficient pool balance");

        // Update state before transfer (reentrancy protection)
        dailyClaimed[player][today] += reward;
        totalDistributed += reward;

        // Fix: safeTransfer
        mrtToken.safeTransfer(player, reward);

        emit RewardDistributed(player, reward, placement);
    }

    // ── Views ─────────────────────────────────────────────────
    function poolBalance() external view returns (uint256) {
        return mrtToken.balanceOf(address(this));
    }

    function dailyRemaining(address player) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        uint256 claimed = dailyClaimed[player][today];
        if (claimed >= DAILY_CAP) return 0;
        return DAILY_CAP - claimed;
    }

    // ── Admin ─────────────────────────────────────────────────
    function setServerWallet(address _newServerWallet) external onlyOwner {
        require(_newServerWallet != address(0), "Invalid address");
        emit ServerWalletUpdated(serverWallet, _newServerWallet);
        serverWallet = _newServerWallet;
    }

    function setRewards(
        uint256 _1st, uint256 _2nd, uint256 _3rd, uint256 _4th
    ) external onlyOwner {
        reward1st = _1st;
        reward2nd = _2nd;
        reward3rd = _3rd;
        reward4th = _4th;
    }

    // Emergency withdraw — owner can recover MRT
    function withdrawMRT(address to, uint256 amount) external onlyOwner {
        mrtToken.safeTransfer(to, amount);
        emit RewardsWithdrawn(to, amount);
    }
}
