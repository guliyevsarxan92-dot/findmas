const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

// POST /api/admin/giris
async function giris(req, res) {
  try {
    const { telefon, sifre } = req.body;
    const admin = await Admin.findOne({ where: { telefon } });
    if (!admin) return res.status(400).json({ xeta: 'Yanlış telefon və ya şifrə' });

    const dogru = await bcrypt.compare(sifre, admin.sifre_hash);
    if (!dogru) return res.status(400).json({ xeta: 'Yanlış telefon və ya şifrə' });

    const token = jwt.sign({ id: admin.id, nov: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, admin: { id: admin.id, ad: admin.ad, telefon } });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// İlk admin yaratmaq üçün (yalnız bir dəfə, sonra söndürün)
// POST /api/admin/ilk-qeydiyyat  (yalnız APP_SECRET ilə)
async function ilkQeydiyyat(req, res) {
  try {
    if (req.headers['x-app-secret'] !== process.env.APP_SECRET) {
      return res.status(403).json({ xeta: 'İcazə yoxdur' });
    }
    const { ad, telefon, sifre } = req.body;
    const movcud = await Admin.count();
    if (movcud > 0) return res.status(400).json({ xeta: 'Admin artıq var' });

    const sifre_hash = await bcrypt.hash(sifre, 12);
    const admin = await Admin.create({ ad, telefon, sifre_hash });
    res.status(201).json({ ok: true, id: admin.id });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

module.exports = { giris, ilkQeydiyyat };
