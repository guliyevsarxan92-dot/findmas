const { Xidmet } = require('../models');

// GET /api/xidmetler  — hamı üçün açıq; ?hamisi=1 ilə admin hamısını görür
async function siyahi(req, res) {
  try {
    const where = req.query.hamisi === '1' ? {} : { aktiv: true };
    const list = await Xidmet.findAll({
      where,
      order: [['sira', 'ASC'], ['yaradildi', 'ASC']],
    });
    res.json({ xidmetler: list });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/admin/xidmet
async function yarat(req, res) {
  try {
    const { key, ad, altbaslik, ikon, ikon_lib, rang, qiymet_min, qiymet_max, sira } = req.body;
    const x = await Xidmet.create({ key, ad, altbaslik, ikon, ikon_lib, rang, qiymet_min, qiymet_max, sira });
    res.status(201).json(x);
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// PUT /api/admin/xidmet/:id
async function yenile(req, res) {
  try {
    const x = await Xidmet.findByPk(req.params.id);
    if (!x) return res.status(404).json({ xeta: 'Tapılmadı' });
    await x.update(req.body);
    res.json(x);
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// DELETE /api/admin/xidmet/:id  (deactivate)
async function sil(req, res) {
  try {
    await Xidmet.update({ aktiv: false }, { where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

module.exports = { siyahi, yarat, yenile, sil };
