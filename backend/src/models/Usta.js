const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Usta kateqoriyaları
const KATEQORIYALAR = [
  'santexnik',
  'elektrik',
  'qaynaqci',
  'duluscu',     // tikinti / gips
  'boyaqci',
  'ustav',       // mebel, taxta işləri
  'kondisioner',
  'temizlik',
  'diger',
];

const Usta = sequelize.define('Usta', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ad: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  soyad: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  telefon: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: true,
    unique: true,
  },
  sifre_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // İxtisas
  kateqoriya: {
    type: DataTypes.ENUM(...KATEQORIYALAR),
    allowNull: false,
  },
  // Sənədlər
  seriyyat_foto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ixtisas_sened: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Admin tərəfindən təsdiq
  tesdiqlendi: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  tesdiqleme_tarixi: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Real-vaxt konum (PostgreSQL POINT əvəzinə sadə lat/lng)
  lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  konum_yenilendi: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Onlayn/Offline
  onlayn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // FCM push token
  fcm_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Statistika
  umuml_qazanc: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  tamamlanan_sifaris: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  orta_reytinq: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
  },
  aktiv: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'ustalar',
  timestamps: true,
  createdAt: 'yaradildi',
  updatedAt: 'yenilendi',
});

Usta.KATEQORIYALAR = KATEQORIYALAR;

module.exports = Usta;
