/**
 * Game API Security — HMAC Token Verification
 *
 * No MetaMask popups. Invisible to users.
 *
 * How it works:
 *   Frontend: token = HMAC-SHA256(walletAddress + ":" + action + ":" + timestamp, GAME_SECRET)
 *   Frontend: sends token in X-Game-Token header + timestamp in X-Game-Ts header
 *   Server:   recomputes HMAC and compares — rejects if mismatch or expired
 *
 * An attacker without REACT_APP_GAME_SECRET cannot forge valid tokens.
 * Timestamp prevents replay attacks (5 minute window).
 */

const crypto    = require("crypto");
const rateLimit = require("express-rate-limit");

const GAME_SECRET = process.env.GAME_SECRET || "change-this-in-production";
const TOKEN_TTL   = 5 * 60 * 1000; // 5 minutes

// ── HMAC verification middleware ──────────────────────────────────
const verifyGameToken = (req, res, next) => {
  // Skip in development
  if (process.env.NODE_ENV === "development" && process.env.SKIP_SIG_VERIFY === "true") {
    return next();
  }

  const token    = req.headers["x-game-token"];
  const tsHeader = req.headers["x-game-ts"];

  // Also allow dev-bypass token in development
  if (token === "dev-bypass" && process.env.SKIP_SIG_VERIFY === "true") {
    return next();
  }
  const { walletAddress, action } = req.body;

  if (!token || !tsHeader || !walletAddress) {
    return res.status(401).json({ success: false, message: "Missing auth token." });
  }

  // Check timestamp freshness
  const ts  = parseInt(tsHeader);
  const now = Date.now();
  if (isNaN(ts) || Math.abs(now - ts) > TOKEN_TTL) {
    return res.status(401).json({ success: false, message: "Token expired. Refresh and try again." });
  }

  // Recompute expected HMAC
  const payload  = `${walletAddress.toLowerCase()}:${action || ""}:${ts}`;
  const expected = crypto
    .createHmac("sha256", GAME_SECRET)
    .update(payload)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  const tokenBuf    = Buffer.from(token,    "hex");
  const expectedBuf = Buffer.from(expected, "hex");

  if (tokenBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }

  next();
};

// ── Rate limiters ─────────────────────────────────────────────────
const rewardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many requests. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const welcomeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,  // 10 attempts per hour per IP — enough for legitimate use
  message: { success: false, message: "Too many claim attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: "Rate limit exceeded." },
});

// ── Block test endpoints in production ────────────────────────────
const blockInProduction = (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ success: false, message: "Not found." });
  }
  next();
};

module.exports = {
  verifyGameToken,
  rewardLimiter,
  welcomeLimiter,
  generalLimiter,
  blockInProduction,
};
