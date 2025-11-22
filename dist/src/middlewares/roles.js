import createError from 'http-errors';

export const allowRoles = (...roles) => (req, _res, next) => {
  if (!req.user) return next(createError(401, 'Not authenticated'));
  if (!roles.includes(req.user.role)) return next(createError(403, 'Forbidden'));
  next();
};
