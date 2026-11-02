import React, { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FundingContext } from "./FundingContext";
import { getMrtBalance, getMrtStakeInfo } from "../utils/Contract";
import { Wallnetbtn } from "./Walletbtn";
import { copyToClipboard } from "../utils/copyToClipboard";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:4000/api/v1";

const PLACEMENT_LABELS = ["🥇 1st", "🥈 2nd", "🥉 3rd", "4th"];
const PLACEMENT_COLORS = ["#ffd700", "#c0c0c0", "#cd7f32", "#aaaaaa"];

function Avatar({ seed, size = 64 }) {
  return (
    <img
      src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed || "default"}&size=${size}`}
      alt="avatar"
      style={{ borderRadius: "50%", border: "3px solid rgba(95,61,255,0.5)", width: size, height: size }}
    />
  );
}

function StatCard({ label, value, sub, color = "#c03dff" }) {
  return (
    <div style={{
      background: "rgba(95,61,255,0.08)", border: "1px solid rgba(95,61,255,0.2)",
      borderRadius: 12, padding: "16px 20px",
    }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function AchievementBadge({ achievement, earned }) {
  return (
    <div style={{
      background: earned ? "rgba(95,61,255,0.15)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${earned ? "rgba(95,61,255,0.4)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 12, padding: "12px 14px",
      display: "flex", alignItems: "center", gap: 10,
      opacity: earned ? 1 : 0.45,
    }}>
      <span style={{ fontSize: 24 }}>{achievement.emoji}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: earned ? "white" : "rgba(255,255,255,0.5)" }}>
          {achievement.label}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{achievement.desc}</div>
        {earned && (
          <div style={{ fontSize: 10, color: "#c03dff", marginTop: 2 }}>
            Earned {new Date(achievement.earned_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

export const ProfilePage = () => {
  const router = useRouter();
  const { account } = useContext(FundingContext);

  const [data, setData]           = useState(null);
  const [mrtBalance, setMrtBalance] = useState(null);
  const [stakeInfo, setStakeInfo] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [editMode, setEditMode]   = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [saving, setSaving]       = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedKey, setCopiedKey] = useState(null);

  const copyText = useCallback((text, key) => {
    copyToClipboard(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!account || account.length !== 42) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [profileRes, balRes, stakeRes] = await Promise.allSettled([
        fetch(`${BASE}/profile/${account}`).then(r => r.json()),
        getMrtBalance(account),
        getMrtStakeInfo(account),
      ]);
      if (cancelled) return;
      if (profileRes.status === "fulfilled" && profileRes.value?.success) {
        setData(profileRes.value);
        setNewUsername(profileRes.value.profile?.username || "");
      }
      if (balRes.status === "fulfilled") setMrtBalance(balRes.value);
      if (stakeRes.status === "fulfilled") setStakeInfo(stakeRes.value);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [account]);

  // Username availability check
  useEffect(() => {
    if (!editMode || newUsername.length < 2) { setUsernameStatus(null); return; }
    if (newUsername === data?.profile?.username) { setUsernameStatus("same"); return; }
    const t = setTimeout(async () => {
      const res  = await fetch(`${BASE}/profile/check-username/${encodeURIComponent(newUsername)}`);
      const d    = await res.json();
      setUsernameStatus(d.available ? "available" : "taken");
    }, 500);
    return () => clearTimeout(t);
  }, [newUsername, editMode, data]);

  const saveUsername = async () => {
    if (!account || usernameStatus === "taken") return;
    setSaving(true);
    const res  = await fetch(`${BASE}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: account, username: newUsername }),
    });
    const d = await res.json();
    if (d.success) {
      setData(prev => ({ ...prev, profile: d.profile }));
      setEditMode(false);
    }
    setSaving(false);
  };

  const referralLink = account
    ? `${window.location.origin}/game?ref=${account.slice(0, 10)}`
    : "";

  const copyReferral = () => copyText(referralLink, "referral");
  const copyWallet   = () => copyText(account, "wallet");

  const profile      = data?.profile;
  const stats        = data?.stats;
  const achievements = data?.achievements || [];
  const allAchievements = data?.allAchievements || [];
  const recentRaces  = data?.recentRaces || [];
  const winRate      = stats ? Math.round((stats.wins / Math.max(stats.total_games, 1)) * 100) : 0;
  const unlimitedGameplay = stats?.unlimitedGameplay === true ||
    process.env.REACT_APP_UNLIMITED_GAMEPLAY === "true";

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d1a", color: "white", fontFamily: "Arial, sans-serif" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 40px", borderBottom: "1px solid rgba(95,61,255,0.3)",
        background: "rgba(255,255,255,0.03)",
      }}>
        <button onClick={() => router.push("/")} style={{
          background: "none", border: "1px solid rgba(95,61,255,0.5)",
          color: "white", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 14,
        }}>← Back</button>
        <span style={{
          fontSize: 22, fontWeight: 900,
          background: "linear-gradient(to right,#c03dff,#5f3dff)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>PROFILE</span>
        <Wallnetbtn />
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>

        {!account ? (
          <div style={{ textAlign: "center", marginTop: 80, color: "rgba(255,255,255,0.4)" }}>
            Connect your wallet to view your profile.
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", marginTop: 80, color: "rgba(255,255,255,0.4)" }}>
            Loading...
          </div>
        ) : (
          <>
            {/* Profile header card */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(95,61,255,0.3)",
              borderRadius: 20, padding: "28px 32px", marginBottom: 24,
              display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
            }}>
              <Avatar seed={account} size={80} />
              <div style={{ flex: 1 }}>
                {editMode ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_\- ]/g, ""))}
                      maxLength={20}
                      style={{
                        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(95,61,255,0.5)",
                        color: "white", padding: "8px 14px", borderRadius: 8, fontSize: 16,
                        outline: "none",
                      }}
                    />
                    <span style={{ fontSize: 12, color: usernameStatus === "available" ? "#00cc44" : usernameStatus === "taken" ? "#ff3300" : "#888" }}>
                      {usernameStatus === "available" ? "✓ Available" : usernameStatus === "taken" ? "✗ Taken" : ""}
                    </span>
                    <button onClick={saveUsername} disabled={saving || usernameStatus === "taken"} style={{
                      background: "linear-gradient(to right,#c03dff,#5f3dff)", border: "none",
                      color: "white", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                    }}>
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEditMode(false)} style={{
                      background: "rgba(255,255,255,0.08)", border: "none",
                      color: "white", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                    }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 24, fontWeight: 900 }}>
                      {profile?.username || "Anonymous Jockey"}
                    </span>
                    <button onClick={() => setEditMode(true)} style={{
                      background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                      color: "rgba(255,255,255,0.6)", padding: "4px 10px", borderRadius: 6,
                      cursor: "pointer", fontSize: 11,
                    }}>✏️ Edit</button>
                  </div>
                )}
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  {account.slice(0, 10)}...{account.slice(-6)}
                  <button onClick={copyWallet} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: copiedKey === "wallet" ? "#00cc44" : "rgba(255,255,255,0.3)",
                    fontSize: 12, padding: 0, transition: "color 0.2s",
                  }}>
                    {copiedKey === "wallet" ? "✓ Copied!" : "⧉"}
                  </button>
                </div>
                {stats?.rank && (
                  <div style={{ fontSize: 13, color: "#c03dff", marginTop: 4, fontWeight: 700 }}>
                    Global Rank #{stats.rank}
                  </div>
                )}
              </div>
              {/* MRT balance */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>MRT BALANCE</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#ffd700" }}>
                  {mrtBalance !== null ? mrtBalance.toFixed(2) : "—"}
                </div>
                <a href={`https://polygonscan.com/address/${account}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: "#c03dff" }}>View on Polygonscan ↗</a>
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: "flex", gap: 0, marginBottom: 24,
              borderRadius: 10, overflow: "hidden", border: "1px solid rgba(95,61,255,0.3)",
            }}>
              {["overview", "races", "achievements", "stable"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: "11px 8px", border: "none",
                  background: activeTab === tab ? "rgba(95,61,255,0.4)" : "rgba(255,255,255,0.03)",
                  color: activeTab === tab ? "white" : "rgba(255,255,255,0.4)",
                  fontWeight: 700, fontSize: 12, cursor: "pointer",
                  textTransform: "capitalize", letterSpacing: 0.5,
                }}>
                  {tab === "stable" ? "🐴 Stable" : tab === "achievements" ? "🏅 Achievements" : tab === "races" ? "🏁 Races" : "📊 Overview"}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {activeTab === "overview" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
                  <StatCard label="Total Races"    value={stats?.total_games ?? 0} />
                  <StatCard label="Wins"           value={stats?.wins ?? 0}        color="#ffd700" />
                  <StatCard label="Win Rate"       value={`${winRate}%`}           color={winRate > 20 ? "#00cc44" : "#ffaa00"} />
                  <StatCard label="Total MRT Earned" value={`${(stats?.total_mrt_earned || 0).toFixed(1)}`} sub="MRT" color="#ffd700" />
                  <StatCard label="Best Score"     value={stats?.best_score ?? 0} />
                  <StatCard
                    label="Plays Left Today"
                    value={unlimitedGameplay ? "Unlimited" : (stats?.playsLeft ?? "—")}
                    sub={unlimitedGameplay ? "test mode" : "of 10 daily"}
                  />
                </div>

                {/* Staking info */}
                {stakeInfo && stakeInfo.amount > 0 && (
                  <div style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(95,61,255,0.3)",
                    borderRadius: 16, padding: "20px 24px", marginBottom: 24,
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#c03dff", marginBottom: 14 }}>
                      🔒 Active MRT Stake
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                      <StatCard label="Staked"       value={`${stakeInfo.amount.toFixed(2)} MRT`} />
                      <StatCard label="Pending"      value={`${stakeInfo.pending.toFixed(4)} MRT`} color="#00cc44" />
                      <StatCard label="Days Left"    value={stakeInfo.daysRemaining > 0 ? `${stakeInfo.daysRemaining}d` : "Unlocked ✅"} />
                    </div>
                  </div>
                )}

                {/* Referral */}
                <div style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(95,61,255,0.3)",
                  borderRadius: 16, padding: "20px 24px",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#c03dff", marginBottom: 8 }}>
                    🔗 Referral Link
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
                    Invite friends and earn 50 MRT for each player who joins and races.
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input readOnly value={referralLink} style={{
                      flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(95,61,255,0.3)",
                      color: "rgba(255,255,255,0.7)", padding: "8px 12px", borderRadius: 8, fontSize: 12,
                      outline: "none",
                    }} />
                    <button onClick={copyReferral} style={{
                      background: copiedKey === "referral"
                        ? "rgba(0,204,68,0.2)" : "linear-gradient(to right,#c03dff,#5f3dff)",
                      border: "none",
                      color: "white", padding: "8px 16px", borderRadius: 8,
                      cursor: "pointer", fontSize: 12, fontWeight: 700,
                      transition: "all 0.2s", minWidth: 80,
                    }}>
                      {copiedKey === "referral" ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Races tab */}
            {activeTab === "races" && (
              <div style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(95,61,255,0.3)",
                borderRadius: 16, padding: "20px 24px",
              }}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 16 }}>Recent Races</div>
                {recentRaces.length === 0 ? (
                  <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "40px 0" }}>
                    No races yet. Go race!
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(95,61,255,0.2)" }}>
                        {["Date", "Placement", "MRT Earned", "Tx"].map(h => (
                          <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 10,
                            color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentRaces.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "10px 10px", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                            {new Date(r.played_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "10px 10px", color: PLACEMENT_COLORS[(r.placement || 4) - 1], fontWeight: 700 }}>
                            {PLACEMENT_LABELS[(r.placement || 4) - 1]}
                          </td>
                          <td style={{ padding: "10px 10px", color: "#ffd700", fontWeight: 700 }}>
                            +{r.mrt_rewarded || 0} MRT
                          </td>
                          <td style={{ padding: "10px 10px" }}>
                            {r.reward_tx_hash ? (
                              <a href={`https://polygonscan.com/tx/${r.reward_tx_hash}`}
                                target="_blank" rel="noreferrer" style={{ color: "#c03dff", fontSize: 11 }}>
                                View ↗
                              </a>
                            ) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Achievements tab */}
            {activeTab === "achievements" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                {allAchievements.map(a => {
                  const earned = achievements.find(e => e.id === a.id);
                  return <AchievementBadge key={a.id} achievement={earned || a} earned={!!earned} />;
                })}
              </div>
            )}

            {/* Stable tab */}
            {activeTab === "stable" && (
              <div style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(95,61,255,0.3)",
                borderRadius: 16, padding: "24px", textAlign: "center",
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🐴</div>
                <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Horse Stable</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>
                  Purchase horses from the race lobby to build your stable.
                  Better horses give speed bonuses and higher MRT rewards.
                </div>
                <div style={{
                  display: "inline-block", background: "rgba(95,61,255,0.2)",
                  border: "1px solid rgba(95,61,255,0.4)", borderRadius: 10,
                  padding: "8px 20px", fontSize: 13, color: "#c03dff", fontWeight: 700,
                }}>
                  🔒 Horse NFT purchases — Coming Soon
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
