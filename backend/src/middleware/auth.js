const jwt = require('jsonwebtoken');
const { User, Usta } = require('../models');

// İstifadəçi token yoxlaması
async function istifadeciAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ xeta: 'Token yoxdur' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.nov !== 'istifadeci') {
      return res.status(403).json({ xeta: 'İcazə yoxdur' });
    }

    if (decoded.sessiya) {
      const user = await User.findByPk(decoded.id, { attributes: ['id', 'aktiv_sessiya'] });
      if (!user || user.aktiv_sessiya !== decoded.sessiya) {
        return res.status(401).json({ xeta: 'Başqa cihazdan daxil olunub. Yenidən daxil olun.', sessiya_bitdi: true });
      }
    }

    req.istifadeci = decoded;
    next();
  } catch {
    res.status(401).json({ xeta: 'Token etibarsızdır' });
  }
}

// Usta token yoxlaması
async function ustaAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ xeta: 'Token yoxdur' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.nov !== 'usta') {
      return res.status(403).json({ xeta: 'İcazə yoxdur' });
    }

    if (decoded.sessiya) {
      const usta = await Usta.findByPk(decoded.id, { attributes: ['id', 'aktiv_sessiya'] });
      if (!usta || usta.aktiv_sessiya !== decoded.sessiya) {
        return res.status(401).json({ xeta: 'Başqa cihazdan daxil olunub. Yenidən daxil olun.', sessiya_bitdi: true });
      }
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
