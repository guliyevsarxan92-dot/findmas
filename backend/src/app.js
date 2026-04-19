require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

const { sequelize } = require('./models');
const routes = require('./routes');
const fcm = require('./services/fcm');

const app = express();
const server = http.createServer(app);

// WebSocket (Socket.IO)
const io = new Server(server, {
  cors: { origin: '*' },
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api', routes);

app.get('/', (req, res) => res.json({ mesaj: 'Findmas API işləyir' }));

// WebSocket — auth + otaq idarəsi
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Token yoxdur'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userData = decoded;
    next();
  } catch {
    next(new Error('Token etibarsızdır'));
  }
});

io.on('connection', (socket) => {
  const { id, nov } = socket.userData;
  // Hər istifadəçi/usta öz otağına qoşulur
  const otaq = `${nov}_${id}`;
  socket.join(otaq);
  console.log(`[WS] ${nov} ${id} qoşuldu`);

  // Usta real-vaxtda konum göndərə bilər
  socket.on('konum_yenile', async ({ lat, lng }) => {
    if (nov !== 'usta') return;
    const { Usta, Sifaris } = require('./models');
    await Usta.update({ lat, lng, konum_yenilendi: new Date() }, { where: { id } });

    // Aktiv sifariş varsa müştəriyə usta konumunu yayımla
    const aktivSifaris = await Sifaris.findOne({
      where: { usta_id: id, status: ['qebul_edildi', 'yolda', 'baslandi'] },
    }).catch(() => null);
    if (aktivSifaris) {
      io.to(`istifadeci_${aktivSifaris.istifadeci_id}`).emit('usta_konum', { lat, lng });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[WS] ${nov} ${id} ayrıldı`);
  });
});

// Verilənlər bazasına qoşul və serveri başlat
const PORT = process.env.PORT || 3000;

async function miqrasiya() {
  try {
    // ENUM → VARCHAR miqrasiyası
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE ustalar ALTER COLUMN kateqoriya TYPE VARCHAR(255) USING kateqoriya::VARCHAR(255);
      EXCEPTION WHEN others THEN NULL;
      END $$;
    `).catch(() => {});
    await sequelize.query(`DROP TYPE IF EXISTS "enum_ustalar_kateqoriya" CASCADE;`).catch(() => {});

    // Mövcud ustaların kateqoriyalar/aktiv_kateqoriyalar sahələrini doldur
    await sequelize.query(`
      UPDATE ustalar
      SET kateqoriyalar = ARRAY[kateqoriya],
          aktiv_kateqoriyalar = ARRAY[kateqoriya]
      WHERE kateqoriya IS NOT NULL
        AND (kateqoriyalar IS NULL OR kateqoriyalar = '{}');
    `).catch(() => {});
  } catch (err) {
    console.warn('Miqrasiya xəbərdarlığı:', err.message);
  }
}

const syncOptions = process.env.NODE_ENV === 'development' ? { alter: true } : {};
miqrasiya().then(() => sequelize.sync(syncOptions)).then(() => {
  console.log('Verilənlər bazası hazır');
  fcm.init();
  server.listen(PORT, () => console.log(`Server port ${PORT}-də işləyir`));
}).catch((err) => {
  console.error('DB xəta:', err);
  process.exit(1);
});

module.exports = { app, server };
