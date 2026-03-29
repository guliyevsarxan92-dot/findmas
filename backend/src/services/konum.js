const { Op } = require('sequelize');
const { Usta } = require('../models');

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

// Yaxınlıqdakı onlayn ustaları tap (max 20 km, max 10 usta)
async function yaxinUstalarTap(lat, lng, kateqoriya, limitKm = 20) {
  // Bounding box ilə ilkin filtr (performans üçün)
  const latDelta = limitKm / 111;
  const lngDelta = limitKm / (111 * Math.cos((lat * Math.PI) / 180));

  const ustalar = await Usta.findAll({
    where: {
      kateqoriya,
      onlayn: true,
      tesdiqlendi: true,
      aktiv: true,
      lat: { [Op.between]: [lat - latDelta, lat + latDelta] },
      lng: { [Op.between]: [lng - lngDelta, lng + lngDelta] },
    },
    attributes: ['id', 'ad', 'soyad', 'foto', 'orta_reytinq', 'tamamlanan_sifaris', 'lat', 'lng', 'fcm_token'],
  });

  // Dəqiq məsafə hesabla və sırala
  return ustalar
    .map((u) => ({
      ...u.toJSON(),
      məsafe: məsafeHesabla(lat, lng, parseFloat(u.lat), parseFloat(u.lng)),
    }))
    .filter((u) => u.məsafe <= limitKm)
    .sort((a, b) => a.məsafe - b.məsafe)
    .slice(0, 10);
}

module.exports = { yaxinUstalarTap, məsafeHesabla };
