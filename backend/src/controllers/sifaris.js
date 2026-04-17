const { Sifaris, User, Usta, Mesaj } = require('../models');
const { uygunUstalarTap } = require('../services/konum');
const { yeniSifarisbildiris, ustaQebulbildiris, ustaYoldaBildiris } = require('../services/fcm');

// ── Rədd edənlər: 1 saat müddətli ──────────────────────────────────────────
const REDD_MUDDETI_MS = 60 * 60 * 1000; // 1 saat

function aktivReddEdenler(reddSiyahi) {
  const indi = Date.now();
  return (reddSiyahi || []).filter(r => r.vaxt && (indi - new Date(r.vaxt).getTime()) < REDD_MUDDETI_MS);
}

function aktivReddIds(reddSiyahi) {
  return aktivReddEdenler(reddSiyahi).map(r => r.usta_id);
}

// ── Usta-lara sifariş göndər (socket + FCM) ─────────────────────────────────
async function ustalaraGonder(io, sifaris, ustalar) {
  // Yeni göndərilənləri siyahıya əlavə et
  const yeniGonderilenIds = [
    ...new Set([...(sifaris.gonderilen_ustalar || []), ...ustalar.map(u => u.id)]),
  ];
  await sifaris.update({ gonderilen_ustalar: yeniGonderilenIds });

  for (const u of ustalar) {
    await yeniSifarisbildiris(u, sifaris).catch(() => {});
    if (io) {
      io.to(`usta_${u.id}`).emit('yeni_sifaris', {
        id: sifaris.id,
        kateqoriya: sifaris.kateqoriya,
        problem_tesvirr: sifaris.problem_tesvirr,
        problem_foto: sifaris.problem_foto,
        unvan_metn: sifaris.unvan_metn,
        unvan_lat: sifaris.unvan_lat,
        unvan_lng: sifaris.unvan_lng,
        məsafe: u.məsafe,
      });
    }
  }
}

// ── Yenidən usta axtarış (30s timeout sonra / rədd etmə sonra) ───────────────
// Aktiv timerlər: sifaris_id → setTimeout ref
const sifarisTimerlər = {};

async function yenidenUstaAxtarAdaptiv(sifarisId, io) {
  const RADISUSLAR = [20, 30, 50];

  const sifaris = await Sifaris.findByPk(sifarisId);
  if (!sifaris || sifaris.status !== 'gozlenilir') return;

  const istisna = [
    ...(sifaris.gonderilen_ustalar || []),
    ...aktivReddIds(sifaris.redd_eden_ustalar),
  ];

  let ustalar = await uygunUstalarTap(
    parseFloat(sifaris.unvan_lat),
    parseFloat(sifaris.unvan_lng),
    sifaris.kateqoriya,
    sifaris.axtaris_radius,
    istisna,
    3,
  );

  // Cari radiusda namizəd yoxdursa — radiusu genişləndir
  if (ustalar.length === 0) {
    const növbətiRadius = RADISUSLAR.find(r => r > sifaris.axtaris_radius);
    if (!növbətiRadius) {
      // Heç bir usta tapılmadı — müştəriyə bildiriş göndər
      if (io) {
        io.to(`istifadeci_${sifaris.istifadeci_id}`).emit('usta_tapilmadi', {
          sifaris_id: sifarisId,
          mesaj: 'Yaxınlıqda uyğun usta tapılmadı. Bir az sonra yenidən cəhd edin.',
        });
      }
      await sifaris.update({ status: 'legv_edildi', legv_sebeb: 'usta_tapilmadi' });
      return;
    }
    await sifaris.update({ axtaris_radius: növbətiRadius });
    ustalar = await uygunUstalarTap(
      parseFloat(sifaris.unvan_lat),
      parseFloat(sifaris.unvan_lng),
      sifaris.kateqoriya,
      növbətiRadius,
      istisna,
      3,
    );
  }

  if (ustalar.length === 0) {
    if (io) {
      io.to(`istifadeci_${sifaris.istifadeci_id}`).emit('usta_tapilmadi', {
        sifaris_id: sifarisId,
        mesaj: 'Yaxınlıqda uyğun usta tapılmadı.',
      });
    }
    await sifaris.update({ status: 'legv_edildi', legv_sebeb: 'usta_tapilmadi' });
    return;
  }

  await ustalaraGonder(io, sifaris, ustalar);

  // 30 saniyə sonra yenidən yoxla
  if (sifarisTimerlər[sifarisId]) clearTimeout(sifarisTimerlər[sifarisId]);
  sifarisTimerlər[sifarisId] = setTimeout(() => {
    yenidenUstaAxtarAdaptiv(sifarisId, io).catch(() => {});
  }, 30000);
}

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

    // Fair matching: top 3 usta seç
    const io = req.app.get('io');
    const ustalar = await uygunUstalarTap(
      parseFloat(unvan_lat), parseFloat(unvan_lng),
      kateqoriya, 20, [], 3,
    );

    if (ustalar.length > 0) {
      await ustalaraGonder(io, sifaris, ustalar);
    }

    // 30s sonra qəbul olunmadısa yenidən axtar
    if (sifarisTimerlər[sifaris.id]) clearTimeout(sifarisTimerlər[sifaris.id]);
    sifarisTimerlər[sifaris.id] = setTimeout(() => {
      yenidenUstaAxtarAdaptiv(sifaris.id, io).catch(() => {});
    }, 30000);

    res.status(201).json({ sifaris_id: sifaris.id, status: sifaris.status });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/sifaris/:id/qebul  — usta qəbul edir
