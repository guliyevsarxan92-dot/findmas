const { Op } = require('sequelize');
const { Usta, Sifaris } = require('../models');

// Haversine düsturu ilə iki nöqtə arasındakı məsafə (km)
function məsafeHesabla(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Fair Scoring: hər usta üçün xal hesabla (0–100) ─────────────────────────
// Amillər:
//   məsafə    40%  — yaxın usta daha yüksək
//   reytinq   25%  — orta reytinq
//   qəbul %   20%  — qəbul nisbəti (qəbul / alınan)
//   gözləmə   10%  — son sifarişdən nə qədər keçib (uzun gözləyən bonus)
//   aktivlik   5%  — bu gün az qazananlar bonus alır (ədalətli bölgü)
function xalHesabla(usta, məsafe, bugunQazanc, maxQazanc) {
  // 1. Məsafə xalı: 0 km → 40, 20 km → 0
  const məsafeXal = Math.max(0, 40 * (1 - məsafe / 20));

  // 2. Reytinq xalı: 5 ulduz → 25, 0 → 0
  const reytinq = parseFloat(usta.orta_reytinq) || 3.0;
  const reytinqXal = (reytinq / 5) * 25;

  // 3. Qəbul nisbəti xalı: alınan sifarişlərdən qəbul edilənlərin faizi
  //    Bunu ümumi tamamlanan_sifaris / (tamamlanan + rədd) ilə yaxınlaşdırırıq
  //    Sadə versiya: tamamlanan çox olsa nisbət yüksək sayılır (max 20)
  const tamamlanan = parseInt(usta.tamamlanan_sifaris) || 0;
  const qebulXal = Math.min(20, (tamamlanan / Math.max(tamamlanan + 2, 1)) * 20);

  // 4. Gözləmə bonusu: son sifariş nə qədər əvvəl idi (minutes)
  //    son_sifaris_tarixi yoxdursa maksimum bonus (yeni usta)
  const sonSifarisDk = usta.son_sifaris_tarixi
    ? (Date.now() - new Date(usta.son_sifaris_tarixi).getTime()) / 60000
    : 9999;
  const gozlemeXal = Math.min(10, (sonSifarisDk / 60) * 10); // 1 saat = 10 xal

  // 5. Aktivlik penaltisi: bu gün çox qazanmış usta az bonus alır
  //    maxQazanc = bu gün ən çox qazanan usta
  const aktivlikXal = maxQazanc > 0
    ? (1 - bugunQazanc / maxQazanc) * 5
    : 5;

  return məsafeXal + reytinqXal + qebulXal + gozlemeXal + aktivlikXal;
}

// ── Məşğul olub-olmadığını yoxla ────────────────────────────────────────────
async function məsgulMu(ustaId) {
  const aktiv = await Sifaris.findOne({
    where: {
      usta_id: ustaId,
      status: ['qebul_edildi', 'yolda', 'baslandi'],
    },
  });
  return !!aktiv;
}

// ── Uyğun ustalar tap + Fair Scoring tətbiq et ──────────────────────────────
// istisnaIds: göndərilmiş + rədd edən ustalar — bunlara göndərmə
async function uygunUstalarTap(lat, lng, kateqoriya, limitKm = 20, istisnaIds = [], topN = 3) {
  const latDelta = limitKm / 111;
  const lngDelta = limitKm / (111 * Math.cos((lat * Math.PI) / 180));

  const where = {
    kateqoriya,
    onlayn: true,
    tesdiqlendi: true,
    aktiv: true,
    lat: { [Op.between]: [lat - latDelta, lat + latDelta] },
    lng: { [Op.between]: [lng - lngDelta, lng + lngDelta] },
  };
  if (istisnaIds.length > 0) {
    where.id = { [Op.notIn]: istisnaIds };
  }

  const ustalar = await Usta.findAll({
    where,
    attributes: [
      'id', 'ad', 'soyad', 'foto', 'orta_reytinq',
      'tamamlanan_sifaris', 'umuml_qazanc', 'lat', 'lng',
      'fcm_token', 'son_sifaris_tarixi',
    ],
  });

  // Dəqiq məsafə və məşğulluk yoxlaması
  const namizədlər = [];
  for (const u of ustalar) {
    const məsafe = məsafeHesabla(lat, lng, parseFloat(u.lat), parseFloat(u.lng));
    if (məsafe > limitKm) continue;
    const mesgul = await məsgulMu(u.id);
    if (mesgul) continue;
    namizədlər.push({ ...u.toJSON(), məsafe });
  }

  if (namizədlər.length === 0) return [];

  // Bu günkü qazanc üçün maks dəyər tap (nisbi penalti üçün)
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const bugunQazanclar = await Promise.all(
    namizədlər.map(async (u) => {
      const { fn, col, Op: Op2 } = require('sequelize');
      const res = await Sifaris.findOne({
        where: {
          usta_id: u.id,
          status: 'odendi',
          odenis_tarixi: { [Op2.gte]: bugun },
        },
        attributes: [[fn('COALESCE', fn('SUM', col('məbleg')), 0), 'cem']],
        raw: true,
      });
      return { id: u.id, qazanc: parseFloat(res?.cem || 0) };
    })
  );

  const qazancMap = {};
  let maxQazanc = 0;
  for (const { id, qazanc } of bugunQazanclar) {
    qazancMap[id] = qazanc;
    if (qazanc > maxQazanc) maxQazanc = qazanc;
  }

  // Xal hesabla və sırala
  const xalliUstalar = namizədlər.map((u) => ({
    ...u,
    xal: xalHesabla(u, u.məsafe, qazancMap[u.id] || 0, maxQazanc),
  }));

  xalliUstalar.sort((a, b) => b.xal - a.xal);
  return xalliUstalar.slice(0, topN);
}

// Köhnə funksiya — geriyə uyğunluq üçün saxlanılır
async function yaxinUstalarTap(lat, lng, kateqoriya, limitKm = 20) {
  return uygunUstalarTap(lat, lng, kateqoriya, limitKm, [], 10);
}

module.exports = { yaxinUstalarTap, uygunUstalarTap, məsafeHesabla, məsgulMu };
