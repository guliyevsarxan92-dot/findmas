const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Sifariş vəziyyət maşını
const STATUSLAR = {
  GOZLENILIR: 'gozlenilir',       // İstifadəçi sifariş verdi, usta axtarılır
  QEBUL_EDILDI: 'qebul_edildi',   // Usta qəbul etdi
  YOLDA: 'yolda',                  // Usta yola düşdü
  BASLANDI: 'baslandi',            // Usta gəldi, iş başladı
  TAMAMLANDI: 'tamamlandi',        // İş bitdi
  ODENDI: 'odendi',                // Ödəniş edildi
  LEGV_EDILDI: 'legv_edildi',      // Ləğv edildi
  REDD_EDILDI: 'redd_edildi',      // Usta rədd etdi / vaxt keçdi
};

const Sifaris = sequelize.define('Sifaris', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Əlaqə
  istifadeci_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  usta_id: {
    type: DataTypes.UUID,
    allowNull: true, // qəbul edilənə qədər null
  },
  // Problem
  kateqoriya: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  problem_tesvirr: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  problem_foto: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  // Ünvan
  unvan_metn: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  unvan_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  unvan_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  // Status
  status: {
    type: DataTypes.ENUM(...Object.values(STATUSLAR)),
    defaultValue: STATUSLAR.GOZLENILIR,
  },
  // Vaxt damgaları
  qebul_tarixi: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  gəliş_tarixi: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  baslama_tarixi: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  tamamlama_tarixi: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Ödəniş
  odenis_usulu: {
    type: DataTypes.ENUM('nagd', 'kart', 'balans'),
    allowNull: true,
  },
  məbleg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  odenis_tarixi: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Reytinq (istifadəçi ustaya verir)
  reytinq: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 },
  },
  reytinq_yorum: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Ləğv səbəbi
  legv_sebeb: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'sifarisler',
  timestamps: true,
  createdAt: 'yaradildi',
  updatedAt: 'yenilendi',
  indexes: [
    { fields: ['istifadeci_id'] },
    { fields: ['usta_id'] },
    { fields: ['status'] },
    { fields: ['kateqoriya'] },
  ],
});

Sifaris.STATUSLAR = STATUSLAR;

module.exports = Sifaris;
