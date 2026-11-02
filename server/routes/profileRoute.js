const express = require('express');
const {
  getProfile,
  upsertProfile,
  checkUsername,
  checkAndAwardAchievements,
} = require('../controllers/profileController');

const router = express.Router();

router.route('/profile/:wallet').get(getProfile);
router.route('/profile').post(upsertProfile);
router.route('/profile/check-username/:username').get(checkUsername);
router.route('/profile/achievements/check').post(checkAndAwardAchievements);

module.exports = router;
