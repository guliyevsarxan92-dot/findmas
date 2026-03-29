const router = require('express').Router();
const { istifadeciAuth, ustaAuth, adminAuth } = require('../middleware/auth');

// Auth
const istifadeciAuthCtrl = require('../controllers/istifadeciAuth');
const ustaAuthCtrl = require('../controllers/ustaAuth');

router.post('/istifadeci/qeydiyyat', istifadeciAuthCtrl.qeydiyyat);
router.post('/istifadeci/giris', istifadeciAuthCtrl.giris);
router.put('/istifadeci/fcm-token', istifadeciAuth, istifadeciAuthCtrl.fcmTokenYenile);
router.get('/istifadeci/profil', istifadeciAuth, istifadeciAuthCtrl.profil);

router.post('/usta/qeydiyyat', ustaAuthCtrl.qeydiyyat);
router.post('/usta/giris', ustaAuthCtrl.giris);
router.put('/usta/onlayn', ustaAuth, ustaAuthCtrl.onlaynDeyis);
router.put('/usta/konum', ustaAuth, ustaAuthCtrl.konumYenile);
router.put('/usta/fcm-token', ustaAuth, ustaAuthCtrl.fcmTokenYenile);
router.get('/usta/profil', ustaAuth, ustaAuthCtrl.profil);

// Sifariş
const sifarisCtrl = require('../controllers/sifaris');

router.post('/sifaris', istifadeciAuth, sifarisCtrl.yeniSifaris);
router.post('/sifaris/:id/qebul', ustaAuth, sifarisCtrl.sifarisQebul);
router.post('/sifaris/:id/status', ustaAuth, sifarisCtrl.statusDeyis);
router.post('/sifaris/:id/odenish', istifadeciAuth, sifarisCtrl.odenish);
router.post('/sifaris/:id/reytinq', istifadeciAuth, sifarisCtrl.reytinqVer);
router.get('/sifaris/aktiv', (req, res, next) => {
  // Həm istifadəçi həm usta çağıra bilər
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ xeta: 'Token yoxdur' });
  const jwt = require('jsonwebtoken');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.nov === 'istifadeci') req.istifadeci = decoded;
  else req.usta = decoded;
  next();
}, sifarisCtrl.aktivSifaris);
router.get('/sifaris/tarixce', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ xeta: 'Token yoxdur' });
  const jwt = require('jsonwebtoken');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.nov === 'istifadeci') req.istifadeci = decoded;
  else req.usta = decoded;
  next();
}, sifarisCtrl.tarixce);

// Mesaj
const mesajCtrl = require('../controllers/mesaj');

router.get('/mesaj/:sifaris_id', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ xeta: 'Token yoxdur' });
  const jwt = require('jsonwebtoken');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.nov === 'istifadeci') req.istifadeci = decoded;
  else req.usta = decoded;
  next();
}, mesajCtrl.mesajlar);

router.post('/mesaj/:sifaris_id', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ xeta: 'Token yoxdur' });
  const jwt = require('jsonwebtoken');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.nov === 'istifadeci') req.istifadeci = decoded;
  else req.usta = decoded;
  next();
}, mesajCtrl.mesajGonder);

// Admin auth
const adminAuthCtrl = require('../controllers/adminAuth');
router.post('/admin/giris', adminAuthCtrl.giris);
router.post('/admin/ilk-qeydiyyat', adminAuthCtrl.ilkQeydiyyat);

// Admin panel
const adminCtrl = require('../controllers/admin');

router.get('/admin/ustalar', adminAuth, adminCtrl.ustalarSiyahi);
router.put('/admin/usta/:id/tesdiql', adminAuth, adminCtrl.ustaTesdiqlə);
router.put('/admin/usta/:id/blokla', adminAuth, adminCtrl.ustaBlokla);
router.get('/admin/statistika', adminAuth, adminCtrl.statistika);
router.get('/admin/sifarisler', adminAuth, adminCtrl.sifarisler);

module.exports = router;
