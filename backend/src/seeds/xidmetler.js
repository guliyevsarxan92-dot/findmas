// node src/seeds/xidmetler.js
// Default xidmətləri veritabanına əlavə edir

require('dotenv').config();
const { sequelize, Xidmet } = require('../models');

const XIDMETLER = [
  { key: 'santexnik', ad: 'Santexnik',    altbaslik: 'Kran, boru, qaz',        ikon: 'pipe-wrench',          ikon_lib: 'MaterialCommunityIcons', rang: '#3B82F6', qiymet_min: 5,  qiymet_max: 30,  sira: 1 },
  { key: 'elektrik',  ad: 'Elektrik',     altbaslik: 'Elektrik xidmətləri',    ikon: 'flash-outline',         ikon_lib: 'Ionicons',               rang: '#F59E0B', qiymet_min: 10, qiymet_max: 50,  sira: 2 },
  { key: 'qaynaqci',  ad: 'Qaynaqçı',     altbaslik: 'Metal qaynaq işləri',    ikon: 'flame-outline',         ikon_lib: 'Ionicons',               rang: '#EF4444', qiymet_min: 15, qiymet_max: 40,  sira: 3 },
  { key: 'duluscu',   ad: 'Tikinti',      altbaslik: 'Tikinti işləri',         ikon: 'construct-outline',     ikon_lib: 'Ionicons',               rang: '#8B5CF6', qiymet_min: 10, qiymet_max: 60,  sira: 4 },
  { key: 'boyaqci',   ad: 'Rəssam',       altbaslik: 'Boyaq, sıvaq',           ikon: 'color-palette-outline', ikon_lib: 'Ionicons',               rang: '#EC4899', qiymet_min: 15, qiymet_max: 50,  sira: 5 },
  { key: 'ustav',     ad: 'Ustav',        altbaslik: 'Sıvaq, beton işi',       ikon: 'hammer-outline',        ikon_lib: 'Ionicons',               rang: '#F97316', qiymet_min: 10, qiymet_max: 40,  sira: 6 },
  { key: 'kondisioner', ad: 'Kondisioner', altbaslik: 'Quraşdırma, təmir',     ikon: 'snow-outline',          ikon_lib: 'Ionicons',               rang: '#06B6D4', qiymet_min: 20, qiymet_max: 80,  sira: 7 },
  { key: 'temizlik',  ad: 'Təmizlik',     altbaslik: 'Ev, ofis təmizliyi',     ikon: 'sparkles-outline',      ikon_lib: 'Ionicons',               rang: '#10B981', qiymet_min: 15, qiymet_max: 60,  sira: 8 },
  { key: 'diger',     ad: 'Digər',        altbaslik: 'Digər xidmətlər',        ikon: 'options-outline',       ikon_lib: 'Ionicons',               rang: '#6B7280', qiymet_min: 5,  qiymet_max: null, sira: 9 },
];

async function seed() {
  await sequelize.authenticate();
  let added = 0;
  for (const x of XIDMETLER) {
    const existing = await Xidmet.findOne({ where: { key: x.key } });
    if (!existing) {
      await Xidmet.create({ ...x, aktiv: true });
      added++;
      console.log(`  ✓ ${x.ad}`);
    } else {
      console.log(`  – ${x.ad} artıq mövcuddur`);
    }
  }
  console.log(`\nBitdi: ${added} yeni xidmət əlavə edildi.`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
