const supabase = require('../config/supabase');
const asyncErrorHandler = require('../middlewares/helpers/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_race',   label: 'First Race',    emoji: '🏁', desc: 'Complete your first race' },
  { id: 'first_win',    label: 'First Victory',  emoji: '🥇', desc: 'Win your first race' },
  { id: 'races_10',     label: 'Veteran',        emoji: '🎖️', desc: 'Complete 10 races' },
  { id: 'races_50',     label: 'Champion',       emoji: '🏆', desc: 'Complete 50 races' },
  { id: 'wins_5',       label: 'Winning Streak', emoji: '⚡', desc: 'Win 5 races' },
  { id: 'mrt_100',      label: 'Earner',         emoji: '💰', desc: 'Earn 100 MRT total' },
  { id: 'mrt_1000',     label: 'Whale',          emoji: '🐋', desc: 'Earn 1000 MRT total' },
  { id: 'welcome',      label: 'Welcome!',       emoji: '🎁', desc: 'Claim welcome bonus' },
];

const UNLIMITED_GAMEPLAY = process.env.UNLIMITED_GAMEPLAY === 'true' ||
  process.env.REACT_APP_UNLIMITED_GAMEPLAY === 'true' ||
  process.env.NEXT_PUBLIC_UNLIMITED_GAMEPLAY === 'true';

// ── Check and award achievements ──────────────────────────────────
async function checkAchievements(wallet, stats) {
  const toAward = [];
  const { data: existing } = await supabase
    .from('achievements').select('achievement_id').eq('wallet_address', wallet);
  const earned = new Set((existing || []).map(a => a.achievement_id));

  if (stats.totalGames >= 1  && !earned.has('first_race'))  toAward.push('first_race');
  if (stats.wins >= 1        && !earned.has('first_win'))   toAward.push('first_win');
  if (stats.totalGames >= 10 && !earned.has('races_10'))    toAward.push('races_10');
  if (stats.totalGames >= 50 && !earned.has('races_50'))    toAward.push('races_50');
  if (stats.wins >= 5        && !earned.has('wins_5'))      toAward.push('wins_5');
  if (stats.totalMrtEarned >= 100  && !earned.has('mrt_100'))  toAward.push('mrt_100');
  if (stats.totalMrtEarned >= 1000 && !earned.has('mrt_1000')) toAward.push('mrt_1000');

  if (toAward.length > 0) {
    await supabase.from('achievements').insert(
      toAward.map(id => ({ wallet_address: wallet, achievement_id: id }))
    );
  }
  return toAward;
}

// ── Internal: check achievements (called from gameController) ─────
async function checkAchievementsInternal(wallet, stats) {
  return checkAchievements(wallet, stats);
}
exports.checkAchievementsInternal = checkAchievementsInternal;
exports.getProfile = asyncErrorHandler(async (req, res, next) => {
  const wallet = req.params.wallet.toLowerCase();

  const [profileRes, statsRes, achievementsRes, horsesRes] = await Promise.all([
    supabase.from('player_profiles').select('*').eq('wallet_address', wallet).maybeSingle(),
    supabase.from('game_leaderboard').select('*').eq('wallet_address', wallet).maybeSingle(),
    supabase.from('achievements').select('achievement_id, earned_at').eq('wallet_address', wallet),
    supabase.from('player_horses').select('*').eq('wallet_address', wallet),
  ]);

  // Today's play count for "plays left today"
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from('game_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('wallet_address', wallet)
    .gte('played_at', todayStart.toISOString());

  const recentRes = await supabase
    .from('game_sessions')
    .select('score, final_score, placement, multiplier, mrt_rewarded, reward_tx_hash, played_at')
    .eq('wallet_address', wallet)
    .order('played_at', { ascending: false })
    .limit(10);

  const profile      = profileRes.data;
  const rawStats     = statsRes.data;
  // Merge leaderboard stats with today's play count
  const stats = rawStats ? {
    ...rawStats,
    playsLeft:  UNLIMITED_GAMEPLAY ? Number.MAX_SAFE_INTEGER : Math.max(0, 10 - (todayCount || 0)),
    playsToday: todayCount || 0,
    unlimitedGameplay: UNLIMITED_GAMEPLAY,
  } : null;
  const achievements = (achievementsRes.data || []).map(a => {
    const def = ACHIEVEMENTS.find(d => d.id === a.achievement_id);
    return { ...def, earned_at: a.earned_at };
  }).filter(Boolean);

  res.status(200).json({
    success: true,
    profile,
    stats: stats || null,
    achievements,
    horses: horsesRes.data || [],
    recentRaces: recentRes.data || [],
    allAchievements: ACHIEVEMENTS,
  });
});

// ── POST /api/v1/profile ──────────────────────────────────────────
// Create or update profile (set username)
exports.upsertProfile = asyncErrorHandler(async (req, res, next) => {
  const { walletAddress, username, bio } = req.body;
  if (!walletAddress || !username) return next(new ErrorHandler('walletAddress and username required', 400));

  const clean = username.trim().slice(0, 20);
  if (clean.length < 2) return next(new ErrorHandler('Username must be at least 2 characters', 400));
  if (!/^[a-zA-Z0-9_\- ]+$/.test(clean)) return next(new ErrorHandler('Username: letters, numbers, spaces, _ and - only', 400));

  // Check uniqueness (excluding own wallet)
  const { data: existing } = await supabase
    .from('player_profiles')
    .select('wallet_address')
    .ilike('username', clean)
    .neq('wallet_address', walletAddress.toLowerCase())
    .maybeSingle();

  if (existing) return next(new ErrorHandler('Username already taken', 409));

  const { data, error } = await supabase
    .from('player_profiles')
    .upsert([{
      wallet_address: walletAddress.toLowerCase(),
      username:       clean,
      avatar_seed:    walletAddress.toLowerCase(),
      bio:            (bio || '').slice(0, 160),
      updated_at:     new Date().toISOString(),
    }], { onConflict: 'wallet_address' })
    .select()
    .single();

  if (error) return next(new ErrorHandler(error.message, 400));

  // Award welcome achievement
  await supabase.from('achievements').upsert([{
    wallet_address: walletAddress.toLowerCase(),
    achievement_id: 'welcome',
  }], { onConflict: 'wallet_address,achievement_id' });

  res.status(200).json({ success: true, profile: data });
});

// ── GET /api/v1/profile/check-username/:username ──────────────────
exports.checkUsername = asyncErrorHandler(async (req, res, next) => {
  const { data } = await supabase
    .from('player_profiles')
    .select('wallet_address')
    .ilike('username', req.params.username)
    .maybeSingle();
  res.status(200).json({ available: !data });
});

// ── POST /api/v1/profile/achievements/check ───────────────────────
exports.checkAndAwardAchievements = asyncErrorHandler(async (req, res, next) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return next(new ErrorHandler('walletAddress required', 400));

  const wallet = walletAddress.toLowerCase();
  const { data: sessions } = await supabase
    .from('game_sessions').select('placement, mrt_rewarded').eq('wallet_address', wallet);

  const stats = {
    totalGames:    sessions?.length || 0,
    wins:          sessions?.filter(s => s.placement === 1).length || 0,
    totalMrtEarned: sessions?.reduce((s, r) => s + (r.mrt_rewarded || 0), 0) || 0,
  };

  const newAchievements = await checkAchievements(wallet, stats);
  res.status(200).json({ success: true, newAchievements });
});
