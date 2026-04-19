const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Usta } = require('../models');

function tokenYarat(usta, sessiya) {
  return jwt.sign(
    { id: usta.id, nov: 'usta', telefon: usta.telefon, sessiya },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/usta/qeydiyyat
async function qeydiyyat(req, res) {
  try {
    const { ad, soyad, telefon, email, sifre, kateqoriyalar } = req.body;

    const katArr = Array.isArray(kateqoriyalar) ? kateqoriyalar : [kateqoriyalar].filter(Boolean);
    if (katArr.length === 0 || katArr.length > 2) {
      return res.status(400).json({ xeta: 'Ən az 1, ən çox 2 xidmət seçin' });
    }

    const var_olan = await Usta.findOne({ where: { telefon } });
    if (var_olan) return res.status(400).json({ xeta: 'Bu telefon artıq qeydiyyatdadır' });

    const sifre_hash = await bcrypt.hash(sifre, 12);
    const sessiya = crypto.randomUUID();
    const usta = await Usta.create({
      ad, soyad, telefon, email, sifre_hash,
      kateqoriya: katArr[0],
      kateqoriyalar: katArr,
      aktiv_kateqoriyalar: katArr,
      aktiv_sessiya: sessiya,
    });

    res.status(201).json({
      mesaj: 'Qeydiyyat tamamlandı. Sənədlərinizi yükləyin, admin təsdiqini gözləyin.',
      token: tokenYarat(usta, sessiya),
      usta: { id: usta.id, ad, soyad, telefon, kateqoriyalar: katArr, tesdiqlendi: false },
    });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/usta/giris
// Body: { telefon?, email?, sifre }  — biri mütləq göndərilməlidir
async function giris(req, res) {
  try {
    const { telefon, email, sifre } = req.body;
    const { Op } = require('sequelize');

    let usta = null;
    if (telefon) {
      usta = await Usta.findOne({
        where: { telefon: { [Op.in]: [telefon, telefon.replace(/^\+/, ''), '+' + telefon.replace(/^\+/, '')] } },
      });
    } else if (email) {
      usta = await Usta.findOne({ where: { email } });
    }

    if (!usta) return res.status(400).json({ xeta: 'Məlumatlar yanlışdır' });

    const dogru = await bcrypt.compare(sifre, usta.sifre_hash);
    if (!dogru) return res.status(400).json({ xeta: 'Məlumatlar yanlışdır' });

    // Blok yoxlaması
    if (usta.bloklanib) {
      if (usta.blok_bitis && new Date(usta.blok_bitis) <= new Date()) {
        await usta.update({ bloklanib: false, blok_bitis: null, blok_sebeb: null });
      } else {
        const bitis = usta.blok_bitis ? new Date(usta.blok_bitis).toLocaleDateString('az') : 'Həmişəlik';
        return res.status(403).json({ xeta: `Hesabınız bloklanıb. Bitmə: ${bitis}`, bloklanib: true });
      }
    }

    const sessiya = crypto.randomUUID();
    await usta.update({ aktiv_sessiya: sessiya });

    res.json({
      token: tokenYarat(usta, sessiya),
      usta: {
        id: usta.id, ad: usta.ad, soyad: usta.soyad,
        telefon, kateqoriya: usta.kateqoriya,
        tesdiqlendi: usta.tesdiqlendi, onlayn: usta.onlayn,
        foto: usta.foto, bloklanib: usta.bloklanib,
        blok_bitis: usta.blok_bitis, blok_sebeb: usta.blok_sebeb,
        vesiqe_on: !!usta.vesiqe_on, lisenziya: !!usta.lisenziya,
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

    // Blok yoxlaması
    if (usta.bloklanib) {
      if (usta.blok_bitis && new Date(usta.blok_bitis) <= new Date()) {
        // Blok müddəti bitib — avtomatik aç
        await usta.update({ bloklanib: false, blok_bitis: null, blok_sebeb: null });
      } else {
        const bitis = usta.blok_bitis ? new Date(usta.blok_bitis).toLocaleDateString('az') : 'Həmişəlik';
        return res.status(403).json({ xeta: `Hesabınız bloklanıb. Bitmə: ${bitis}`, bloklanib: true, blok_bitis: usta.blok_bitis, blok_sebeb: usta.blok_sebeb });
      }
    }

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

// PUT /api/usta/profil  — ad, soyad, email, kateqoriyalar, aktiv_kateqoriyalar yenilə
async function profilYenile(req, res) {
  try {
    const { ad, soyad, email, kateqoriyalar, aktiv_kateqoriyalar } = req.body;
    if (!ad || !soyad) return res.status(400).json({ xeta: 'Ad və soyad məcburidir' });

    const update = { ad, soyad, email };

    if (kateqoriyalar !== undefined) {
      const katArr = Array.isArray(kateqoriyalar) ? kateqoriyalar : [];
      if (katArr.length > 2) return res.status(400).json({ xeta: 'Ən çox 2 xidmət seçə bilərsiniz' });
      update.kateqoriyalar = katArr;
      update.kateqoriya = katArr[0] || null;
      if (!aktiv_kateqoriyalar) {
        update.aktiv_kateqoriyalar = katArr;
      }
    }

    if (aktiv_kateqoriyalar !== undefined) {
      const aktivArr = Array.isArray(aktiv_kateqoriyalar) ? aktiv_kateqoriyalar : [];
      const usta = await Usta.findByPk(req.usta.id, { attributes: ['kateqoriyalar'] });
      const katList = kateqoriyalar ? (Array.isArray(kateqoriyalar) ? kateqoriyalar : []) : (usta?.kateqoriyalar || []);
      const valid = aktivArr.every(k => katList.includes(k));
      if (!valid) return res.status(400).json({ xeta: 'Aktiv kateqoriya seçilmiş xidmətlərdən olmalıdır' });
      update.aktiv_kateqoriyalar = aktivArr;
      if (aktivArr.length > 0) update.kateqoriya = aktivArr[0];
    }

    await Usta.update(update, { where: { id: req.usta.id } });
    const usta = await Usta.findByPk(req.usta.id, { attributes: { exclude: ['sifre_hash', 'fcm_token'] } });
    res.json(usta);
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// PUT /api/usta/profil-foto  — base64 şəkil yüklə
async function profilFotoYenile(req, res) {
  try {
    const { foto } = req.body; // base64 data URI və ya URL
    if (!foto) return res.status(400).json({ xeta: 'Foto göndərilməyib' });
    await Usta.update({ foto }, { where: { id: req.usta.id } });
    res.json({ ok: true, foto });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// PUT /api/usta/senedler  — şəxsiyyət vəsiqəsi + lisenziya yüklə
async function senedlerYenile(req, res) {
  try {
    const { vesiqe_on, lisenziya } = req.body;
    const update = {};
    if (vesiqe_on) update.vesiqe_on = vesiqe_on;
    if (lisenziya) update.lisenziya = lisenziya;
    if (Object.keys(update).length === 0) return res.status(400).json({ xeta: 'Heç bir sənəd göndərilməyib' });
    await Usta.update(update, { where: { id: req.usta.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// POST /api/usta/google-giris
async function googleGiris(req, res) {
  try {
    const { id_token, kateqoriya, kateqoriyalar: reqKatArr } = req.body;
    if (!id_token) return res.status(400).json({ xeta: 'Google token göndərilməyib' });

    const { OAuth2Client } = require('google-auth-library');
    const WEB_CLIENT_ID = '682117254538-5avgsk6jv3mpnsvtuosbctkn2f7sq6ff.apps.googleusercontent.com';
    const oauth2 = new OAuth2Client(WEB_CLIENT_ID);
    const ticket = await oauth2.verifyIdToken({ idToken: id_token, audience: WEB_CLIENT_ID });
    const payload = ticket.getPayload();
    const uid = payload.sub;
    const email = payload.email;
    const name = payload.name;

    let usta = await Usta.findOne({ where: { google_id: uid } });

    if (!usta && email) {
      usta = await Usta.findOne({ where: { email } });
      if (usta) {
        await usta.update({ google_id: uid });
      }
    }

    if (!usta) {
      const katArr = reqKatArr || (kateqoriya ? [kateqoriya] : []);
      if (katArr.length === 0) {
        return res.status(400).json({ xeta: 'Kateqoriya seçilməlidir', kateqoriya_lazim: true });
      }
      const sessiya = crypto.randomUUID();
      const adParts = (name || 'Usta').split(' ');
      usta = await Usta.create({
        ad: adParts[0] || 'Usta',
        soyad: adParts.slice(1).join(' ') || '',
        telefon: `google_${uid}`,
        email,
        google_id: uid,
        kateqoriya: katArr[0],
        kateqoriyalar: katArr,
        aktiv_kateqoriyalar: katArr,
        foto: payload.picture || null,
        aktiv_sessiya: sessiya,
      });

      return res.json({
        token: tokenYarat(usta, sessiya),
        usta: {
          id: usta.id, ad: usta.ad, soyad: usta.soyad,
          telefon: usta.telefon, kateqoriya: usta.kateqoriya,
          tesdiqlendi: usta.tesdiqlendi, onlayn: usta.onlayn,
          foto: usta.foto, bloklanib: usta.bloklanib,
          vesiqe_on: !!usta.vesiqe_on, lisenziya: !!usta.lisenziya,
        },
        yeni_hesab: true,
      });
    }

    if (usta.bloklanib) {
      if (usta.blok_bitis && new Date(usta.blok_bitis) <= new Date()) {
        await usta.update({ bloklanib: false, blok_bitis: null, blok_sebeb: null });
      } else {
        const bitis = usta.blok_bitis ? new Date(usta.blok_bitis).toLocaleDateString('az') : 'Həmişəlik';
        return res.status(403).json({ xeta: `Hesabınız bloklanıb. Bitmə: ${bitis}`, bloklanib: true });
      }
    }

    const sessiya = crypto.randomUUID();
    await usta.update({ aktiv_sessiya: sessiya });

    res.json({
      token: tokenYarat(usta, sessiya),
      usta: {
        id: usta.id, ad: usta.ad, soyad: usta.soyad,
        telefon: usta.telefon, kateqoriya: usta.kateqoriya,
        tesdiqlendi: usta.tesdiqlendi, onlayn: usta.onlayn,
        foto: usta.foto, bloklanib: usta.bloklanib,
        vesiqe_on: !!usta.vesiqe_on, lisenziya: !!usta.lisenziya,
      },
      yeni_hesab: usta.telefon?.startsWith('google_'),
    });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

module.exports = { qeydiyyat, giris, googleGiris, onlaynDeyis, konumYenile, fcmTokenYenile, profil, profilYenile, profilFotoYenile, senedlerYenile };
