const supabase = require('../config/supabase');
const asyncErrorHandler = require('../middlewares/helpers/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
const { distributeRaceReward, getPoolBalance, sendFixedReward } = require('../utils/rewardDistributor');

// Internal achievement check — avoids circular import with profileController
async function checkAchievementsAfterRace(wallet) {
  try {
    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('placement, mrt_rewarded')
      .eq('wallet_address', wallet);

    if (!sessions) return;

    const totalGames     = sessions.length;
    const wins           = sessions.filter(s => s.placement === 1).length;
    const totalMrtEarned = sessions.reduce((sum, s) => sum + (s.mrt_rewarded || 0), 0);

    const { data: existing } = await supabase
      .from('achievements').select('achievement_id').eq('wallet_address', wallet);
    const earned = new Set((existing || []).map(a => a.achievement_id));

    const toAward = [];
    if (totalGames >= 1  && !earned.has('first_race'))  toAward.push('first_race');
    if (wins >= 1        && !earned.has('first_win'))   toAward.push('first_win');
    if (totalGames >= 10 && !earned.has('races_10'))    toAward.push('races_10');
    if (totalGames >= 50 && !earned.has('races_50'))    toAward.push('races_50');
    if (wins >= 5        && !earned.has('wins_5'))      toAward.push('wins_5');
    if (totalMrtEarned >= 100  && !earned.has('mrt_100'))  toAward.push('mrt_100');
    if (totalMrtEarned >= 1000 && !earned.has('mrt_1000')) toAward.push('mrt_1000');

    if (toAward.length > 0) {
      const { error: insertError } = await supabase.from('achievements').upsert(
        toAward.map(id => ({ wallet_address: wallet, achievement_id: id })),
        { onConflict: 'wallet_address,achievement_id', ignoreDuplicates: true }
      );
      if (insertError) {
        console.error('[Achievements] Insert error:', insertError.message);
      } else {
        console.log(`[Achievements] Awarded to ${wallet}:`, toAward);
      }
    } else {
      console.log(`[Achievements] No new achievements for ${wallet} (games:${totalGames} wins:${wins} mrt:${totalMrtEarned.toFixed(1)})`);
    }
  } catch (err) {
    console.error('[Achievements] Error:', err.message);
  }
}

const MAX_DAILY_SESSIONS = 10;
const FREE_TRIAL_RACES   = 5;   // first N races are free (no entry fee required)
const UNLIMITED_GAMEPLAY = process.env.UNLIMITED_GAMEPLAY === 'true' ||
  process.env.REACT_APP_UNLIMITED_GAMEPLAY === 'true' ||
  process.env.NEXT_PUBLIC_UNLIMITED_GAMEPLAY === 'true';

// ── POST /api/v1/game/session ─────────────────────────────────────
exports.saveSession = asyncErrorHandler(async (req, res, next) => {
  const { walletAddress, score, placement, mrtMultiplier, stakedNftCount } = req.body;

  if (!walletAddress || score === undefined) {
    return next(new ErrorHandler('walletAddress and score are required', 400));
  }

  const safeScore       = Math.max(0, Math.floor(Number(score)));
  const safePlacement   = [1, 2, 3, 4].includes(Number(placement)) ? Number(placement) : 4;
  // mrtMultiplier: 100/150/200/300 from MRTStaking.getRaceMultiplier on frontend
  const safeMultiplier  = [100, 150, 200, 300].includes(Number(mrtMultiplier))
    ? Number(mrtMultiplier) : 100;
  const finalScore      = Math.round(safeScore * (safeMultiplier / 100));

  console.log("[GameController] saveSession:", {
    walletAddress, score, placement, mrtMultiplier,
    safeScore, safePlacement, safeMultiplier,
  });

  // Daily play limit check
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: todayCount } = await supabase
    .from('game_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('wallet_address', walletAddress.toLowerCase())
    .gte('played_at', todayStart.toISOString());

  const playsLeft = Math.max(0, MAX_DAILY_SESSIONS - (todayCount || 0));

  // ── Check daily MRT earned today ──────────────────────────────
  const { data: todaySessions } = await supabase
    .from('game_sessions')
    .select('mrt_rewarded')
    .eq('wallet_address', walletAddress.toLowerCase())
    .gte('played_at', todayStart.toISOString());

  const dailyMrtEarned = (todaySessions || []).reduce((sum, s) => sum + (s.mrt_rewarded || 0), 0);
  const DAILY_MRT_CAP  = 500;
  const dailyCapHit    = !UNLIMITED_GAMEPLAY && dailyMrtEarned >= DAILY_MRT_CAP;

  // ── Distribute MRT reward on-chain ───────────────────────────
  let mrtRewarded = 0;
  let txHash = null;
  let rewardError = null;
  let dailyLimitMessage = null;

  if (UNLIMITED_GAMEPLAY) {
    rewardError = "unlimited_test_mode";
  } else if (dailyCapHit) {
    rewardError = "daily_cap_reached";
    dailyLimitMessage = "You've reached today's 500 MRT earning limit! Come back tomorrow, or upgrade your experience: purchase a premium track or a better horse NFT to unlock higher daily limits.";
  } else if (playsLeft > 0) {
    const result = await distributeRaceReward(
      walletAddress,
      safePlacement,
      safeMultiplier
    );
    if (result.txHash) {
      mrtRewarded = parseFloat(result.reward);
      txHash = result.txHash;
    } else if (result.error === "Player daily cap reached") {
      rewardError = "daily_cap_reached";
      dailyLimitMessage = "You've reached today's 500 MRT earning limit! Come back tomorrow, or upgrade your experience: purchase a premium track or a better horse NFT to unlock higher daily limits.";
    } else {
      rewardError = result.error;
    }
  }

  // ── Save session to Supabase ──────────────────────────────────
  const { data: session, error } = await supabase
    .from('game_sessions')
    .insert([{
      wallet_address:   walletAddress.toLowerCase(),
      score:            safeScore,
      placement:        safePlacement,
      multiplier:       safeMultiplier / 100,   // store as 1.0/1.5/2.0/3.0
      staked_nft_count: Math.max(0, Math.floor(Number(stakedNftCount) || 0)),
      final_score:      finalScore,
      mrt_rewarded:     mrtRewarded,
      reward_tx_hash:   txHash,
      medals_claimed:   false,
    }])
    .select()
    .single();

  if (error) return next(new ErrorHandler(error.message, 500));

  // ── Check and award achievements (non-blocking) ───────────────
  const allSessions = await supabase
    .from('game_sessions')
    .select('placement, mrt_rewarded')
    .eq('wallet_address', walletAddress.toLowerCase());

  const allData = allSessions.data || [];
  const achievementStats = {
    totalGames:    allData.length,
    wins:          allData.filter(s => s.placement === 1).length,
    totalMrtEarned: allData.reduce((sum, s) => sum + (s.mrt_rewarded || 0), 0),
  };
  checkAchievementsAfterRace(walletAddress.toLowerCase()).catch(() => {});

  // ── Free trial count ──────────────────────────────────────────
  const totalRaces = allData.length;
  const isFreeTrialRace = UNLIMITED_GAMEPLAY || totalRaces <= FREE_TRIAL_RACES;

  res.status(201).json({
    success: true,
    session,
    mrtRewarded,
    txHash,
    rewardError,
    dailyLimitMessage,
    dailyMrtEarned:  parseFloat(dailyMrtEarned.toFixed(2)),
    dailyMrtCap:     DAILY_MRT_CAP,
    dailyCapHit,
    playsLeft:      UNLIMITED_GAMEPLAY ? Number.MAX_SAFE_INTEGER : Math.max(0, playsLeft - 1),
    isFreeTrialRace,
    freeTrialLeft:  UNLIMITED_GAMEPLAY ? Number.MAX_SAFE_INTEGER : Math.max(0, FREE_TRIAL_RACES - totalRaces),
    unlimitedGameplay: UNLIMITED_GAMEPLAY,
  });
});

// ── PATCH /api/v1/game/session/:id/claimed ────────────────────────
exports.markClaimed = asyncErrorHandler(async (req, res, next) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return next(new ErrorHandler('walletAddress required', 400));

  const { error } = await supabase
    .from('game_sessions')
    .update({ medals_claimed: true })
    .eq('id', req.params.id)
    .eq('wallet_address', walletAddress.toLowerCase());

  if (error) return next(new ErrorHandler(error.message, 500));
  res.status(200).json({ success: true });
});

