const { BalansArtirma, Usta, Admin } = require('../models');

// GET /api/usta/balans-kart  — admin tərəfindən aktiv kart məlumatı
async function aktifKart(req, res) {
  try {
    const admin = await Admin.findOne({ where: { aktiv: true } });
    res.json({ kart: admin?.odeme_karti || null });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/usta/balans-artir  — usta artırma sorğusu göndərir (qəbz + məbləğ)
async function balansArtirSorgu(req, res) {
  try {
    const { məbleg, kart_nomre, qebz } = req.body;
    if (!məbleg || məbleg <= 0) return res.status(400).json({ xeta: 'Düzgün məbləğ daxil edin' });
    if (!kart_nomre) return res.status(400).json({ xeta: 'Kart nömrəsini daxil edin' });

    // Gözləyən sorğu varmı?
    const gozlenir = await BalansArtirma.findOne({
      where: { usta_id: req.usta.id, status: 'gozlenir' },
    });
    if (gozlenir) return res.status(400).json({ xeta: 'Artıq gözlənən sorğunuz var' });

    const sorgu = await BalansArtirma.create({
      usta_id: req.usta.id,
      məbleg,
      kart_nomre,
      qebz: qebz || null,
    });
    res.status(201).json({ ok: true, id: sorgu.id });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// GET /api/usta/balans-tarixce  — usta öz artırma tarixçəsini görür
async function balasTarixce(req, res) {
  try {
    const list = await BalansArtirma.findAll({
      where: { usta_id: req.usta.id },
      order: [['yaradildi', 'DESC']],
      limit: 20,
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// ── Admin endpoints ──────────────────────────────────────────────────────────

// GET /api/admin/balans-sorqular
async function adminSorqular(req, res) {
  try {
    const { status = 'gozlenir', sehife = 1 } = req.query;
    const { count, rows } = await BalansArtirma.findAndCountAll({
      where: status === 'hamisi' ? {} : { status },
      include: [{ model: Usta, as: 'usta', attributes: ['id', 'ad', 'soyad', 'telefon', 'balans'] }],
      order: [['yaradildi', 'DESC']],
      limit: 20,
      offset: (sehife - 1) * 20,
    });
    res.json({ cem: count, sorqular: rows });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// PUT /api/admin/balans-sorgu/:id/tesdiq
async function adminTesdiq(req, res) {
  try {
    const sorgu = await BalansArtirma.findByPk(req.params.id, {
      include: [{ model: Usta, as: 'usta' }],
    });
    if (!sorgu) return res.status(404).json({ xeta: 'Tapılmadı' });
    if (sorgu.status !== 'gozlenir') return res.status(400).json({ xeta: 'Artıq işlənib' });

    await sorgu.update({ status: 'tesdiq', tesdiq_tarixi: new Date() });
    await sorgu.usta.update({
      balans: parseFloat(sorgu.usta.balans) + parseFloat(sorgu.məbleg),
    });

    // Real-vaxtda ustaya bildiriş
    const io = req.app.get('io');
    if (io) {
      io.to(`usta_${sorgu.usta_id}`).emit('balans_artdi', {
        məbleg: sorgu.məbleg,
        yeni_balans: parseFloat(sorgu.usta.balans) + parseFloat(sorgu.məbleg),
      });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// PUT /api/admin/balans-sorgu/:id/redd
async function adminRedd(req, res) {
  try {
    const { qeyd } = req.body;
    const sorgu = await BalansArtirma.findByPk(req.params.id);
    if (!sorgu) return res.status(404).json({ xeta: 'Tapılmadı' });
    await sorgu.update({ status: 'redd', admin_qeyd: qeyd });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// GET /api/admin/balans-kart — admin öz ödəniş kartını görür
async function adminKartAl(req, res) {
  try {
    const admin = await Admin.findOne({ where: { aktiv: true } });
    res.json({ kart: admin?.odeme_karti || null });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// PUT /api/admin/balans-kart  — ödəniş kartını yenilə
async function adminKartYenile(req, res) {
  try {
    const { kart } = req.body;
    await Admin.update({ odeme_karti: kart }, { where: {} });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

module.exports = {
  aktifKart, balansArtirSorgu, balasTarixce,
  adminSorqular, adminTesdiq, adminRedd, adminKartAl, adminKartYenile,
};
