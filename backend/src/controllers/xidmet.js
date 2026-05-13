const { Xidmet } = require('../models');

// ── Azərbaycan hərflərini ASCII-ə çevir + təmizlə ─────────────────────────
function slugify(s) {
  if (!s) return '';
  const map = { 'ə':'e','Ə':'e','ş':'s','Ş':'s','ç':'c','Ç':'c','ğ':'g','Ğ':'g',
                'ı':'i','İ':'i','I':'i','ü':'u','Ü':'u','ö':'o','Ö':'o' };
  return String(s)
    .split('').map(ch => map[ch] ?? ch).join('')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')     // yalnız ASCII hərf, rəqəm, _
    .replace(/_+/g, '_')             // ardıcıl _-ləri bir et
    .replace(/^_|_$/g, '');          // başdakı/sondakı _ sil
}

// İcazə verilən field-lər (təhlükəsizlik üçün whitelist)
const ICAZELI = ['key','ad','altbaslik','ikon','ikon_lib','rang','qiymet','qiymet_min','qiymet_max','sira','aktiv','alt_xidmetler'];

function temizle(body) {
  const o = {};
  for (const k of ICAZELI) if (body[k] !== undefined) o[k] = body[k];
  return o;
}

// GET /api/xidmetler — hamı üçün açıq; ?hamisi=1 ilə admin hamısını görür
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
    const data = temizle(req.body);

    // Ad məcburidir
    if (!data.ad || !String(data.ad).trim()) {
      return res.status(400).json({ xeta: 'Xidmət adı boş ola bilməz' });
    }
    data.ad = String(data.ad).trim();

    // Key avtomatik və ya verilən key-i normalize et
    data.key = slugify(data.key || data.ad);
    if (!data.key) {
      return res.status(400).json({ xeta: 'Key yaradıla bilmədi (yalnız hərf/rəqəm istifadə edin)' });
    }

    // Dublikat key yoxla
    const movcud = await Xidmet.findOne({ where: { key: data.key } });
    if (movcud) {
      return res.status(400).json({ xeta: `Bu key artıq mövcuddur: ${data.key}` });
    }

    // Default-lar
    if (data.aktiv === undefined) data.aktiv = true;
    if (data.ikon === undefined) data.ikon = 'construct-outline';
    if (data.ikon_lib === undefined) data.ikon_lib = 'Ionicons';

    const x = await Xidmet.create(data);
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

    const data = temizle(req.body);

    // Key dəyişdirilirsə, normalize et və dublikat yoxla
    if (data.key !== undefined) {
      data.key = slugify(data.key);
      if (!data.key) {
        return res.status(400).json({ xeta: 'Düzgün key daxil edin' });
      }
      if (data.key !== x.key) {
        const movcud = await Xidmet.findOne({ where: { key: data.key } });
        if (movcud) {
          return res.status(400).json({ xeta: `Bu key artıq mövcuddur: ${data.key}` });
        }
      }
    }

    if (data.ad !== undefined) data.ad = String(data.ad).trim();
    if (data.ad === '') return res.status(400).json({ xeta: 'Ad boş ola bilməz' });

    await x.update(data);
    res.json(x);
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

// DELETE /api/admin/xidmet/:id
async function sil(req, res) {
  try {
    await Xidmet.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ xeta: err.message });
  }
}

module.exports = { siyahi, yarat, yenile, sil, slugify };
