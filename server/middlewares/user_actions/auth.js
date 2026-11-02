const jwt = require('jsonwebtoken');
const supabase = require('../../config/supabase');
const ErrorHandler = require('../../utils/errorHandler');
const asyncErrorHandler = require('../helpers/asyncErrorHandler');

exports.isAuthenticatedUser = asyncErrorHandler(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) return next(new ErrorHandler('Please login to access', 401));

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  const { data: user, error } = await supabase
    .from('users')
    .select('id,name,email,gender,role,avatar_url')
    .eq('id', decodedData.id)
    .single();

  if (error || !user) return next(new ErrorHandler('User not found', 401));

  req.user = user;
  next();
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorHandler(`Role: ${req.user.role} is not allowed`, 403));
    }
    next();
  };
};
