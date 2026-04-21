/**
 * RBAC middleware
 * Usage: router.get('/route', authenticate, authorize('gm', 'supervisor'), handler)
 *
 * Roles: agent | supervisor | finance | gm | sponsor
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT and attach req.user = { id, role, ... }
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'رمز المصادقة مطلوب' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'رمز المصادقة غير صالح أو منتهي الصلاحية' });
  }
};

/**
 * Allow only the listed roles to proceed.
 * @param  {...string} roles - Allowed role names
 */
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'غير مصادَق' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'ليس لديك صلاحية للوصول إلى هذا المورد' });
    }
    next();
  };

module.exports = { authenticate, authorize };
