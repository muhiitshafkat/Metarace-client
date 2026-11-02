import { useState } from "react";

// ── Horse images ──────────────────────────────────────────────────
import horseStorm     from "../images/Horse/majestic-brown-horse-0410-5706220.webp";
import horseThunder   from "../images/Horse/majestic-galloping-horse-0410-5699772.webp";
import horsePhantom   from "../images/Horse/luminous-spirit-horse-stockcake.webp";
import horseCelestial from "../images/Horse/celestial-horse-galloping-stockcake.webp";

// ── Horse data ────────────────────────────────────────────────────
const HORSES = [
  {
    id: 0,
    name: "Storm",
    tier: "Standard",
    emoji: "🐴",
    image: horseStorm,
    color: "#9333ea",
    price: 0,
    owned: true,
    stats: { speed: 45, stamina: 60, acceleration: 50, luck: 40 },
    description: "Your starting horse. Reliable but average.",
    multiplierBonus: 0,
  },
  {
    id: 1,
    name: "Thunder",
    tier: "Rare",
    emoji: "⚡🐴",
    image: horseThunder,
    color: "#f59e0b",
    price: 500,
    owned: false,
    stats: { speed: 65, stamina: 55, acceleration: 70, luck: 50 },
    description: "Fast acceleration. Great for short bursts.",
    multiplierBonus: 10,
  },
  {
    id: 2,
    name: "Phantom",
    tier: "Epic",
    emoji: "👻🐴",
    image: horsePhantom,
    color: "#8b5cf6",
    price: 2000,
    owned: false,
    stats: { speed: 75, stamina: 80, acceleration: 65, luck: 70 },
    description: "High stamina. Dominates the final stretch.",
    multiplierBonus: 25,
  },
  {
    id: 3,
    name: "Celestial",
    tier: "Legendary",
    emoji: "✨🐴",
    image: horseCelestial,
    color: "#ffd700",
    price: 8000,
    owned: false,
    stats: { speed: 95, stamina: 90, acceleration: 90, luck: 95 },
    description: "The ultimate racing machine. Near unbeatable.",
    multiplierBonus: 50,
  },
];

// ── Track data ────────────────────────────────────────────────────
const TRACKS = [
  {
    id: 0,
    name: "Grasslands",
    emoji: "🌿",
    color: "#22c55e",
    status: "available",
    entryFee: 20,
    rewardMultiplier: "1×",
    description: "Classic green track. Perfect for beginners.",
    weather: "Sunny",
    distance: "300m",
  },
  {
    id: 1,
    name: "Desert Canyon",
    emoji: "🏜️",
    color: "#f97316",
    status: "coming_soon",
    entryFee: 50,
    rewardMultiplier: "2×",
    description: "Scorching heat drains stamina faster. High risk, high reward.",
    weather: "Hot",
    distance: "400m",
  },
  {
    id: 2,
    name: "Night Track",
    emoji: "🌙",
    color: "#6366f1",
    status: "coming_soon",
    entryFee: 100,
    rewardMultiplier: "3×",
    description: "NFT holders only. Mysterious and unpredictable.",
    weather: "Night",
    distance: "350m",
  },
  {
    id: 3,
    name: "Mountain Pass",
    emoji: "⛰️",
    color: "#94a3b8",
    status: "coming_soon",
    entryFee: 200,
    rewardMultiplier: "5×",
    description: "Extreme altitude. Only legendary horses can compete.",
    weather: "Stormy",
    distance: "500m",
  },
];

const ENTRY_FEE    = 20;
const WELCOME_MRT  = 100;  // welcome bonus
const FREE_TRIAL   = 5;