// ── GET /api/v1/game/leaderboard ──────────────────────────────────
exports.getLeaderboard = asyncErrorHandler(async (req, res, next) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const { data, error } = await supabase
    .from('game_leaderboard')
    .select('wallet_address, display_name, best_score, total_games, total_mrt_earned, wins, last_played, rank')
    .order('best_score', { ascending: false })
    .limit(limit);

  if (error) return next(new ErrorHandler(error.message, 500));
  res.status(200).json({ success: true, leaderboard: data });
});

// ── GET /api/v1/game/stats/:wallet ────────────────────────────────
exports.getPlayerStats = asyncErrorHandler(async (req, res, next) => {
  const wallet = req.params.wallet.toLowerCase();

  const { data: lb } = await supabase
    .from('game_leaderboard')
    .select('best_score, total_games, rank')
    .eq('wallet_address', wallet)
    .maybeSingle();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: todayCount } = await supabase
    .from('game_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('wallet_address', wallet)
    .gte('played_at', todayStart.toISOString());

  // Total MRT earned all-time
  const { data: totals } = await supabase
    .from('game_sessions')
    .select('mrt_rewarded')
    .eq('wallet_address', wallet);

  const totalMrtEarned = (totals || []).reduce((sum, s) => sum + (s.mrt_rewarded || 0), 0);

  // MRT earned today
  const { data: todayTotals } = await supabase
    .from('game_sessions')
    .select('mrt_rewarded')
    .eq('wallet_address', wallet)
    .gte('played_at', todayStart.toISOString());

  const dailyMrtEarned = (todayTotals || []).reduce((sum, s) => sum + (s.mrt_rewarded || 0), 0);

  const { data: recent } = await supabase
    .from('game_sessions')
    .select('score, final_score, placement, multiplier, mrt_rewarded, reward_tx_hash, played_at')
    .eq('wallet_address', wallet)
    .order('played_at', { ascending: false })
    .limit(5);

  res.status(200).json({
    success: true,
    stats: {
      bestScore:      lb?.best_score  ?? 0,
      totalGames:     lb?.total_games ?? 0,
      rank:           lb?.rank        ?? null,
      playsToday:     todayCount      ?? 0,
      playsLeft:      UNLIMITED_GAMEPLAY ? Number.MAX_SAFE_INTEGER : Math.max(0, MAX_DAILY_SESSIONS - (todayCount || 0)),
      maxDaily:       UNLIMITED_GAMEPLAY ? Number.MAX_SAFE_INTEGER : MAX_DAILY_SESSIONS,
      totalMrtEarned: parseFloat(totalMrtEarned.toFixed(4)),
      dailyMrtEarned: parseFloat(dailyMrtEarned.toFixed(2)),
      dailyMrtCap:    500,
      dailyCapHit:    !UNLIMITED_GAMEPLAY && dailyMrtEarned >= 500,
      unlimitedGameplay: UNLIMITED_GAMEPLAY,
      recentSessions: recent ?? [],
    },
  });
});

