const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usta } = require('../models');

function tokenYarat(usta) {
  return jwt.sign(
    { id: usta.id, nov: 'usta', telefon: usta.telefon },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/usta/qeydiyyat
async function qeydiyyat(req, res) {
  try {
    const { ad, soyad, telefon, email, sifre, kateqoriya } = req.body;

    if (!Usta.KATEQORIYALAR.includes(kateqoriya)) {
      return res.status(400).json({ xeta: 'Yanlış kateqoriya' });
    }

    const var_olan = await Usta.findOne({ where: { telefon } });
    if (var_olan) return res.status(400).json({ xeta: 'Bu telefon artıq qeydiyyatdadır' });

    const sifre_hash = await bcrypt.hash(sifre, 12);
    const usta = await Usta.create({ ad, soyad, telefon, email, sifre_hash, kateqoriya });

    res.status(201).json({
      mesaj: 'Qeydiyyat tamamlandı. Sənədlərinizi yükləyin, admin təsdiqini gözləyin.',
      token: tokenYarat(usta),
      usta: { id: usta.id, ad, soyad, telefon, kateqoriya, tesdiqlendi: false },
    });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/usta/giris
async function giris(req, res) {
  try {
    const { telefon, sifre } = req.body;

    const usta = await Usta.findOne({ where: { telefon } });
    if (!usta) return res.status(400).json({ xeta: 'Telefon və ya şifrə yanlışdır' });

    const dogru = await bcrypt.compare(sifre, usta.sifre_hash);
    if (!dogru) return res.status(400).json({ xeta: 'Telefon və ya şifrə yanlışdır' });

    if (!usta.aktiv) return res.status(403).json({ xeta: 'Hesabınız bloklanıb' });

    res.json({
      token: tokenYarat(usta),
      usta: {
        id: usta.id, ad: usta.ad, soyad: usta.soyad,
        telefon, kateqoriya: usta.kateqoriya,
        tesdiqlendi: usta.tesdiqlendi, onlayn: usta.onlayn,
        foto: usta.foto,
      },
    });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// PUT /api/usta/onlayn  — onlayn/offline keçid
async function onlaynDeyis(req, res) {
  try {
    const { onlayn } = req.body;
    const usta = await Usta.findByPk(req.usta.id);

    if (!usta.tesdiqlendi) {
      return res.status(403).json({ xeta: 'Hesabınız hələ təsdiqlənməyib' });
    }

    await usta.update({ onlayn });
    res.json({ onlayn });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// PUT /api/usta/konum  — real vaxtda konum yenilə
async function konumYenile(req, res) {
  try {
    const { lat, lng } = req.body;
    await Usta.update(
      { lat, lng, konum_yenilendi: new Date() },
      { where: { id: req.usta.id } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// PUT /api/usta/fcm-token
async function fcmTokenYenile(req, res) {
  try {
    const { fcm_token } = req.body;
    await Usta.update({ fcm_token }, { where: { id: req.usta.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// GET /api/usta/profil
async function profil(req, res) {
  try {
    const usta = await Usta.findByPk(req.usta.id, {
      attributes: { exclude: ['sifre_hash', 'fcm_token'] },
    });
    res.json(usta);
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

module.exports = { qeydiyyat, giris, onlaynDeyis, konumYenile, fcmTokenYenile, profil };
