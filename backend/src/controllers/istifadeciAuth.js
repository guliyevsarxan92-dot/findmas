const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

function tokenYarat(user) {
  return jwt.sign(
    { id: user.id, nov: 'istifadeci', telefon: user.telefon },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/istifadeci/qeydiyyat
async function qeydiyyat(req, res) {
  try {
    const { ad, soyad, telefon, email, sifre } = req.body;

    const var_olan = await User.findOne({ where: { telefon } });
    if (var_olan) return res.status(400).json({ xeta: 'Bu telefon artıq qeydiyyatdadır' });

    const sifre_hash = await bcrypt.hash(sifre, 12);
    const user = await User.create({ ad, soyad, telefon, email, sifre_hash });

    res.status(201).json({ token: tokenYarat(user), istifadeci: { id: user.id, ad, soyad, telefon, email } });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/istifadeci/giris
async function giris(req, res) {
  try {
    const { telefon, sifre } = req.body;

    const user = await User.findOne({ where: { telefon } });
    if (!user) return res.status(400).json({ xeta: 'Telefon və ya şifrə yanlışdır' });

    const dogru = await bcrypt.compare(sifre, user.sifre_hash);
    if (!dogru) return res.status(400).json({ xeta: 'Telefon və ya şifrə yanlışdır' });

    if (!user.aktiv) return res.status(403).json({ xeta: 'Hesabınız bloklanıb' });

    res.json({ token: tokenYarat(user), istifadeci: { id: user.id, ad: user.ad, soyad: user.soyad, telefon, foto: user.foto } });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// PUT /api/istifadeci/fcm-token
async function fcmTokenYenile(req, res) {
  try {
    const { fcm_token } = req.body;
    await User.update({ fcm_token }, { where: { id: req.istifadeci.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// GET /api/istifadeci/profil
async function profil(req, res) {
  try {
    const user = await User.findByPk(req.istifadeci.id, {
      attributes: { exclude: ['sifre_hash', 'fcm_token'] },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

module.exports = { qeydiyyat, giris, fcmTokenYenile, profil };