// ── GET /api/v1/game/trial/:wallet ────────────────────────────────
// Returns how many free trial races remain for a wallet
exports.getTrialStatus = asyncErrorHandler(async (req, res, next) => {
  const wallet = req.params.wallet.toLowerCase();
  const { count } = await supabase
    .from('game_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('wallet_address', wallet);
  const totalRaces  = count || 0;
  const freeLeft    = UNLIMITED_GAMEPLAY ? Number.MAX_SAFE_INTEGER : Math.max(0, FREE_TRIAL_RACES - totalRaces);
  res.status(200).json({
    success: true,
    freeLeft,
    totalRaces,
    FREE_TRIAL_RACES: UNLIMITED_GAMEPLAY ? Number.MAX_SAFE_INTEGER : FREE_TRIAL_RACES,
    unlimitedGameplay: UNLIMITED_GAMEPLAY,
  });
});
// In-memory lock — prevents concurrent claims for the same wallet
const claimInProgress = new Set();

exports.getWelcomeStatus = asyncErrorHandler(async (req, res, next) => {
  const wallet = req.params.wallet.toLowerCase();
  const { data: claimed } = await supabase
    .from("welcome_claims")
    .select("id, tx_hash")
    .eq("wallet_address", wallet)
    .maybeSingle();
  // Only a real tx hash (not null or "pending") counts as successfully claimed
  const isClaimed = !!(claimed && claimed.tx_hash && claimed.tx_hash !== "pending");
  res.status(200).json({ success: true, claimed: isClaimed });
});

// ── POST /api/v1/game/welcome ─────────────────────────────────────
// One-time 100 MRT welcome bonus
exports.claimWelcome = asyncErrorHandler(async (req, res, next) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return next(new ErrorHandler("walletAddress required", 400));

  const wallet = walletAddress.toLowerCase();

  // Block concurrent requests for the same wallet
  if (claimInProgress.has(wallet)) {
    return res.status(200).json({ success: false, error: "Claim already in progress" });
  }
  claimInProgress.add(wallet);

  try {
    // Check if already claimed with a real tx (null or "pending" = not complete)
    const { data: existing } = await supabase
      .from("welcome_claims")
      .select("id, tx_hash")
      .eq("wallet_address", wallet)
      .maybeSingle();

    if (existing && existing.tx_hash && existing.tx_hash !== "pending") {
      return res.status(200).json({ success: false, error: "Welcome bonus already claimed" });
    }

    // Insert or update pending row
    if (existing) {
      await supabase.from("welcome_claims")
        .update({ tx_hash: "pending" })
        .eq("wallet_address", wallet);
    } else {
      const { error: insertError } = await supabase
        .from("welcome_claims")
        .insert([{ wallet_address: wallet, tx_hash: "pending" }]);
      if (insertError) {
        return res.status(200).json({ success: false, error: "Welcome bonus already claimed" });
      }
    }

    // Send exactly 100 MRT from reward wallet to player
    const result = await sendFixedReward(walletAddress, 100);

    if (result.error) {
      // Payment failed — keep row as "pending" so user can retry
      return res.status(200).json({ success: false, error: result.error });
    }

    // Finalize with real tx hash — this permanently locks the claim
    await supabase.from("welcome_claims")
      .update({ tx_hash: result.txHash })
      .eq("wallet_address", wallet);

    res.status(200).json({ success: true, txHash: result.txHash, amount: 100 });

  } finally {
    claimInProgress.delete(wallet);
  }
});

