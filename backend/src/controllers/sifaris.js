const { Sifaris, User, Usta, Mesaj } = require('../models');
const { yaxinUstalarTap } = require('../services/konum');
const { yeniSifarisbildiris, ustaQebulbildiris, ustaYoldaBildiris } = require('../services/fcm');

// POST /api/sifaris  — yeni sifariş ver
async function yeniSifaris(req, res) {
  try {
    const { kateqoriya, problem_tesvirr, unvan_metn, unvan_lat, unvan_lng, problem_foto } = req.body;

    // Aktiv sifarişi varmı?
    const aktiv = await Sifaris.findOne({
      where: {
        istifadeci_id: req.istifadeci.id,
        status: ['gozlenilir', 'qebul_edildi', 'yolda', 'baslandi'],
      },
    });
    if (aktiv) return res.status(400).json({ xeta: 'Artıq aktiv sifarişiniz var' });

    const sifaris = await Sifaris.create({
      istifadeci_id: req.istifadeci.id,
      kateqoriya,
      problem_tesvirr,
      unvan_metn,
      unvan_lat,
      unvan_lng,
      problem_foto: problem_foto || [],
    });

    // Yaxınlıqdakı ustaları tap və bildiriş göndər
    const ustalar = await yaxinUstalarTap(unvan_lat, unvan_lng, kateqoriya);
    for (const usta of ustalar) {
      await yeniSifarisbildiris(usta, sifaris);
    }

    // WebSocket vasitəsilə yayımla (app.js-dəki io)
    const io = req.app.get('io');
    if (io) {
      ustalar.forEach((u) => {
        io.to(`usta_${u.id}`).emit('yeni_sifaris', {
          id: sifaris.id,
          kateqoriya,
          problem_tesvirr,
          unvan_metn,
          unvan_lat,
          unvan_lng,
          məsafe: u.məsafe,
        });
      });
    }

    res.status(201).json({ sifaris_id: sifaris.id, status: sifaris.status });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/sifaris/:id/qebul  — usta qəbul edir (30 san vaxt limitli)
async function sifarisQebul(req, res) {
  try {
    const sifaris = await Sifaris.findByPk(req.params.id, {
      include: [{ model: User, as: 'istifadeci' }],
    });
    if (!sifaris) return res.status(404).json({ xeta: 'Sifariş tapılmadı' });
    if (sifaris.status !== 'gozlenilir') return res.status(400).json({ xeta: 'Sifariş artıq götürülüb' });

    // 30 saniyə yoxlaması
    const gecen = (Date.now() - new Date(sifaris.yaradildi).getTime()) / 1000;
    if (gecen > 30) return res.status(400).json({ xeta: 'Sifarişin vaxtı keçib' });

    await sifaris.update({
      usta_id: req.usta.id,
      status: 'qebul_edildi',
      qebul_tarixi: new Date(),
    });

    const usta = await Usta.findByPk(req.usta.id);
    await ustaQebulbildiris(sifaris.istifadeci, usta);

    const io = req.app.get('io');
    if (io) {
      io.to(`istifadeci_${sifaris.istifadeci_id}`).emit('sifaris_qebul', {
        sifaris_id: sifaris.id,
        usta: { id: usta.id, ad: usta.ad, soyad: usta.soyad, foto: usta.foto, telefon: usta.telefon, orta_reytinq: usta.orta_reytinq },
      });
    }

    res.json({ ok: true, status: 'qebul_edildi' });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/sifaris/:id/status  — status dəyiş (usta üçün)
async function statusDeyis(req, res) {
  try {
    const { yeni_status } = req.body;
    const sifaris = await Sifaris.findByPk(req.params.id, {
      include: [{ model: User, as: 'istifadeci' }],
    });

    if (!sifaris) return res.status(404).json({ xeta: 'Tapılmadı' });
    if (sifaris.usta_id !== req.usta.id) return res.status(403).json({ xeta: 'İcazə yoxdur' });

    const icaze_edilən = {
      qebul_edildi: 'yolda',
      yolda: 'baslandi',
      baslandi: 'tamamlandi',
    };

    if (icaze_edilən[sifaris.status] !== yeni_status) {
      return res.status(400).json({ xeta: `${sifaris.status} → ${yeni_status} keçidi mümkün deyil` });
    }

    const tarix_sahesi = {
      yolda: { konum_yenilendi: new Date() },
      baslandi: { baslama_tarixi: new Date() },
      tamamlandi: { tamamlama_tarixi: new Date() },
    };

    await sifaris.update({ status: yeni_status, ...tarix_sahesi[yeni_status] });

    if (yeni_status === 'yolda') {
      const usta = await Usta.findByPk(req.usta.id);
      await ustaYoldaBildiris(sifaris.istifadeci, usta);
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`istifadeci_${sifaris.istifadeci_id}`).emit('sifaris_status', {
        sifaris_id: sifaris.id,
        status: yeni_status,
      });
    }

    res.json({ ok: true, status: yeni_status });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/sifaris/:id/odenish  — istifadəçi ödəniş edir
async function odenish(req, res) {
  try {
    const { odenis_usulu, məbleg } = req.body;
    const sifaris = await Sifaris.findByPk(req.params.id);

    if (!sifaris) return res.status(404).json({ xeta: 'Tapılmadı' });
    if (sifaris.istifadeci_id !== req.istifadeci.id) return res.status(403).json({ xeta: 'İcazə yoxdur' });
    if (sifaris.status !== 'tamamlandi') return res.status(400).json({ xeta: 'Sifariş hələ tamamlanmayıb' });

    await sifaris.update({
      status: 'odendi',
      odenis_usulu,
      məbleg,
      odenis_tarixi: new Date(),
    });

    // Ustanın qazancını artır
    const usta = await Usta.findByPk(sifaris.usta_id);
    await usta.update({
      umuml_qazanc: parseFloat(usta.umuml_qazanc) + parseFloat(məbleg),
      tamamlanan_sifaris: usta.tamamlanan_sifaris + 1,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`usta_${sifaris.usta_id}`).emit('odenis_alindi', {
        sifaris_id: sifaris.id,
        məbleg,
        odenis_usulu,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/sifaris/:id/reytinq  — reytinq ver
async function reytinqVer(req, res) {
  try {
    const { reytinq, reytinq_yorum } = req.body;
    const sifaris = await Sifaris.findByPk(req.params.id);

    if (!sifaris) return res.status(404).json({ xeta: 'Tapılmadı' });
    if (sifaris.istifadeci_id !== req.istifadeci.id) return res.status(403).json({ xeta: 'İcazə yoxdur' });
    if (sifaris.status !== 'odendi') return res.status(400).json({ xeta: 'Əvvəlcə ödəniş edin' });
    if (sifaris.reytinq) return res.status(400).json({ xeta: 'Artıq reytinq vermisiniz' });

    await sifaris.update({ reytinq, reytinq_yorum });

    // Ustanın orta reytinqini yenilə
    const { fn, col } = require('sequelize');
    const usta = await Usta.findByPk(sifaris.usta_id);
    const ort = await Sifaris.findOne({
      where: { usta_id: sifaris.usta_id, reytinq: { [require('sequelize').Op.ne]: null } },
      attributes: [[fn('AVG', col('reytinq')), 'ort']],
      raw: true,
    });
    await usta.update({ orta_reytinq: parseFloat(ort.ort).toFixed(2) });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// GET /api/sifaris/aktiv  — aktiv sifariş
async function aktivSifaris(req, res) {
  try {
    const where = req.istifadeci
      ? { istifadeci_id: req.istifadeci.id, status: ['gozlenilir', 'qebul_edildi', 'yolda', 'baslandi'] }
      : { usta_id: req.usta.id, status: ['qebul_edildi', 'yolda', 'baslandi'] };

    const sifaris = await Sifaris.findOne({
      where,
      include: [
        { model: User, as: 'istifadeci', attributes: ['id', 'ad', 'soyad', 'foto', 'telefon'] },
        { model: Usta, as: 'usta', attributes: ['id', 'ad', 'soyad', 'foto', 'telefon', 'orta_reytinq', 'lat', 'lng'] },
      ],
    });

    res.json(sifaris || null);
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// GET /api/sifaris/tarixce  — keçmiş sifarişlər
async function tarixce(req, res) {
  try {
    const { sehife = 1 } = req.query;
    const limit = 20;
    const where = req.istifadeci
      ? { istifadeci_id: req.istifadeci.id, status: ['odendi', 'legv_edildi'] }
      : { usta_id: req.usta.id, status: ['odendi', 'legv_edildi'] };

    const { count, rows } = await Sifaris.findAndCountAll({
      where,
      order: [['yaradildi', 'DESC']],
      limit,
      offset: (sehife - 1) * limit,
    });

    res.json({ cem: count, sehife: parseInt(sehife), sifarisler: rows });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

module.exports = { yeniSifaris, sifarisQebul, statusDeyis, odenish, reytinqVer, aktivSifaris, tarixce };
