const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح — يرجى تسجيل الدخول أولاً',
      });
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'ممنوع — ليس لديك صلاحية للوصول إلى هذا المورد',
        requiredRoles: allowedRoles,
        yourRole: role,
      });
    }

    next();
  };
};

module.exports = authorize;