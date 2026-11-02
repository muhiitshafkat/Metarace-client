// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MetaRaceToken (MRT)
 * @notice Official token of the MetaRace horse racing game ecosystem.
 *
 * Total Supply: 100,000,000 MRT (fixed at deploy, distributed by owner)
 *
 * Allocation (owner distributes manually after deploy):
 *   40% → Game Reward Pool  (send to GameRewardPool contract)
 *   25% → Staking Rewards   (send to MRTStaking contract)
 *   10% → Liquidity (DEX)   (keep in owner wallet for QuickSwap)
 *   15% → Team / Dev        (keep in owner wallet, vested manually)
 *   10% → Marketing         (keep in owner wallet)
 */
contract MetaRaceToken is ERC20, ERC20Burnable, ERC20Permit, Ownable {

    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 10 ** 18; // 100 million MRT

    constructor(address initialOwner)
        ERC20("MetaRace Token", "MRT")
        ERC20Permit("MetaRace Token")
        Ownable(initialOwner)
    {
        // Mint entire supply to the deployer (owner)
        // Owner then distributes to contracts and wallets
        _mint(initialOwner, TOTAL_SUPPLY);
    }
}
