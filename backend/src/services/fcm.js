const admin = require('firebase-admin');

let initialized = false;

function init() {
  if (initialized) return;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return;

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  initialized = true;
}

// Tək cihaza bildiriş
async function bildirisSend(fcmToken, baslik, metn, data = {}) {
  if (!initialized) return;
  if (!fcmToken) return;

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title: baslik, body: metn },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
  } catch (err) {
    console.error('FCM xəta:', err.message);
  }
}

// Yeni sifariş — ustaya
async function yeniSifarisbildiris(usta, sifaris) {
  await bildirisSend(
    usta.fcm_token,
    'Yeni sifariş!',
    `${sifaris.kateqoriya} — ${sifaris.unvan_metn}`,
    { nov: 'yeni_sifaris', sifaris_id: sifaris.id }
  );
}

// Usta qəbul etdi — istifadəçiyə
async function ustaQebulbildiris(istifadeci, usta) {
  await bildirisSend(
    istifadeci.fcm_token,
    'Usta tapıldı!',
    `${usta.ad} ${usta.soyad} sifarişinizi qəbul etdi`,
    { nov: 'usta_qebul' }
  );
}

// Usta yolda — istifadəçiyə
async function ustaYoldaBildiris(istifadeci, usta) {
  await bildirisSend(
    istifadeci.fcm_token,
    'Usta yoldadır',
    `${usta.ad} sizə tərəf hərəkət edir`,
    { nov: 'usta_yolda' }
  );
}

module.exports = { init, yeniSifarisbildiris, ustaQebulbildiris, ustaYoldaBildiris };
