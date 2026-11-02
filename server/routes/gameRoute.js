const express = require('express');
const {
  saveSession, markClaimed, getLeaderboard, getPlayerStats,
  getPoolInfo, testReward, claimWelcome, payEntry, getTrialStatus, getWelcomeStatus,
} = require('../controllers/gameController');
const {
  rewardLimiter, welcomeLimiter, generalLimiter,
  verifyGameToken, blockInProduction,
} = require('../middlewares/helpers/gameAuth');

const router = express.Router();

// Public reads
router.route('/game/leaderboard').get(generalLimiter, getLeaderboard);
router.route('/game/stats/:wallet').get(generalLimiter, getPlayerStats);
router.route('/game/pool').get(generalLimiter, getPoolInfo);
router.route('/game/trial/:wallet').get(generalLimiter, getTrialStatus);
router.route('/game/welcome/status/:wallet').get(generalLimiter, getWelcomeStatus);

// Authenticated writes
router.route('/game/session').post(rewardLimiter, verifyGameToken, saveSession);
router.route('/game/session/:id/claimed').patch(generalLimiter, verifyGameToken, markClaimed);
router.route('/game/welcome').post(welcomeLimiter, verifyGameToken, claimWelcome);
router.route('/game/entry').post(rewardLimiter, verifyGameToken, payEntry);

// Dev only
router.route('/game/test-reward').post(blockInProduction, testReward);

module.exports = router;