// ── POST /api/v1/game/entry ───────────────────────────────────────
// Deduct entry fee — for now just record it, actual on-chain deduction is future work
exports.payEntry = asyncErrorHandler(async (req, res, next) => {
  const { walletAddress, entryFee } = req.body;
  if (!walletAddress) return next(new ErrorHandler("walletAddress required", 400));
  // TODO: implement on-chain entry fee deduction via smart contract
  // For now: just acknowledge — the reward pool already nets out
  res.status(200).json({ success: true, entryFee });
});

// ── GET /api/v1/game/pool ─────────────────────────────────────────
exports.getPoolInfo = asyncErrorHandler(async (req, res, next) => {
  const balance = await getPoolBalance();
  res.status(200).json({ success: true, poolBalance: balance });
});

// ── POST /api/v1/game/test-reward ─────────────────────────────────
// Test endpoint: manually trigger a reward to any wallet
// Usage: POST { "wallet": "0x...", "placement": 1 }
exports.testReward = asyncErrorHandler(async (req, res, next) => {
  const { wallet, placement } = req.body;
  if (!wallet) return next(new ErrorHandler('wallet required', 400));

  const poolBalance = await getPoolBalance();
  console.log("[TestReward] Pool balance:", poolBalance, "MRT");
  console.log("[TestReward] Sending to:", wallet, "placement:", placement || 1);

  const result = await distributeRaceReward(wallet, Number(placement) || 1, 100);
  console.log("[TestReward] Result:", result);

  res.status(200).json({ success: true, poolBalance, result });
});
