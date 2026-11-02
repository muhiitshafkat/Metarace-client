import React, { useEffect, useState, useContext } from "react";
import { getMrtBalance, getDailyMrtRemaining } from "../utils/Contract";
import { MyContext } from "../landingcomponents/MyContext";
import { mrtTokenAddress } from "../utils/constants";
import rewardHorse from "../images/Horse/fantastic-animal-constellation_23-2151708303.avif";

const MRT_DECIMALS = 18;
const PLACEMENT_LABELS = ["🥇 1st Place!", "🥈 2nd Place", "🥉 3rd Place", "4th Place"];
const PLACEMENT_COLORS = ["#ffd700", "#c0c0c0", "#cd7f32", "#ffffff"];

export const GameRewards = ({
  account, placement, multiplier, mrtRewarded,
  sessionId, playerStats, savingSession, onPlayAgain,
  dailyLimitMessage, dailyMrtEarned, dailyMrtCap, dailyCapHit,
}) => {
  const AlertContext = useContext(MyContext);
  const [mrtBalance, setMrtBalance]         = useState(null);
  const [dailyLeft, setDailyLeft]           = useState(null);
  const [tokenAdded, setTokenAdded]         = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const safePlacement  = placement || 4;
  const safeMultiplier = multiplier || 100;
  // Use actual server-confirmed reward, fallback to calculated estimate
  const baseRewards    = [50, 30, 15, 5];
  const displayReward  = mrtRewarded > 0
    ? mrtRewarded
    : Math.round((baseRewards[safePlacement - 1] || 5) * safeMultiplier / 100);
  const isPersonalBest = playerStats && displayReward >= (playerStats.bestScore ?? 0);

  // Fetch live MRT balance + daily remaining after reward lands
  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    const load = async () => {
      setLoadingBalance(true);
      try {
        // Small delay to let the on-chain tx confirm
        // Wait for on-chain tx to confirm before reading balance
        await new Promise(r => setTimeout(r, 6000));
        const [bal, left] = await Promise.all([
          getMrtBalance(account),
          getDailyMrtRemaining(account),
        ]);
        if (!cancelled) {
          setMrtBalance(bal);
          setDailyLeft(parseFloat(left));
        }
      } catch {
        if (!cancelled) setMrtBalance(null);
      }
      if (!cancelled) setLoadingBalance(false);
    };
    load();
    return () => { cancelled = true; };
  }, [account, sessionId]);

  // Add MRT token to MetaMask
  const addMrtToMetaMask = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address:  mrtTokenAddress,
            symbol:   "MRT",
            decimals: MRT_DECIMALS,
            image:    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/" + mrtTokenAddress + "/logo.png",
          },
        },
      });
      setTokenAdded(true);
      AlertContext.setAlert({ status: "success", msg: "MRT added to MetaMask!" });
    } catch {
      AlertContext.setAlert({ status: "danger", msg: "Could not add MRT to MetaMask." });
    }
  };

  return (
    <div className="GameRewards">
      {/* Hero image */}
      <div style={{
        width: "100%", height: 120, borderRadius: 12, overflow: "hidden",
        marginBottom: 16, position: "relative",
        background: `url(${rewardHorse}) center/cover`,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(13,13,26,0.9))",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          paddingBottom: 12,
        }}>
          <span style={{
            fontSize: 22, fontWeight: 900, color: "white",
            textShadow: "0 0 20px rgba(192,61,255,0.8)",
            fontFamily: "Arial Black, sans-serif", letterSpacing: 2,
          }}>
            RACE COMPLETE
          </span>
        </div>
      </div>

      {/* Placement title */}
      <h2 style={{ color: PLACEMENT_COLORS[safePlacement - 1] || "#fff" }}>
        {isPersonalBest ? "🏆 NEW PERSONAL BEST!" : PLACEMENT_LABELS[safePlacement - 1] || "Finished!"}
      </h2>

      {/* MRT earned this race */}
      <div className="rewardRow">
        <span className="rewardLabel">MRT Earned This Race</span>
        <span className="rewardValue" style={{ color: "#ffd700", fontSize: 36 }}>
          +{displayReward} MRT
        </span>
        {safeMultiplier > 100 && (
          <span className="rewardSub">
            Base {baseRewards[safePlacement - 1]} × {(safeMultiplier / 100).toFixed(1)} staking bonus
          </span>
        )}
      </div>

      {savingSession && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
          ⏳ Sending MRT to your wallet...
        </div>
      )}

      {!savingSession && !dailyCapHit && (
        <div style={{ fontSize: 12, color: "#00cc44", textAlign: "center", fontWeight: 700 }}>
          ✓ MRT sent to your wallet on Polygon
        </div>
      )}

      {/* Daily cap warning */}
      {dailyCapHit && dailyLimitMessage && (
        <div style={{
          background: "rgba(255,170,0,0.12)", border: "1px solid rgba(255,170,0,0.4)",
          borderRadius: 10, padding: "12px 16px", textAlign: "center",
          fontSize: 13, color: "#ffaa00", lineHeight: 1.6,
        }}>
          ⚠️ {dailyLimitMessage}
        </div>
      )}

      {/* Daily MRT progress bar */}
      {dailyMrtEarned !== undefined && (
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>
              DAILY EARNINGS
            </span>
            <span style={{ fontSize: 11, color: dailyCapHit ? "#ffaa00" : "#00cc44", fontWeight: 700 }}>
              {dailyMrtEarned?.toFixed(1)} / {dailyMrtCap || 500} MRT
            </span>
          </div>
          <div style={{ background: "#222", borderRadius: 4, height: 8 }}>
            <div style={{
              background: dailyCapHit
                ? "linear-gradient(to right, #ffaa00, #ff6600)"
                : "linear-gradient(to right, #00cc44, #00ff88)",
              height: "100%", borderRadius: 4,
              width: `${Math.min(((dailyMrtEarned || 0) / (dailyMrtCap || 500)) * 100, 100)}%`,
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3, textAlign: "right" }}>
            Resets at midnight UTC
          </div>
        </div>
      )}

      <div className="divider" />

      {/* Live MRT wallet balance */}
      <div className="rewardRow">
        <span className="rewardLabel">Your MRT Balance</span>
        <span className="rewardValue">
          {loadingBalance ? "Loading..." : mrtBalance !== null ? `${mrtBalance.toFixed(2)} MRT` : "—"}
        </span>
        <span className="rewardSub">Live balance on Polygon</span>
      </div>

      {/* Daily remaining */}
      {dailyLeft !== null && (
        <div className="rewardRow">
          <span className="rewardLabel">Daily MRT Remaining</span>
          <span className="rewardValue" style={{ fontSize: 20 }}>
            {dailyLeft.toFixed(0)} / 500 MRT
          </span>
          <span className="rewardSub">Resets at midnight UTC</span>
        </div>
      )}

      <div className="divider" />

      {/* Personal stats */}
      {playerStats && (
        <div className="statsGrid">
          <div className="statCell">
            <span className="rewardLabel">Best Score</span>
            <span className="statCellValue">{Math.max(playerStats.bestScore ?? 0, displayReward)}</span>
          </div>
          <div className="statCell">
            <span className="rewardLabel">Global Rank</span>
            <span className="statCellValue">
              {playerStats.rank ? `#${playerStats.rank}` : "—"}
            </span>
          </div>
          <div className="statCell">
            <span className="rewardLabel">Total Games</span>
            <span className="statCellValue">{playerStats.totalGames ?? 0}</span>
          </div>
          <div className="statCell">
            <span className="rewardLabel">Total MRT Earned</span>
            <span className="statCellValue">
              {playerStats.totalMrtEarned ? `${playerStats.totalMrtEarned} MRT` : "—"}
            </span>
          </div>
        </div>
      )}

      <div className="divider" />

      {/* Add MRT to MetaMask */}
      {!tokenAdded ? (
        <button className="claimBtn" onClick={addMrtToMetaMask}>
          🦊 Add MRT to MetaMask
        </button>
      ) : (
        <div style={{ color: "#00cc44", fontWeight: 700, fontSize: 14, textAlign: "center" }}>
          ✓ MRT token added to MetaMask
        </div>
      )}

      {/* MRT contract info */}
      <div className="noStakeNote" style={{ textAlign: "center" }}>
        MRT contract: <a
          href={`https://polygonscan.com/token/${mrtTokenAddress}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#c03dff" }}
        >
          {mrtTokenAddress.slice(0, 10)}...{mrtTokenAddress.slice(-6)}
        </a>
      </div>

      <button className="playAgainBtn" onClick={onPlayAgain}>
        PLAY AGAIN
      </button>
    </div>
  );
};
