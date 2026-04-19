const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const { User } = require('../models');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `user_${req.istifadeci.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function tokenYarat(user, sessiya) {
  return jwt.sign(
    { id: user.id, nov: 'istifadeci', telefon: user.telefon, sessiya },
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
    const sessiya = crypto.randomUUID();
    const user = await User.create({ ad, soyad, telefon, email, sifre_hash, aktiv_sessiya: sessiya });

    res.status(201).json({ token: tokenYarat(user, sessiya), istifadeci: { id: user.id, ad, soyad, telefon, email } });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/istifadeci/giris
async function giris(req, res) {
  try {
    const { telefon, sifre } = req.body;
    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: { telefon: { [Op.in]: [telefon, telefon.replace(/^\+/, ''), '+' + telefon.replace(/^\+/, '')] } }
    });
    if (!user) return res.status(400).json({ xeta: 'Telefon və ya şifrə yanlışdır' });

    const dogru = await bcrypt.compare(sifre, user.sifre_hash);
    if (!dogru) return res.status(400).json({ xeta: 'Telefon və ya şifrə yanlışdır' });

    if (!user.aktiv) return res.status(403).json({ xeta: 'Hesabınız bloklanıb' });

    const sessiya = crypto.randomUUID();
    await user.update({ aktiv_sessiya: sessiya });

    res.json({ token: tokenYarat(user, sessiya), istifadeci: { id: user.id, ad: user.ad, soyad: user.soyad, telefon, foto: user.foto } });
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

// PUT /api/istifadeci/profil  — məlumatları yenilə
async function profilYenile(req, res) {
  try {
    const { ad, soyad, email } = req.body;
    if (!ad || !soyad) return res.status(400).json({ xeta: 'Ad və soyad məcburidir' });
    await User.update({ ad, soyad, email }, { where: { id: req.istifadeci.id } });
    const user = await User.findByPk(req.istifadeci.id, {
      attributes: { exclude: ['sifre_hash', 'fcm_token'] },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// PUT /api/istifadeci/profil-foto
const profilFotoMiddleware = upload.single('foto');
async function profilFotoYenile(req, res) {
  profilFotoMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ xeta: err.message });
    try {
      let foto;
      if (req.file) {
        foto = `/uploads/${req.file.filename}`;
      } else if (req.body.foto) {
        foto = req.body.foto;
      } else {
        return res.status(400).json({ xeta: 'Foto göndərilməyib' });
      }
      await User.update({ foto }, { where: { id: req.istifadeci.id } });
      res.json({ ok: true, foto });
    } catch (err) {
      res.status(500).json({ xeta: err.message });
    }
  });
}

// POST /api/istifadeci/google-giris
async function googleGiris(req, res) {
  try {
    const { id_token } = req.body;
    if (!id_token) return res.status(400).json({ xeta: 'Google token göndərilməyib' });

    const { OAuth2Client } = require('google-auth-library');
    const WEB_CLIENT_ID = '682117254538-5avgsk6jv3mpnsvtuosbctkn2f7sq6ff.apps.googleusercontent.com';
    const oauth2 = new OAuth2Client(WEB_CLIENT_ID);
    const ticket = await oauth2.verifyIdToken({ idToken: id_token, audience: WEB_CLIENT_ID });
    const payload = ticket.getPayload();
    const uid = payload.sub;
    const email = payload.email;
    const name = payload.name;

    let user = await User.findOne({ where: { google_id: uid } });

    if (!user && email) {
      user = await User.findOne({ where: { email } });
      if (user) {
        await user.update({ google_id: uid });
      }
    }

    if (!user) {
      const sessiya = crypto.randomUUID();
      const adParts = (name || 'İstifadəçi').split(' ');
      user = await User.create({
        ad: adParts[0] || 'İstifadəçi',
        soyad: adParts.slice(1).join(' ') || '',
        telefon: `google_${uid}`,
        email,
        google_id: uid,
        foto: payload.picture || null,
        aktiv_sessiya: sessiya,
      });

      return res.json({
        token: tokenYarat(user, sessiya),
        istifadeci: { id: user.id, ad: user.ad, soyad: user.soyad, telefon: user.telefon, foto: user.foto, email: user.email },
        yeni_hesab: true,
      });
    }

    if (!user.aktiv) return res.status(403).json({ xeta: 'Hesabınız bloklanıb' });

    const sessiya = crypto.randomUUID();
    await user.update({ aktiv_sessiya: sessiya });

    res.json({
      token: tokenYarat(user, sessiya),
      istifadeci: { id: user.id, ad: user.ad, soyad: user.soyad, telefon: user.telefon, foto: user.foto, email: user.email },
      yeni_hesab: user.telefon?.startsWith('google_'),
    });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

module.exports = { qeydiyyat, giris, googleGiris, fcmTokenYenile, profil, profilYenile, profilFotoYenile };
