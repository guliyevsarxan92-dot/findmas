const { Mesaj, Sifaris } = require('../models');

// GET /api/mesaj/:sifaris_id
async function mesajlar(req, res) {
  try {
    const { sifaris_id } = req.params;
    const sifaris = await Sifaris.findByPk(sifaris_id);
    if (!sifaris) return res.status(404).json({ xeta: 'Sifariş tapılmadı' });

    // Yalnız öz sifarişi
    const aiddir =
      (req.istifadeci && sifaris.istifadeci_id === req.istifadeci.id) ||
      (req.usta && sifaris.usta_id === req.usta.id);
    if (!aiddir) return res.status(403).json({ xeta: 'İcazə yoxdur' });

    const mesajlar = await Mesaj.findAll({
      where: { sifaris_id },
      order: [['yaradildi', 'ASC']],
    });

    // Oxunmamışları oxundu et
    const nov = req.istifadeci ? 'usta' : 'istifadeci';
    await Mesaj.update({ oxundu: true }, { where: { sifaris_id, gonderən_nov: nov, oxundu: false } });

    res.json(mesajlar);
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/mesaj/:sifaris_id
async function mesajGonder(req, res) {
  try {
    const { sifaris_id } = req.params;
    const { metn, fayl_url } = req.body;

    const sifaris = await Sifaris.findByPk(sifaris_id);
    if (!sifaris) return res.status(404).json({ xeta: 'Tapılmadı' });

    const nov = req.istifadeci ? 'istifadeci' : 'usta';
    const id = req.istifadeci ? req.istifadeci.id : req.usta.id;

    const mesaj = await Mesaj.create({
      sifaris_id,
      gonderən_nov: nov,
      gonderən_id: id,
      metn,
      fayl_url,
    });

    // WebSocket ilə göndər
    const io = req.app.get('io');
    if (io) {
      const alici_id = nov === 'istifadeci' ? `usta_${sifaris.usta_id}` : `istifadeci_${sifaris.istifadeci_id}`;
      io.to(alici_id).emit('yeni_mesaj', { sifaris_id, mesaj });
    }

    res.status(201).json(mesaj);
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

module.exports = { mesajlar, mesajGonder };
