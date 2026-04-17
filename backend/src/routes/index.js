const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { istifadeciAuth, ustaAuth, adminAuth } = require('../middleware/auth');

// Həm istifadəçi həm usta çağıra biləcəyi routlar üçün auth
function ikiliAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ xeta: 'Token yoxdur' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.nov === 'istifadeci') req.istifadeci = decoded;
    else req.usta = decoded;
    next();
  } catch {
    res.status(401).json({ xeta: 'Token etibarsızdır' });
  }
}

// Auth
const istifadeciAuthCtrl = require('../controllers/istifadeciAuth');
const ustaAuthCtrl = require('../controllers/ustaAuth');

router.post('/istifadeci/qeydiyyat', istifadeciAuthCtrl.qeydiyyat);
router.post('/istifadeci/giris', istifadeciAuthCtrl.giris);
router.put('/istifadeci/fcm-token', istifadeciAuth, istifadeciAuthCtrl.fcmTokenYenile);
router.get('/istifadeci/profil', istifadeciAuth, istifadeciAuthCtrl.profil);
router.put('/istifadeci/profil', istifadeciAuth, istifadeciAuthCtrl.profilYenile);
router.put('/istifadeci/profil-foto', istifadeciAuth, istifadeciAuthCtrl.profilFotoYenile);

router.post('/usta/qeydiyyat', ustaAuthCtrl.qeydiyyat);
router.post('/usta/giris', ustaAuthCtrl.giris);
router.put('/usta/onlayn', ustaAuth, ustaAuthCtrl.onlaynDeyis);
router.put('/usta/konum', ustaAuth, ustaAuthCtrl.konumYenile);
router.put('/usta/fcm-token', ustaAuth, ustaAuthCtrl.fcmTokenYenile);
router.get('/usta/profil', ustaAuth, ustaAuthCtrl.profil);
router.put('/usta/profil-foto', ustaAuth, ustaAuthCtrl.profilFotoYenile);
router.put('/usta/senedler', ustaAuth, ustaAuthCtrl.senedlerYenile);

// Sifariş
const sifarisCtrl = require('../controllers/sifaris');

router.post('/sifaris', istifadeciAuth, sifarisCtrl.yeniSifaris);
router.post('/sifaris/:id/qebul', ustaAuth, sifarisCtrl.sifarisQebul);
router.post('/sifaris/:id/redd', ustaAuth, sifarisCtrl.sifarisRedd);
router.post('/sifaris/:id/usta-legv', ustaAuth, sifarisCtrl.ustaLegvEt);
router.post('/sifaris/:id/status', ustaAuth, sifarisCtrl.statusDeyis);
router.post('/sifaris/:id/legv', istifadeciAuth, sifarisCtrl.legvEt);
router.post('/sifaris/:id/odenish', istifadeciAuth, sifarisCtrl.odenish);
router.post('/sifaris/:id/reytinq', istifadeciAuth, sifarisCtrl.reytinqVer);
router.get('/sifaris/aktiv', ikiliAuth, sifarisCtrl.aktivSifaris);
router.get('/sifaris/tarixce', ikiliAuth, sifarisCtrl.tarixce);
router.get('/usta/qazanc', ustaAuth, sifarisCtrl.ustaQazanc);
router.get('/istifadeci/statistika', istifadeciAuth, sifarisCtrl.istifadeciStatistika);

// Mesaj
const mesajCtrl = require('../controllers/mesaj');

router.get('/mesaj/:sifaris_id', ikiliAuth, mesajCtrl.mesajlar);
router.post('/mesaj/:sifaris_id', ikiliAuth, mesajCtrl.mesajGonder);

// Xidmətlər (hamı üçün açıq)
const xidmetCtrl = require('../controllers/xidmet');
router.get('/xidmetler', xidmetCtrl.siyahi);

// Balans (usta)
const balansCtrl = require('../controllers/balans');
router.get('/usta/balans-kart', ustaAuth, balansCtrl.aktifKart);
router.post('/usta/balans-artir', ustaAuth, balansCtrl.balansArtirSorgu);
router.get('/usta/balans-tarixce', ustaAuth, balansCtrl.balasTarixce);

// Admin auth
const adminAuthCtrl = require('../controllers/adminAuth');
router.post('/admin/giris', adminAuthCtrl.giris);
router.post('/admin/ilk-qeydiyyat', adminAuthCtrl.ilkQeydiyyat);

// Admin panel
const adminCtrl = require('../controllers/admin');

router.get('/admin/ustalar', adminAuth, adminCtrl.ustalarSiyahi);
// Admin — Balans
router.get('/admin/balans-sorqular', adminAuth, balansCtrl.adminSorqular);
router.put('/admin/balans-sorgu/:id/tesdiq', adminAuth, balansCtrl.adminTesdiq);
router.put('/admin/balans-sorgu/:id/redd', adminAuth, balansCtrl.adminRedd);
router.get('/admin/balans-kart', adminAuth, balansCtrl.adminKartAl);
router.put('/admin/balans-kart', adminAuth, balansCtrl.adminKartYenile);
// Admin — Xidmətlər
router.post('/admin/xidmet', adminAuth, xidmetCtrl.yarat);
router.put('/admin/xidmet/:id', adminAuth, xidmetCtrl.yenile);
router.delete('/admin/xidmet/:id', adminAuth, xidmetCtrl.sil);
router.put('/admin/usta/:id/tesdiql', adminAuth, adminCtrl.ustaTesdiqlə);
router.put('/admin/usta/:id/blokla', adminAuth, adminCtrl.ustaBlokla);
router.put('/admin/usta/:id/blok-ac', adminAuth, adminCtrl.ustaBlokAc);
router.get('/admin/statistika', adminAuth, adminCtrl.statistika);
router.get('/admin/sifarisler', adminAuth, adminCtrl.sifarisler);

module.exports = router;