async function sifarisQebul(req, res) {
  try {
    const sifaris = await Sifaris.findByPk(req.params.id, {
      include: [{ model: User, as: 'istifadeci' }],
    });
    if (!sifaris) return res.status(404).json({ xeta: 'Sifariş tapılmadı' });
    if (sifaris.status !== 'gozlenilir') return res.status(400).json({ xeta: 'Sifariş artıq götürülüb' });

    // Balans yoxlaması
    const ustaBalans = await Usta.findByPk(req.usta.id, { attributes: ['balans'] });
    if (parseFloat(ustaBalans.balans) < 0) {
      return res.status(403).json({ xeta: 'Balansınız mənfidir. Sifariş qəbul etmək üçün balansı artırın.' });
    }

    await sifaris.update({
      usta_id: req.usta.id,
      status: 'qebul_edildi',
      qebul_tarixi: new Date(),
    });

    // Timeri ləğv et
    if (sifarisTimerlər[sifaris.id]) {
      clearTimeout(sifarisTimerlər[sifaris.id]);
      delete sifarisTimerlər[sifaris.id];
    }

    const usta = await Usta.findByPk(req.usta.id);
    await ustaQebulbildiris(sifaris.istifadeci, usta).catch(() => {});

    const io = req.app.get('io');
    if (io) {
      // Müştəriyə bildiriş
      io.to(`istifadeci_${sifaris.istifadeci_id}`).emit('sifaris_qebul', {
        sifaris_id: sifaris.id,
        usta: {
          id: usta.id, ad: usta.ad, soyad: usta.soyad,
          foto: usta.foto, telefon: usta.telefon, orta_reytinq: usta.orta_reytinq,
        },
      });

      // Digər göndərilmiş ustalara — sifariş artıq götürüldü
      const diger = (sifaris.gonderilen_ustalar || []).filter(id => id !== req.usta.id);
      for (const ustaId of diger) {
        io.to(`usta_${ustaId}`).emit('sifaris_bashqasi_qebul_etdi', {
          sifaris_id: sifaris.id,
        });
      }
    }

    res.json({ ok: true, status: 'qebul_edildi' });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/sifaris/:id/redd  — usta rədd edir
async function sifarisRedd(req, res) {
  try {
    const sifaris = await Sifaris.findByPk(req.params.id);
    if (!sifaris) return res.status(404).json({ xeta: 'Tapılmadı' });
    if (sifaris.status !== 'gozlenilir') return res.status(400).json({ xeta: 'Sifariş artıq götürülüb' });

    // Rədd edənlər siyahısına əlavə et (vaxtla birlikdə)
    const mövcudRedd = (sifaris.redd_eden_ustalar || []).filter(r => r.usta_id !== req.usta.id);
    mövcudRedd.push({ usta_id: req.usta.id, vaxt: new Date().toISOString() });
    await sifaris.update({ redd_eden_ustalar: mövcudRedd });

    res.json({ ok: true });

    // Dərhal yeni usta axtar
    const io = req.app.get('io');
    if (sifarisTimerlər[sifaris.id]) {
      clearTimeout(sifarisTimerlər[sifaris.id]);
      delete sifarisTimerlər[sifaris.id];
    }
    yenidenUstaAxtarAdaptiv(sifaris.id, io).catch(() => {});
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
      yolda:      { gəliş_tarixi: new Date() },
      baslandi:   { baslama_tarixi: new Date() },
      tamamlandi: { tamamlama_tarixi: new Date() },
    };

    // Tamamlandı — xidmət haqqı məcburidir, ödəniş nağd olaraq avtomatik tamamlanır
    if (yeni_status === 'tamamlandi') {
      const { xidmet_haqqi } = req.body;
      const haqq = parseFloat(xidmet_haqqi || 0);
      if (!haqq || haqq <= 0) {
        return res.status(400).json({ xeta: 'Xidmət haqqını daxil edin' });
      }
      const komisyon = parseFloat((haqq * 0.10).toFixed(2));

      await sifaris.update({
        status: 'tamamlandi',
        tamamlama_tarixi: new Date(),
        xidmet_haqqi: haqq,
        odenis_usulu: 'nagd',
        məbleg: haqq,
        komisyon,
        odenis_tarixi: new Date(),
      });

      // Ustanın qazancını, balansını, xalını, statistikasını yenilə
      const usta = await Usta.findByPk(req.usta.id);
      const ustaQazanc = parseFloat((haqq - komisyon).toFixed(2));
      const XAL_PER_SIFARIS = 10;
      await usta.update({
        umuml_qazanc: parseFloat(usta.umuml_qazanc) + ustaQazanc,
        balans: parseFloat(usta.balans) - komisyon,
        tamamlanan_sifaris: usta.tamamlanan_sifaris + 1,
        xal: (usta.xal || 0) + XAL_PER_SIFARIS,
        son_sifaris_tarixi: new Date(),
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`istifadeci_${sifaris.istifadeci_id}`).emit('sifaris_status', {
          sifaris_id: sifaris.id,
          status: 'tamamlandi',
          xidmet_haqqi: haqq,
        });
      }
      return res.json({ ok: true, status: 'tamamlandi', xidmet_haqqi: haqq, komisyon });
    }

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

    // Ödəniş nağd — məbləği istifadəçi göndərir (və ya sifarişdən sabit qiymət)
    const odenisMebleg = parseFloat(məbleg || 0);
    const komisyon = parseFloat((odenisMebleg * 0.10).toFixed(2)); // 10% komisyon
    const ustaQazanc = parseFloat((odenisMebleg - komisyon).toFixed(2));

    await sifaris.update({
      status: 'odendi',
      odenis_usulu: 'nagd',
      məbleg: odenisMebleg,
      komisyon,
      odenis_tarixi: new Date(),
    });

    // Ustanın qazancını, balansını, xalını, statistikasını yenilə
    const usta = await Usta.findByPk(sifaris.usta_id);
    const XAL_PER_SIFARIS = 10;
    await usta.update({
      umuml_qazanc: parseFloat(usta.umuml_qazanc) + ustaQazanc,
      balans: parseFloat(usta.balans) - komisyon, // Komisyon balansdan çıxılır
      tamamlanan_sifaris: usta.tamamlanan_sifaris + 1,
      xal: (usta.xal || 0) + XAL_PER_SIFARIS,
      son_sifaris_tarixi: new Date(),
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`usta_${sifaris.usta_id}`).emit('odenis_alindi', {
        sifaris_id: sifaris.id,
        məbleg: ustaQazanc,
        komisyon,
        odenis_usulu: 'nagd',
        xal_qazanildi: XAL_PER_SIFARIS,
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
    if (!['tamamlandi', 'odendi'].includes(sifaris.status)) return res.status(400).json({ xeta: 'Sifariş hələ tamamlanmayıb' });
    if (sifaris.reytinq) return res.status(400).json({ xeta: 'Artıq reytinq vermisiniz' });

    const yeniStatus = sifaris.status === 'tamamlandi' ? 'odendi' : sifaris.status;
    await sifaris.update({ reytinq, reytinq_yorum, status: yeniStatus });

    // Ustanın orta reytinqini yenilə
    const { fn, col, Op } = require('sequelize');
    const usta = await Usta.findByPk(sifaris.usta_id);
    const ort = await Sifaris.findOne({
      where: { usta_id: sifaris.usta_id, reytinq: { [Op.ne]: null } },
      attributes: [[fn('AVG', col('reytinq')), 'ort']],
      raw: true,
    });
    if (ort && ort.ort != null) {
      await usta.update({ orta_reytinq: parseFloat(ort.ort).toFixed(2) });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/sifaris/:id/legv  — istifadəçi sifarişi ləğv edir
async function legvEt(req, res) {
  try {
    const sifaris = await Sifaris.findByPk(req.params.id);
    if (!sifaris) return res.status(404).json({ xeta: 'Tapılmadı' });
    if (sifaris.istifadeci_id !== req.istifadeci.id) return res.status(403).json({ xeta: 'İcazə yoxdur' });
    if (!['gozlenilir', 'qebul_edildi'].includes(sifaris.status)) {
      return res.status(400).json({ xeta: 'Bu statusda ləğv mümkün deyil' });
    }
    await sifaris.update({ status: 'legv_edildi' });

    // Timeri sil
    if (sifarisTimerlər[sifaris.id]) {
      clearTimeout(sifarisTimerlər[sifaris.id]);
      delete sifarisTimerlər[sifaris.id];
    }

    // Əlaqəli ustalara bildiriş göndər (rədd edənlər istisna — onlar artıq bu sifarişlə bağlı deyil)
    const io = req.app.get('io');
    if (io) {
      const reddEdenler = new Set(aktivReddIds(sifaris.redd_eden_ustalar));
      const bildirilecek = new Set(
        (sifaris.gonderilen_ustalar || []).filter(id => !reddEdenler.has(id))
      );
      if (sifaris.usta_id) bildirilecek.add(sifaris.usta_id);
      for (const uId of bildirilecek) {
        io.to(`usta_${uId}`).emit('sifaris_legv_edildi', {
          sifaris_id: sifaris.id,
          mesaj: 'Müştəri sifarişi ləğv etdi',
        });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/sifaris/:id/usta-legv  — usta qəbul etdiyi sifarişi ləğv edir (səbəb məcburi)
async function ustaLegvEt(req, res) {
  try {
    const { sebeb } = req.body;
    if (!sebeb || sebeb.trim().length < 5) {
      return res.status(400).json({ xeta: 'Ləğv səbəbi qeyd edilməlidir (min 5 simvol)' });
    }
    const sifaris = await Sifaris.findByPk(req.params.id, {
      include: [{ model: User, as: 'istifadeci' }],
    });
    if (!sifaris) return res.status(404).json({ xeta: 'Tapılmadı' });
    if (sifaris.usta_id !== req.usta.id) return res.status(403).json({ xeta: 'İcazə yoxdur' });
    if (!['qebul_edildi', 'yolda'].includes(sifaris.status)) {
      return res.status(400).json({ xeta: 'Bu statusda ləğv mümkün deyil' });
    }

    // Reytinqə mənfi təsir: -0.2 penalti
    const usta = await Usta.findByPk(req.usta.id);
    const yeniReytinq = Math.max(0, parseFloat(usta.orta_reytinq || 3) - 0.2);
    await usta.update({ orta_reytinq: yeniReytinq.toFixed(2) });

    // Sifarişi yenidən gözlənilir statusuna qaytar və başqa usta axtar
    const mövcudRedd = (sifaris.redd_eden_ustalar || []).filter(r => r.usta_id !== req.usta.id);
    mövcudRedd.push({ usta_id: req.usta.id, vaxt: new Date().toISOString() });
    await sifaris.update({
      status: 'gozlenilir',
      usta_id: null,
      legv_sebeb: null,
      redd_eden_ustalar: mövcudRedd,
    });

    // Müştəriyə bildiriş — yeni usta axtarılır
    const io = req.app.get('io');
    if (io) {
      io.to(`istifadeci_${sifaris.istifadeci_id}`).emit('usta_yeniden_axtarilir', {
        sifaris_id: sifaris.id,
        mesaj: 'Usta sifarişi ləğv etdi, yeni usta axtarılır...',
      });
    }

    // Dərhal yeni usta axtar
    yenidenUstaAxtarAdaptiv(sifaris.id, io).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// GET /api/sifaris/aktiv  — aktiv sifariş
async function aktivSifaris(req, res) {
  try {
    const where = req.istifadeci
      ? { istifadeci_id: req.istifadeci.id, status: ['gozlenilir', 'qebul_edildi', 'yolda', 'baslandi', 'tamamlandi'] }
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
      ? { istifadeci_id: req.istifadeci.id, status: ['tamamlandi', 'odendi', 'legv_edildi'] }
      : { usta_id: req.usta.id, status: ['tamamlandi', 'odendi', 'legv_edildi'] };

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

// GET /api/usta/qazanc  — günlük, həftəlik, aylıq qazanc statistikası
async function ustaQazanc(req, res) {
  try {
    const { Op, fn, col } = require('sequelize');
    const ustaId = req.usta.id;
    const indi = new Date();

    const gunBaslangic = new Date(indi.getFullYear(), indi.getMonth(), indi.getDate());
    const hefteBaslangic = new Date(gunBaslangic);
    hefteBaslangic.setDate(hefteBaslangic.getDate() - hefteBaslangic.getDay() + 1); // Bazar ertəsi
    if (hefteBaslangic > gunBaslangic) hefteBaslangic.setDate(hefteBaslangic.getDate() - 7);
    const ayBaslangic = new Date(indi.getFullYear(), indi.getMonth(), 1);

    const where = (baslangic) => ({
      usta_id: ustaId,
      status: 'tamamlandi',
      tamamlama_tarixi: { [Op.gte]: baslangic },
    });

    const hesabla = async (baslangic) => {
      const result = await Sifaris.findOne({
        where: where(baslangic),
        attributes: [
          [fn('COALESCE', fn('SUM', col('xidmet_haqqi')), 0), 'cem_haqqi'],
          [fn('COALESCE', fn('SUM', col('komisyon')), 0), 'cem_komisyon'],
          [fn('COUNT', col('id')), 'say'],
        ],
        raw: true,
      });
      return {
        qazanc: parseFloat(result.cem_haqqi) - parseFloat(result.cem_komisyon),
        xidmet_haqqi: parseFloat(result.cem_haqqi),
        komisyon: parseFloat(result.cem_komisyon),
        say: parseInt(result.say),
      };
    };

    const [gunluk, heftelik, aylik] = await Promise.all([
      hesabla(gunBaslangic),
      hesabla(hefteBaslangic),
      hesabla(ayBaslangic),
    ]);

    res.json({ gunluk, heftelik, aylik });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// GET /api/istifadeci/statistika  — istifadəçi ümumi statistikası
async function istifadeciStatistika(req, res) {
  try {
    const { Op, fn, col } = require('sequelize');
    const result = await Sifaris.findOne({
      where: {
        istifadeci_id: req.istifadeci.id,
        status: ['tamamlandi', 'odendi'],
      },
      attributes: [
        [fn('COUNT', col('id')), 'sifaris_sayi'],
        [fn('COALESCE', fn('SUM', col('məbleg')), 0), 'cem_xerc'],
      ],
      raw: true,
    });
    res.json({
      sifaris: parseInt(result.sifaris_sayi) || 0,
      xerc: parseFloat(result.cem_xerc || 0).toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

module.exports = { yeniSifaris, sifarisQebul, sifarisRedd, statusDeyis, legvEt, ustaLegvEt, odenish, reytinqVer, aktivSifaris, tarixce, ustaQazanc, istifadeciStatistika };
