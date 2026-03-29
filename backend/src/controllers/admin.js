const { Usta, User, Sifaris } = require('../models');
const { Op } = require('sequelize');

// GET /api/admin/ustalar?tesdiqlendi=false
async function ustalarSiyahi(req, res) {
  try {
    const { tesdiqlendi, sehife = 1 } = req.query;
    const where = {};
    if (tesdiqlendi !== undefined) where.tesdiqlendi = tesdiqlendi === 'true';

    const { count, rows } = await Usta.findAndCountAll({
      where,
      attributes: { exclude: ['sifre_hash', 'fcm_token'] },
      order: [['yaradildi', 'DESC']],
      limit: 20,
      offset: (sehife - 1) * 20,
    });

    res.json({ cem: count, ustalar: rows });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// PUT /api/admin/usta/:id/tesdiqlə
async function ustaTesdiqlə(req, res) {
  try {
    const usta = await Usta.findByPk(req.params.id);
    if (!usta) return res.status(404).json({ xeta: 'Tapılmadı' });

    await usta.update({ tesdiqlendi: true, tesdiqleme_tarixi: new Date() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// PUT /api/admin/usta/:id/blokla
async function ustaBlokla(req, res) {
  try {
    await Usta.update({ aktiv: false, onlayn: false }, { where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// GET /api/admin/statistika
async function statistika(req, res) {
  try {
    const [
      cem_istifadeci,
      cem_usta,
      tesdiqsiz_usta,
      bugun_sifaris,
      cem_tamamlandi,
    ] = await Promise.all([
      User.count(),
      Usta.count({ where: { aktiv: true } }),
      Usta.count({ where: { tesdiqlendi: false, aktiv: true } }),
      Sifaris.count({
        where: {
          yaradildi: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      Sifaris.count({ where: { status: 'odendi' } }),
    ]);

    res.json({ cem_istifadeci, cem_usta, tesdiqsiz_usta, bugun_sifaris, cem_tamamlandi });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// GET /api/admin/sifarisler
async function sifarisler(req, res) {
  try {
    const { status, sehife = 1 } = req.query;
    const where = status ? { status } : {};

    const { count, rows } = await Sifaris.findAndCountAll({
      where,
      include: [
        { model: User, as: 'istifadeci', attributes: ['id', 'ad', 'soyad', 'telefon'] },
        { model: Usta, as: 'usta', attributes: ['id', 'ad', 'soyad', 'telefon'] },
      ],
      order: [['yaradildi', 'DESC']],
      limit: 20,
      offset: (sehife - 1) * 20,
    });

    res.json({ cem: count, sifarisler: rows });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

module.exports = { ustalarSiyahi, ustaTesdiqlə, ustaBlokla, statistika, sifarisler };