// ── Stat bar ──────────────────────────────────────────────────────
function StatBar({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>{label}</span>
        <span style={{ fontSize: 10, color }}>{value}</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 3, height: 6 }}>
        <div style={{
          background: color, height: "100%", borderRadius: 3,
          width: `${value}%`, transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

// ── Horse card ────────────────────────────────────────────────────
function HorseCard({ horse, selected, onSelect }) {
  const tierColors = {
    Standard: "#94a3b8", Rare: "#f59e0b", Epic: "#8b5cf6", Legendary: "#ffd700"
  };
  const tierColor = tierColors[horse.tier];
  const isLocked  = !horse.owned;

  return (
    <div
      onClick={() => !isLocked && onSelect(horse.id)}
      className={`horseCard ${selected ? "selected" : ""} tier-${horse.tier.toLowerCase()}`}
      style={{
        background: selected
          ? `linear-gradient(135deg, rgba(147,51,234,0.2), rgba(0,0,0,0.6))`
          : "rgba(255,255,255,0.04)",
        border: selected
          ? `2px solid ${horse.color}`
          : isLocked ? "2px solid rgba(255,255,255,0.08)" : "2px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: "0 0 14px 0",
        cursor: isLocked ? "not-allowed" : "pointer",
        opacity: isLocked ? 0.7 : 1,
        transition: "all 0.2s",
        position: "relative",
        minWidth: 160,
        flex: "1 1 160px",
        overflow: "hidden",
      }}
    >
      {/* Tier badge */}
      <div style={{
        position: "absolute", top: 8, right: 8, zIndex: 3,
        fontSize: 9, fontWeight: 900, letterSpacing: 1,
        color: tierColor, background: "rgba(0,0,0,0.7)",
        padding: "2px 6px", borderRadius: 4,
        border: `1px solid ${tierColor}`,
      }}>
        {horse.tier.toUpperCase()}
      </div>

      {/* Horse image */}
      <div style={{
        width: "100%", height: 120, overflow: "hidden",
        position: "relative",
      }}>
        <img
          src={horse.image}
          alt={horse.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: isLocked ? "grayscale(50%) brightness(0.65)" : "brightness(1)",
            transition: "filter 0.3s, transform 0.3s",
            display: "block",
          }}
        />
        {/* Bottom fade so text below is readable */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
          background: "linear-gradient(to bottom, transparent, rgba(13,13,26,0.95))",
        }} />
        {isLocked && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.35)", fontSize: 28,
          }}>🔒</div>
        )}
      </div>

      {/* Content below image */}
      <div style={{ padding: "10px 12px 0" }}>

      {/* Name */}
      <div style={{
        fontSize: 15, fontWeight: 900, color: "white",
        textAlign: "center", marginBottom: 4,
        fontFamily: "Arial Black, sans-serif",
      }}>
        {horse.name}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 10, color: "rgba(255,255,255,0.5)",
        textAlign: "center", marginBottom: 10, lineHeight: 1.4,
      }}>
        {horse.description}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
        <StatBar label="SPEED"        value={horse.stats.speed}        color="#4488ff" />
        <StatBar label="STAMINA"      value={horse.stats.stamina}      color="#00cc44" />
        <StatBar label="ACCELERATION" value={horse.stats.acceleration} color="#f59e0b" />
        <StatBar label="LUCK"         value={horse.stats.luck}         color="#c03dff" />
      </div>

      {/* Bonus */}
      {horse.multiplierBonus > 0 && (
        <div style={{
          fontSize: 10, color: "#ffd700", textAlign: "center",
          marginBottom: 8, fontWeight: 700,
        }}>
          +{horse.multiplierBonus}% MRT reward bonus
        </div>
      )}

      {/* Price / status */}
      {isLocked ? (
        <div style={{
          background: "rgba(255,255,255,0.08)", borderRadius: 8,
          padding: "6px 10px", textAlign: "center",
          fontSize: 12, color: tierColor, fontWeight: 900,
        }}>
          🔒 {horse.price.toLocaleString()} MRT
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
            Coming Soon
          </div>
        </div>
      ) : (
        <div style={{
          background: selected ? horse.color : "rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "6px 10px", textAlign: "center",
          fontSize: 12, color: "white", fontWeight: 900,
          transition: "background 0.2s",
        }}>
          {selected ? "✓ Selected" : "Select"}
        </div>
      )}
      </div>{/* end content wrapper */}
    </div>
  );
}

// ── Track card ────────────────────────────────────────────────────
function TrackCard({ track, selected, onSelect }) {
  const isLocked = track.status === "coming_soon";
  return (
    <div
      onClick={() => !isLocked && onSelect(track.id)}
      style={{
        background: selected ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
        border: selected
          ? `2px solid ${track.color}`
          : isLocked ? "2px solid rgba(255,255,255,0.06)" : "2px solid rgba(255,255,255,0.12)",
        borderRadius: 12, padding: "14px 16px",
        cursor: isLocked ? "not-allowed" : "pointer",
        opacity: isLocked ? 0.55 : 1,
        transition: "all 0.2s",
        flex: "1 1 140px",
      }}
    >
      <div style={{ fontSize: 28, textAlign: "center", marginBottom: 6 }}>{track.emoji}</div>
      <div style={{ fontSize: 13, fontWeight: 900, color: "white", textAlign: "center", marginBottom: 4 }}>
        {track.name}
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", textAlign: "center", marginBottom: 8, lineHeight: 1.4 }}>
        {track.description}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 6 }}>
        <span style={{ color: "rgba(255,255,255,0.4)" }}>📏 {track.distance}</span>
        <span style={{ color: "rgba(255,255,255,0.4)" }}>🌤 {track.weather}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span style={{ color: "#ffd700", fontWeight: 700 }}>{track.rewardMultiplier} rewards</span>
        <span style={{ color: track.color, fontWeight: 700 }}>{track.entryFee} MRT</span>
      </div>
      {isLocked && (
        <div style={{
          marginTop: 8, textAlign: "center", fontSize: 10,
          color: track.color, fontWeight: 700, letterSpacing: 1,
        }}>
          COMING SOON
        </div>
      )}
    </div>
  );
}

