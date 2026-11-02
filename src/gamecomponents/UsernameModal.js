import React, { useState, useEffect } from "react";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:4000/api/v1";

// Use a dramatic horse image as modal background
const MODAL_BG = require("../images/Horse/fantastic-animal-constellation_23-2151708303.avif");

export const UsernameModal = ({ account, onComplete }) => {
  const [username, setUsername]   = useState("");
  const [checking, setChecking]   = useState(false);
  const [available, setAvailable] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  // Debounced availability check
  useEffect(() => {
    if (username.length < 2) { setAvailable(null); return; }
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const res  = await fetch(`${BASE}/profile/check-username/${encodeURIComponent(username)}`);
        const data = await res.json();
        setAvailable(data.available);
      } catch { setAvailable(null); }
      setChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSave = async () => {
    if (!username || username.length < 2 || !available) return;
    setSaving(true);
    setError("");
    try {
      const res  = await fetch(`${BASE}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: account, username }),
      });
      const data = await res.json();
      if (data.success) {
        onComplete(data.profile);
      } else {
        setError(data.message || "Failed to save username.");
      }
    } catch {
      setError("Could not connect to server.");
    }
    setSaving(false);
  };

  const statusColor = checking ? "#888" : available === true ? "#00cc44" : available === false ? "#ff3300" : "#888";
  const statusText  = checking ? "Checking..." : available === true ? "✓ Available" : available === false ? "✗ Taken" : "";

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: `linear-gradient(rgba(0,0,0,0.7), rgba(13,13,26,0.95))`,
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, fontFamily: "Arial, sans-serif",
    }}>
      <div style={{
        background: "#0d0d1a", border: "1px solid rgba(95,61,255,0.4)",
        borderRadius: 20, padding: "40px 44px", maxWidth: 420, width: "90%",
        boxShadow: "0 0 60px rgba(95,61,255,0.2)",
      }}>
        {/* Avatar preview */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${account}&size=80`}
            alt="avatar"
            style={{ borderRadius: "50%", border: "3px solid rgba(95,61,255,0.5)" }}
          />
        </div>

        <h2 style={{ color: "white", textAlign: "center", marginBottom: 8, fontSize: 22 }}>
          Welcome to MetaRace!
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", fontSize: 13, marginBottom: 28 }}>
          Choose your jockey name. This will appear on the leaderboard and in races.
        </p>

        {/* Input */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          <input
            value={username}
            onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_\- ]/g, ""))}
            maxLength={20}
            placeholder="Enter jockey name..."
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${available === true ? "#00cc44" : available === false ? "#ff3300" : "rgba(95,61,255,0.4)"}`,
              color: "white", fontSize: 16, outline: "none",
              boxSizing: "border-box",
            }}
            onKeyDown={e => e.key === "Enter" && handleSave()}
          />
        </div>

        {/* Status */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: statusColor }}>{statusText}</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{username.length}/20</span>
        </div>

        {error && (
          <div style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16, textAlign: "center" }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !available || username.length < 2}
          style={{
            width: "100%", padding: "14px",
            background: available && username.length >= 2
              ? "linear-gradient(to right, #c03dff, #5f3dff)"
              : "rgba(255,255,255,0.1)",
            border: "none", borderRadius: 10, color: "white",
            fontSize: 15, fontWeight: 900, cursor: available ? "pointer" : "not-allowed",
            opacity: saving ? 0.7 : 1, transition: "all 0.2s",
          }}
        >
          {saving ? "Saving..." : "Set Jockey Name & Enter"}
        </button>

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", marginTop: 14 }}>
          Letters, numbers, spaces, _ and - only. Can be changed later in Profile.
        </p>
      </div>
    </div>
  );
};
