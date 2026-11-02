const supabase = require('../config/supabase');
const asyncErrorHandler = require('../middlewares/helpers/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cloudinary = require('cloudinary');

// ── Helpers ──────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const options = {
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
  };
  // strip password before sending
  const { password, ...safeUser } = user;
  res.status(statusCode).cookie('token', token, options).json({ success: true, user: safeUser, token });
};

// ── Register ─────────────────────────────────────────────────────
exports.registerUser = asyncErrorHandler(async (req, res, next) => {
  const { name, email, gender, password, avatar } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  let avatar_public_id = null, avatar_url = null;
  if (avatar) {
    const myCloud = await cloudinary.v2.uploader.upload(avatar, { folder: 'avatars', width: 150, crop: 'scale' });
    avatar_public_id = myCloud.public_id;
    avatar_url = myCloud.secure_url;
  }

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, gender, password: hashed, avatar_public_id, avatar_url }])
    .select()
    .single();

  if (error) return next(new ErrorHandler(error.message, 400));
  sendToken(data, 201, res);
});

// ── Login ────────────────────────────────────────────────────────
exports.loginUser = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new ErrorHandler('Please enter email and password', 400));

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) return next(new ErrorHandler('Invalid email or password', 401));

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return next(new ErrorHandler('Invalid email or password', 401));

  sendToken(user, 200, res);
});

// ── Logout ───────────────────────────────────────────────────────
exports.logoutUser = asyncErrorHandler(async (req, res, next) => {
  res.cookie('token', null, { expires: new Date(Date.now()), httpOnly: true });
  res.status(200).json({ success: true, message: 'Logged out' });
});

// ── Get own profile ──────────────────────────────────────────────
exports.getUserDetails = asyncErrorHandler(async (req, res, next) => {
  const { data: user, error } = await supabase
    .from('users').select('id,name,email,gender,avatar_public_id,avatar_url,role,created_at')
    .eq('id', req.user.id).single();
  if (error) return next(new ErrorHandler('User not found', 404));
  res.status(200).json({ success: true, user });
});

// ── Forgot password ──────────────────────────────────────────────
exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const { data: user, error } = await supabase
    .from('users').select('id,email').eq('email', req.body.email).single();
  if (error || !user) return next(new ErrorHandler('User not found', 404));

  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await supabase.from('users').update({ reset_password_token: resetPasswordToken, reset_password_expire: resetPasswordExpire })
    .eq('id', user.id);

  const resetPasswordUrl = `https://${req.get('host')}/password/reset/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      templateId: process.env.SENDGRID_RESET_TEMPLATEID,
      data: { reset_url: resetPasswordUrl },
    });
    res.status(200).json({ success: true, message: `Email sent to ${user.email}` });
  } catch (err) {
    await supabase.from('users').update({ reset_password_token: null, reset_password_expire: null }).eq('id', user.id);
    return next(new ErrorHandler(err.message, 500));
  }
});

// ── Reset password ───────────────────────────────────────────────
exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const { data: user, error } = await supabase
    .from('users').select('*')
    .eq('reset_password_token', resetPasswordToken)
    .gt('reset_password_expire', new Date().toISOString())
    .single();

  if (error || !user) return next(new ErrorHandler('Invalid or expired reset token', 404));

  const hashed = await bcrypt.hash(req.body.password, 10);
  await supabase.from('users')
    .update({ password: hashed, reset_password_token: null, reset_password_expire: null })
    .eq('id', user.id);

  sendToken({ ...user, password: hashed }, 200, res);
});

// ── Update password ──────────────────────────────────────────────
exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
  const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();

  const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
  if (!isMatch) return next(new ErrorHandler('Old password is incorrect', 400));

  const hashed = await bcrypt.hash(req.body.newPassword, 10);
  await supabase.from('users').update({ password: hashed }).eq('id', user.id);

  sendToken({ ...user, password: hashed }, 200, res);
});

// ── Update profile ───────────────────────────────────────────────
exports.updateProfile = asyncErrorHandler(async (req, res, next) => {
  const updates = { name: req.body.name, email: req.body.email };

  if (req.body.avatar) {
    const { data: user } = await supabase.from('users').select('avatar_public_id').eq('id', req.user.id).single();
    if (user?.avatar_public_id) await cloudinary.v2.uploader.destroy(user.avatar_public_id);

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, { folder: 'avatars', width: 150, crop: 'scale' });
    updates.avatar_public_id = myCloud.public_id;
    updates.avatar_url = myCloud.secure_url;
  }

  await supabase.from('users').update(updates).eq('id', req.user.id);
  res.status(200).json({ success: true });
});

// ── ADMIN: get all users ─────────────────────────────────────────
exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
  const { data: users, error } = await supabase
    .from('users').select('id,name,email,gender,role,avatar_url,created_at');
  if (error) return next(new ErrorHandler(error.message, 500));
  res.status(200).json({ success: true, users });
});

// ── ADMIN: get single user ───────────────────────────────────────
exports.getSingleUser = asyncErrorHandler(async (req, res, next) => {
  const { data: user, error } = await supabase
    .from('users').select('id,name,email,gender,role,avatar_url,created_at')
    .eq('id', req.params.id).single();
  if (error || !user) return next(new ErrorHandler(`User not found: ${req.params.id}`, 404));
  res.status(200).json({ success: true, user });
});

// ── ADMIN: update user role ──────────────────────────────────────
exports.updateUserRole = asyncErrorHandler(async (req, res, next) => {
  const { name, email, gender, role } = req.body;
  const { error } = await supabase.from('users').update({ name, email, gender, role }).eq('id', req.params.id);
  if (error) return next(new ErrorHandler(error.message, 400));
  res.status(200).json({ success: true });
});

// ── ADMIN: delete user ───────────────────────────────────────────
exports.deleteUser = asyncErrorHandler(async (req, res, next) => {
  const { data: user } = await supabase.from('users').select('id').eq('id', req.params.id).single();
  if (!user) return next(new ErrorHandler(`User not found: ${req.params.id}`, 404));
  await supabase.from('users').delete().eq('id', req.params.id);
  res.status(200).json({ success: true });
});