// ── Main PreRaceLobby ─────────────────────────────────────────────
export const PreRaceLobby = ({ account, mrtBalance, onStartRace, onClaimWelcome, hasClaimed, freeTrialLeft = 0, trialLoaded = false, playerStats }) => {
  const [step, setStep]               = useState("horse");   // horse | track | confirm
  const [selectedHorse, setSelectedHorse] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [claiming, setClaiming]       = useState(false);

  const horse = HORSES[selectedHorse];
  const track = TRACKS[selectedTrack];
  const unlimitedGameplay = process.env.REACT_APP_UNLIMITED_GAMEPLAY === "true" ||
    playerStats?.unlimitedGameplay === true;
  const isFree = unlimitedGameplay || freeTrialLeft > 0;
  const canAffordEntry = isFree || mrtBalance >= ENTRY_FEE;
  // Block start until server confirms trial count — prevents using free trial before data loads
  const isReady = trialLoaded;

  const handleClaim = async () => {
    setClaiming(true);
    await onClaimWelcome();
    setClaiming(false);
  };

  const handleStartRace = () => {
    onStartRace({ horse, track });
  };

  return (
    <div style={{
      maxWidth: 860, margin: "0 auto", padding: "20px 16px",
      fontFamily: "Arial, sans-serif", color: "white",
    }}>

      {/* MRT balance + daily progress + welcome claim */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(95,61,255,0.3)",
        borderRadius: 12, padding: "12px 20px", marginBottom: 24, flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>YOUR MRT BALANCE</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#ffd700" }}>
            {mrtBalance !== null ? `${mrtBalance.toFixed(2)} MRT` : "Loading..."}
          </div>
          {/* Daily earnings progress */}
          {playerStats?.dailyMrtEarned !== undefined && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>
                  TODAY'S EARNINGS
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: playerStats.dailyCapHit ? "#ffaa00" : "#00cc44",
                }}>
                  {(playerStats.dailyMrtEarned || 0).toFixed(1)} / 500 MRT
                  {playerStats.dailyCapHit && " ⚠️ LIMIT REACHED"}
                </span>
              </div>
              <div style={{ background: "#222", borderRadius: 3, height: 6 }}>
                <div style={{
                  background: playerStats.dailyCapHit
                    ? "linear-gradient(to right,#ffaa00,#ff6600)"
                    : "linear-gradient(to right,#00cc44,#00ff88)",
                  height: "100%", borderRadius: 3,
                  width: `${Math.min(((playerStats.dailyMrtEarned || 0) / 500) * 100, 100)}%`,
                }} />
              </div>
            </div>
          )}
        </div>
        {!hasClaimed ? (
          <button
            onClick={handleClaim}
            disabled={claiming}
            style={{
              background: "linear-gradient(to right, #c03dff, #5f3dff)",
              border: "none", color: "white", padding: "10px 20px",
              borderRadius: 10, fontWeight: 900, fontSize: 13,
              cursor: claiming ? "not-allowed" : "pointer",
              opacity: claiming ? 0.6 : 1, whiteSpace: "nowrap",
            }}
          >
            {claiming ? "Claiming..." : `🎁 Claim ${WELCOME_MRT} MRT Welcome Bonus`}
          </button>
        ) : (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            ✓ Welcome bonus claimed
          </div>
        )}
      </div>

      {/* Step tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(95,61,255,0.3)" }}>
        {[
          { key: "horse", label: "1. Choose Horse" },
          { key: "track", label: "2. Choose Track" },
          { key: "confirm", label: "3. Start Race" },
        ].map(s => (
          <button key={s.key} onClick={() => setStep(s.key)} style={{
            flex: 1, padding: "12px 8px", border: "none",
            background: step === s.key ? "rgba(95,61,255,0.5)" : "rgba(255,255,255,0.04)",
            color: step === s.key ? "white" : "rgba(255,255,255,0.4)",
            fontWeight: 900, fontSize: 12, cursor: "pointer",
            letterSpacing: 0.5, transition: "all 0.2s",
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Step: Horse selection */}
      {step === "horse" && (
        <div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>
            Choose your horse. Better horses cost MRT but give speed and reward bonuses.
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {HORSES.map(h => (
              <HorseCard
                key={h.id}
                horse={h}
                selected={selectedHorse === h.id}
                onSelect={setSelectedHorse}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={() => setStep("track")} style={{
              background: "linear-gradient(to right, #c03dff, #5f3dff)",
              border: "none", color: "white", padding: "12px 28px",
              borderRadius: 10, fontWeight: 900, fontSize: 14, cursor: "pointer",
            }}>
              Next: Choose Track →
            </button>
          </div>
        </div>
      )}

      {/* Step: Track selection */}
      {step === "track" && (
        <div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>
            Choose your race track. Different tracks offer different challenges and rewards.
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {TRACKS.map(t => (
              <TrackCard
                key={t.id}
                track={t}
                selected={selectedTrack === t.id}
                onSelect={setSelectedTrack}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <button onClick={() => setStep("horse")} style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
              color: "white", padding: "12px 24px", borderRadius: 10,
              fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>
              ← Back
            </button>
            <button onClick={() => setStep("confirm")} style={{
              background: "linear-gradient(to right, #c03dff, #5f3dff)",
              border: "none", color: "white", padding: "12px 28px",
              borderRadius: 10, fontWeight: 900, fontSize: 14, cursor: "pointer",
            }}>
              Next: Confirm →
            </button>
          </div>
        </div>
      )}

      {/* Step: Confirm & start */}
      {step === "confirm" && (
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(95,61,255,0.3)",
            borderRadius: 16, padding: "24px 28px", marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 1, marginBottom: 16 }}>
              RACE SUMMARY
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Horse</span>
              <span style={{ fontWeight: 700 }}>{horse.emoji} {horse.name} ({horse.tier})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Track</span>
              <span style={{ fontWeight: 700 }}>{track.emoji} {track.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Reward multiplier</span>
              <span style={{ fontWeight: 700, color: "#ffd700" }}>{track.rewardMultiplier}</span>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "16px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Entry fee</span>
              {unlimitedGameplay ? (
                <span style={{ fontWeight: 900, color: "#00cc44" }}>
                  UNLIMITED TEST MODE
                </span>
              ) : isFree ? (
                <span style={{ fontWeight: 900, color: "#00cc44" }}>
                  FREE 🎉 ({freeTrialLeft} trial race{freeTrialLeft !== 1 ? "s" : ""} left)
                </span>
              ) : (
                <span style={{ fontWeight: 900, color: "#ff6b6b" }}>-{ENTRY_FEE} MRT</span>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Your balance</span>
              <span style={{ fontWeight: 700 }}>{mrtBalance?.toFixed(2)} MRT</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>After entry</span>
              <span style={{ fontWeight: 700, color: canAffordEntry ? "#00cc44" : "#ff3300" }}>
                {mrtBalance !== null ? (isFree ? mrtBalance : mrtBalance - ENTRY_FEE).toFixed(2) : "—"} MRT
              </span>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "16px 0" }} />

            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.6 }}>
              Potential rewards: 🥇 {Math.round(50 * 1)} MRT · 🥈 {Math.round(30 * 1)} MRT · 🥉 {Math.round(15 * 1)} MRT · 4th {Math.round(5 * 1)} MRT
            </div>
          </div>

          {!canAffordEntry ? (
            <div style={{
              background: "rgba(255,59,59,0.15)", border: "1px solid rgba(255,59,59,0.4)",
              borderRadius: 10, padding: "12px 16px", textAlign: "center",
              fontSize: 13, color: "#ff6b6b", marginBottom: 16,
            }}>
              ⚠️ Insufficient MRT balance. You need {ENTRY_FEE} MRT to enter.
              {!hasClaimed && " Claim your welcome bonus first!"}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setStep("track")} style={{
              flex: 1, background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white", padding: "14px", borderRadius: 10,
              fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>
              ← Back
            </button>
            <button
              onClick={handleStartRace}
              disabled={!canAffordEntry || !isReady}
              style={{
                flex: 2,
                background: canAffordEntry && isReady
                  ? "linear-gradient(to right, #c03dff, #5f3dff)"
                  : "rgba(255,255,255,0.1)",
                border: "none", color: "white", padding: "14px",
                borderRadius: 10, fontWeight: 900, fontSize: 15,
                cursor: canAffordEntry && isReady ? "pointer" : "not-allowed",
                opacity: canAffordEntry && isReady ? 1 : 0.5,
              }}
            >
              {!isReady
                ? "Loading..."
                : unlimitedGameplay
                  ? "Test Race: No Limit"
                  : isFree
                  ? `🎉 Free Race! (${freeTrialLeft} left)`
                  : `🏇 Pay ${ENTRY_FEE} MRT & Start Race`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { ENTRY_FEE, WELCOME_MRT, FREE_TRIAL };
