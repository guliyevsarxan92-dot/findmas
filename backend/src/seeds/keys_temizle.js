// node src/seeds/keys_temizle.js
// Mövcud xidmət key-lərini ASCII-ə çevirir və ustalardakı kateqoriyalar array-ini də yeniləyir.
// Bu script BİR DƏFƏ işlədilir, ondan sonra yeni Admin paneli artıq düz key yaradacaq.

require('dotenv').config();
const { sequelize, Xidmet, Usta } = require('../models');

function slugify(s) {
  if (!s) return '';
  const map = { 'ə':'e','Ə':'e','ş':'s','Ş':'s','ç':'c','Ç':'c','ğ':'g','Ğ':'g',
                'ı':'i','İ':'i','I':'i','ü':'u','Ü':'u','ö':'o','Ö':'o' };
  return String(s).split('').map(ch => map[ch] ?? ch).join('')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

async function run() {
  await sequelize.authenticate();
  console.log('✓ DB bağlantısı uğurlu\n');

  const xidmetler = await Xidmet.findAll();
  const dəyişən = {}; // köhnə_key -> yeni_key

  for (const x of xidmetler) {
    const yeni = slugify(x.key);
    if (!yeni) {
      console.log(`⚠  ${x.ad}: key boş çıxdı, atlanır`);
      continue;
    }
    if (yeni !== x.key) {
      // Dublikat varmı?
      const dublikat = await Xidmet.findOne({ where: { key: yeni } });
      if (dublikat && dublikat.id !== x.id) {
        console.log(`⚠  ${x.ad}: "${x.key}" → "${yeni}" çevriləcəkdi, AMMA artıq mövcuddur. Atlanır.`);
        continue;
      }
      dəyişən[x.key] = yeni;
      await x.update({ key: yeni });
      console.log(`✓ ${x.ad}: "${x.key}" → "${yeni}"`);
    }
  }

  if (Object.keys(dəyişən).length === 0) {
    console.log('\nDəyişiklik yoxdur. Bütün key-lər artıq ASCII formatdadır.');
    process.exit(0);
  }

  console.log(`\n${Object.keys(dəyişən).length} xidmət key-i yeniləndi. İndi ustaların kateqoriyalarını da yeniləyirik...\n`);

  // Bütün ustaları yenilə
  const ustalar = await Usta.findAll();
  let yenilenenUsta = 0;
  for (const u of ustalar) {
    let dəyişdi = false;
    const yeniKat = (u.kateqoriyalar || []).map(k => dəyişən[k] || k);
    const yeniAktiv = (u.aktiv_kateqoriyalar || []).map(k => dəyişən[k] || k);
    const yeniKohne = dəyişən[u.kateqoriya] || u.kateqoriya;

    if (JSON.stringify(yeniKat) !== JSON.stringify(u.kateqoriyalar)) dəyişdi = true;
    if (JSON.stringify(yeniAktiv) !== JSON.stringify(u.aktiv_kateqoriyalar)) dəyişdi = true;
    if (yeniKohne !== u.kateqoriya) dəyişdi = true;

    if (dəyişdi) {
      await u.update({
        kateqoriyalar: yeniKat,
        aktiv_kateqoriyalar: yeniAktiv,
        kateqoriya: yeniKohne,
      });
      yenilenenUsta++;
      console.log(`  ✓ ${u.ad} ${u.soyad}`);
    }
  }

  console.log(`\nBitdi. ${yenilenenUsta} usta yeniləndi.`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
