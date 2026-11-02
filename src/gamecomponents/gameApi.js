const BASE        = process.env.REACT_APP_API_URL    || "http://localhost:4000/api/v1";
const GAME_SECRET = process.env.REACT_APP_GAME_SECRET || "change-this-in-production";
const SKIP_VERIFY = process.env.REACT_APP_SKIP_VERIFY === "true";

// ── HMAC-SHA256 token generation ──────────────────────────────────
// Falls back to a dummy token in dev/HTTP environments where crypto.subtle
// is unavailable (HTTP context blocks Web Crypto API in some browsers)
async function generateToken(walletAddress, action) {
  const ts = Date.now();

  // crypto.subtle requires HTTPS — fall back gracefully on HTTP
  if (SKIP_VERIFY || typeof crypto === "undefined" || !crypto.subtle) {
    return { token: "dev-bypass", ts };
  }

  try {
    const payload = `${walletAddress.toLowerCase()}:${action}:${ts}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(GAME_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig   = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const token = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    return { token, ts };
  } catch {
    // Fallback if crypto.subtle fails for any reason
    return { token: "dev-bypass", ts };
  }
}

// ── Authenticated POST ────────────────────────────────────────────
async function authPost(url, body, action) {
  const { token, ts } = await generateToken(body.walletAddress, action);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "X-Game-Token":  token,
      "X-Game-Ts":     String(ts),
    },
    body: JSON.stringify({ ...body, action }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Unauthenticated GET ───────────────────────────────────────────
async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ── Public API ────────────────────────────────────────────────────

export const saveGameSession = async ({ walletAddress, score, placement, mrtMultiplier, stakedNftCount }) => {
  if (!walletAddress || walletAddress.length !== 42) {
    console.error("[gameApi] Invalid walletAddress:", walletAddress);
    return { success: false, error: "Invalid wallet address" };
  }
  return authPost(`${BASE}/game/session`, {
    walletAddress, score, placement, mrtMultiplier, stakedNftCount,
  }, "session");
};

export const markSessionClaimed = async (sessionId, walletAddress) => {
  return authPost(`${BASE}/game/session/${sessionId}/claimed`, { walletAddress }, "claim");
};

export const claimWelcomeBonus = async (walletAddress) => {
  return authPost(`${BASE}/game/welcome`, { walletAddress }, "welcome");
};

export const recordEntry = async (walletAddress, entryFee, txHash, horseId, trackId) => {
  return authPost(`${BASE}/game/entry`, {
    walletAddress, entryFee, txHash, horseId, trackId,
  }, "entry");
};

export const fetchLeaderboard = async (limit = 10) => {
  return apiFetch(`${BASE}/game/leaderboard?limit=${limit}`);
};

export const fetchPlayerStats = async (wallet) => {
  return apiFetch(`${BASE}/game/stats/${wallet}`);
};
