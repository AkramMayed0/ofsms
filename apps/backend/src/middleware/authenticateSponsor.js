const jwt = require('jsonwebtoken');

const authenticateSponsor = (req, res, next) => {
  let token = null;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.sponsor_token) {
    token = req.cookies.sponsor_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح — يرجى تسجيل الدخول إلى بوابة الكافل',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'sponsor') {
      return res.status(403).json({
        success: false,
        message: 'ممنوع — هذه البوابة مخصصة للكفلاء فقط',
      });
    }

    req.sponsor = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'رمز المصادقة غير صالح أو منتهي الصلاحية',
    });
  }
};

module.exports = authenticateSponsor;