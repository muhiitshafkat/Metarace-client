import React, { useEffect, useState, useCallback } from "react";
import { fetchLeaderboard } from "./gameApi";
import { copyToClipboard } from "../utils/copyToClipboard";

// Copy with feedback hook
function useCopy() {
  const [copied, setCopied] = useState(null);
  const copy = useCallback((text, key) => {
    copyToClipboard(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    }).catch(() => {});
  }, []);
  return { copied, copy };
}

export const Leaderboard = ({ currentWallet }) => {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("score"); // score | mrt | wins
  const { copied, copy }        = useCopy();

  useEffect(() => {
    fetchLeaderboard(20)
      .then(res => { if (res.success) setEntries(res.leaderboard); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shortWallet = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const rankBadge = (rank) => {
    if (rank === 1) return { emoji: "🥇", color: "#ffd700", bg: "rgba(255,215,0,0.12)" };
    if (rank === 2) return { emoji: "🥈", color: "#c0c0c0", bg: "rgba(192,192,192,0.1)" };
    if (rank === 3) return { emoji: "🥉", color: "#cd7f32", bg: "rgba(205,127,50,0.1)" };
    return { emoji: `#${rank}`, color: "rgba(255,255,255,0.4)", bg: "transparent" };
  };

  // Sort by selected tab
  const sorted = [...entries].sort((a, b) => {
    if (tab === "mrt")  return (b.total_mrt_earned || 0) - (a.total_mrt_earned || 0);
    if (tab === "wins") return (b.wins || 0) - (a.wins || 0);
    return (b.best_score || 0) - (a.best_score || 0);
  });

  return (
    <div className="LeaderboardWrap">
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
      }}>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(95,61,255,0.6))" }} />
        <span style={{
          fontSize: 13, fontWeight: 900, letterSpacing: 3,
          color: "rgba(255,255,255,0.7)", textTransform: "uppercase",
        }}>LEADERBOARD</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(95,61,255,0.6))" }} />
      </div>

      {/* Tab switcher */}
      <div style={{
        display: "flex", gap: 0, marginBottom: 14,
        borderRadius: 8, overflow: "hidden",
        border: "1px solid rgba(95,61,255,0.25)",
      }}>
        {[
          { key: "score", label: "Best Score" },
          { key: "mrt",   label: "MRT Earned" },
          { key: "wins",  label: "Wins" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "7px 4px", border: "none",
            background: tab === t.key ? "rgba(95,61,255,0.45)" : "rgba(255,255,255,0.03)",
            color: tab === t.key ? "white" : "rgba(255,255,255,0.4)",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            letterSpacing: 0.5, transition: "all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          Loading...
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          No races yet. Be the first!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sorted.map((e, idx) => {
            const isMe = currentWallet && e.wallet_address === currentWallet.toLowerCase();
            const badge = rankBadge(idx + 1);
            const displayName = e.display_name || shortWallet(e.wallet_address);
            const isWallet = !e.display_name || e.display_name === e.wallet_address;

            return (
              <div key={e.wallet_address} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10,
                background: isMe
                  ? "rgba(147,51,234,0.18)"
                  : idx < 3 ? badge.bg : "rgba(255,255,255,0.03)",
                border: isMe
                  ? "1px solid rgba(147,51,234,0.5)"
                  : idx < 3 ? `1px solid ${badge.color}22` : "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.15s",
              }}>
                {/* Rank */}
                <div style={{
                  minWidth: 32, textAlign: "center",
                  fontSize: idx < 3 ? 20 : 13,
                  color: badge.color, fontWeight: 900,
                }}>
                  {badge.emoji}
                </div>

                {/* Name + wallet */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: isMe ? "#c03dff" : "white",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {isWallet ? shortWallet(e.wallet_address) : displayName}
                    {isMe && (
                      <span style={{
                        marginLeft: 6, fontSize: 9, fontWeight: 900,
                        background: "linear-gradient(to right,#c03dff,#5f3dff)",
                        padding: "2px 6px", borderRadius: 4, color: "white",
                        verticalAlign: "middle",
                      }}>YOU</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
                    {e.total_games || 0} races
                    {e.wins > 0 && ` · ${e.wins} win${e.wins !== 1 ? "s" : ""}`}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ textAlign: "right" }}>
                  {tab === "score" && (
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#c03dff" }}>
                      {e.best_score || 0}
                    </div>
                  )}
                  {tab === "mrt" && (
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#ffd700" }}>
                      {(e.total_mrt_earned || 0).toFixed(1)} MRT
                    </div>
                  )}
                  {tab === "wins" && (
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#00cc44" }}>
                      {e.wins || 0} 🏆
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>
                    {e.last_played ? new Date(e.last_played).toLocaleDateString() : ""}
                  </div>
                </div>

                {/* Copy wallet */}
                <button
                  onClick={() => copy(e.wallet_address, e.wallet_address)}
                  title="Copy wallet address"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: copied === e.wallet_address ? "#00cc44" : "rgba(255,255,255,0.2)",
                    fontSize: 12, padding: "2px 4px", transition: "color 0.2s",
                  }}
                >
                  {copied === e.wallet_address ? "✓" : "⧉"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
