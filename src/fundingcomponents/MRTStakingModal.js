import React, { useState, useEffect, useContext, useCallback } from "react";
import { MyContext } from "../landingcomponents/MyContext";
import { StakeSettingModal } from "./StakeSettingModal";
import {
  getMrtBalance,
  getMrtStakeInfo,
  getMrtTotalStaked,
  getMrtRewardReserve,
  approveMrtStaking,
  stakeMrt,
  unstakeMrt,
  emergencyUnstakeMrt,
  claimMrtRewards,
} from "../utils/Contract";

// Tier config mirrors MRTStaking.sol
const TIERS = [
  { id: 0, days: 30,  apy: 8,  label: "30 Days",  multiplierLabel: "×1.5" },
  { id: 1, days: 90,  apy: 20, label: "90 Days",  multiplierLabel: "×2.0" },
  { id: 2, days: 180, apy: 40, label: "180 Days", multiplierLabel: "×3.0" },
];

export const MRTStakingModal = ({ address, onDisconnect }) => {
  const AlertContext = useContext(MyContext);

  // ── State ─────────────────────────────────────────────────
  const [mrtBalance,    setMrtBalance]    = useState(0);
  const [stakeInfo,     setStakeInfo]     = useState(null);
  const [totalStaked,   setTotalStaked]   = useState(0);
  const [rewardReserve, setRewardReserve] = useState(0);
  const [loading,       setLoading]       = useState(true);

  const [selectedTier,  setSelectedTier]  = useState(1); // default 90 days
  const [stakeAmount,   setStakeAmount]   = useState("");
  const [modalShow,     setModalShow]     = useState(false);
  const [stakeType,     setStakeType]     = useState("");
  const [txPending,     setTxPending]     = useState(false);

  // ── Load data ─────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [bal, info, total, reserve] = await Promise.allSettled([
        getMrtBalance(address),
        getMrtStakeInfo(address),
        getMrtTotalStaked(),
        getMrtRewardReserve(),
      ]);
      if (bal.status     === "fulfilled") setMrtBalance(bal.value);
      if (info.status    === "fulfilled") setStakeInfo(info.value);
      if (total.status   === "fulfilled") setTotalStaked(total.value);
      if (reserve.status === "fulfilled") setRewardReserve(reserve.value);
    } catch { /* non-fatal */ }
    setLoading(false);
  }, [address]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Helpers ───────────────────────────────────────────────
  const isStaking    = stakeInfo && stakeInfo.amount > 0;
  const isLocked     = isStaking && stakeInfo.daysRemaining > 0;
  const tier         = TIERS[selectedTier];
  const estimatedAPY = tier.apy;
  const estimatedReward = stakeAmount
    ? ((parseFloat(stakeAmount) * estimatedAPY / 100) * (tier.days / 365)).toFixed(2)
    : "0";

  const unlockDate = isStaking
    ? new Date(stakeInfo.unlockAt * 1000).toLocaleDateString()
    : null;

  // ── Actions ───────────────────────────────────────────────
  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    setTxPending(true);
    // Step 1: approve
    const approveResult = await approveMrtStaking(stakeAmount, address);
    if (approveResult.status !== "success") {
      AlertContext.setAlert(approveResult);
      setTxPending(false);
      setModalShow(false);
      return;
    }
    // Step 2: stake
    const stakeResult = await stakeMrt(stakeAmount, selectedTier, address);
    AlertContext.setAlert(stakeResult);
    setTxPending(false);
    setModalShow(false);
    if (stakeResult.status === "success") loadData();
  };

  const handleUnstake = async () => {
    setTxPending(true);
    const result = await unstakeMrt(address);
    AlertContext.setAlert(result);
    setTxPending(false);
    setModalShow(false);
    if (result.status === "success") loadData();
  };

  const handleEmergencyUnstake = async () => {
    setTxPending(true);
    const result = await emergencyUnstakeMrt(address);
    AlertContext.setAlert(result);
    setTxPending(false);
    setModalShow(false);
    if (result.status === "success") loadData();
  };

  const handleClaim = async () => {
    setTxPending(true);
    const result = await claimMrtRewards(address);
    AlertContext.setAlert(result);
    setTxPending(false);
    if (result.status === "success") loadData();
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="EthereumModal">
      <StakeSettingModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        onStake={handleStake}
        onUnstake={handleUnstake}
        onEmergencyUnstake={handleEmergencyUnstake}
        stakeType={stakeType}
        stakeValue={stakeAmount}
        defaultDay={tier.days}
      />

      <div className="centerModal">

        {/* ── Header ── */}
        <div className="btnGroup firstGroup">
          <div className="ethBtn ethBtn1 ethIconBtn" style={{ width: 180 }}>
            🏇 MRT Staking
          </div>
          <div className="ethBtn1" style={{ fontSize: 12, color: "#c03dff" }}>
            Polygon Mainnet
          </div>
        </div>

        {/* ── Tier selector ── */}
        <div className="btnGroup">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className="ethBtn ethBtn1 prefix1"
              onClick={() => !isStaking && setSelectedTier(t.id)}
              style={{
                background: selectedTier === t.id
                  ? "linear-gradient(to right,#7335d6,#963aea)"
                  : undefined,
                color: selectedTier === t.id ? "white" : undefined,
                cursor: isStaking ? "not-allowed" : "pointer",
                opacity: isStaking && selectedTier !== t.id ? 0.4 : 1,
              }}
            >
              <span style={{ fontSize: 10, position: "absolute", top: 2, left: 5, fontWeight: 900, color: "white" }}>
                {t.multiplierLabel}
              </span>
              {t.label}
            </div>
          ))}
        </div>

        {/* ── APY info ── */}
        <div className="btnGroup">
          <span className="cover1">
            <span className="cover3">{estimatedAPY}%</span>{" "}
            <span className="cover2">APY</span> — Lock for{" "}
            <span className="cover3">{tier.days} days</span> — Race multiplier{" "}
            <span className="cover2">{tier.multiplierLabel}</span>
          </span>
        </div>

        {/* ── Stats row 1 ── */}
        <div className="btnGroup">
          <div className="ethBtn2 infoBtn">
            <span className="iSpan">MRT Balance</span>
            <span className="cSpan">
              {loading ? "..." : mrtBalance.toFixed(2)}
            </span>
          </div>
          <div className="ethBtn2 infoBtn">
            <span className="iSpan">Total MRT Staked</span>
            <span className="cSpan">
              {loading ? "..." : totalStaked.toFixed(0)}
            </span>
          </div>
        </div>

        {/* ── Stats row 2 ── */}
        <div className="btnGroup">
          <div className="ethBtn2 infoBtn">
            <span className="iSpan">Your Staked</span>
            <span className="cSpan">
              {loading ? "..." : isStaking ? stakeInfo.amount.toFixed(2) : "0"}
            </span>
          </div>
          <div className="ethBtn2 infoBtn">
            <span className="iSpan">Pending Rewards</span>
            <span className="cSpan">
              {loading ? "..." : isStaking ? stakeInfo.pending.toFixed(4) : "0"}
            </span>
          </div>
        </div>

        {/* ── Lock info (if staking) ── */}
        {isStaking && (
          <div className="btnGroup">
            <div className="ethBtn2 infoBtn" style={{ width: "100%", maxWidth: 468 }}>
              <span className="iSpan">
                {isLocked
                  ? `Locked — ${stakeInfo.daysRemaining} days remaining (unlocks ${unlockDate})`
                  : `✅ Lock expired — ready to unstake (${unlockDate})`}
              </span>
              <span className="cSpan" style={{ fontSize: 14 }}>
                Tier: {TIERS[stakeInfo.tier]?.label} @ {TIERS[stakeInfo.tier]?.apy}% APY
              </span>
            </div>
          </div>
        )}

        {/* ── Estimated reward preview ── */}
        {!isStaking && stakeAmount && (
          <div className="btnGroup">
            <div className="ethBtn2" style={{ width: 468 }}>
              <span className="iSpan">Estimated reward after {tier.days} days</span>
              <span className="cSpan">~{estimatedReward} MRT</span>
            </div>
          </div>
        )}

        {/* ── Stake input ── */}
        {!isStaking && (
          <>
            <div className="btnGroup amountGroup">
              <div className="wSpan">Enter Stake Amount (MRT)</div>
              <div style={{ display: "flex" }}>
                <input
                  placeholder="Amount to stake"
                  className="ethBtn2 ethBtn4 inputBtn"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  type="number"
                  min="0"
                  style={{ color: "white", background: "#191919" }}
                />
                <div
                  className="maxBtn"
                  onClick={() => setStakeAmount(mrtBalance.toFixed(2))}
                />
              </div>
            </div>

            <div className="btnGroup">
              <div
                className="ethBtn5"
                onClick={() => {
                  if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
                  setStakeType("stake");
                  setModalShow(true);
                }}
                style={{ opacity: txPending ? 0.5 : 1 }}
              >
                {txPending ? "Processing..." : "Stake MRT"}
              </div>
            </div>
          </>
        )}

        {/* ── Claim rewards ── */}
        {isStaking && stakeInfo.pending > 0 && (
          <div className="btnGroup">
            <div
              className="ethBtn5"
              onClick={handleClaim}
              style={{ opacity: txPending ? 0.5 : 1 }}
            >
              {txPending ? "Processing..." : `Claim ${stakeInfo.pending.toFixed(4)} MRT Rewards`}
            </div>
          </div>
        )}

        {/* ── Unstake buttons ── */}
        {isStaking && (
          <div className="btnGroup" style={{ marginBottom: 20 }}>
            <div className="setNumberGroup">
              <div className="availStake">
                <span className="iSpan">Staked Amount</span>
                <span className="cSpan">{stakeInfo.amount.toFixed(2)}</span>
              </div>
            </div>
            {!isLocked ? (
              <div
                className="ethBtn2 unstakeBtn"
                onClick={() => { setStakeType("unstake"); setModalShow(true); }}
              >
                Unstake + Claim
              </div>
            ) : (
              <div
                className="ethBtn2 unstakeBtn"
                onClick={() => { setStakeType("emergencyUnstake"); setModalShow(true); }}
                style={{ background: "linear-gradient(to right,#cc2200,#ff4400)" }}
              >
                Emergency Unstake
              </div>
            )}
          </div>
        )}

        {/* ── Reward reserve ── */}
        <div className="btnGroup" style={{ paddingBottom: 20 }}>
          <span className="cover1">
            Reward reserve:{" "}
            <span className="cover2">{rewardReserve.toFixed(0)} MRT</span>
            {" "}available for staking rewards
          </span>
        </div>

        {/* ── Disconnect ── */}
        {address && (
          <div className="disconnetGp">
            <div className="wallnetBtn" onClick={onDisconnect}>
              Disconnect
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
