const jwt = require('jsonwebtoken');

// İstifadəçi token yoxlaması
function istifadeciAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ xeta: 'Token yoxdur' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.nov !== 'istifadeci') {
      return res.status(403).json({ xeta: 'İcazə yoxdur' });
    }
    req.istifadeci = decoded;
    next();
  } catch {
    res.status(401).json({ xeta: 'Token etibarsızdır' });
  }
}

// Usta token yoxlaması
function ustaAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ xeta: 'Token yoxdur' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.nov !== 'usta') {
      return res.status(403).json({ xeta: 'İcazə yoxdur' });
    }
    req.usta = decoded;
    next();
  } catch {
    res.status(401).json({ xeta: 'Token etibarsızdır' });
  }
}

// Admin token yoxlaması
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ xeta: 'Token yoxdur' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.nov !== 'admin') {
      return res.status(403).json({ xeta: 'Admin icazəsi yoxdur' });
    }
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ xeta: 'Token etibarsızdır' });
  }
}

module.exports = { istifadeciAuth, ustaAuth, adminAuth };
