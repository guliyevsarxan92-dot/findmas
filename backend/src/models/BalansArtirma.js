const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BalansArtirma = sequelize.define('BalansArtirma', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  usta_id: { type: DataTypes.UUID, allowNull: false },
  // Məbləğ
  məbleg: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  // Qəbz (screenshot base64 və ya URL)
  qebz: { type: DataTypes.TEXT, allowNull: true },
  // Admin tərəfindən göndərilən kart nömrəsi (ödəniş anında)
  kart_nomre: { type: DataTypes.STRING(20), allowNull: true },
  // Status: gozlenir | tesdiq | redd
  status: {
    type: DataTypes.ENUM('gozlenir', 'tesdiq', 'redd'),
    defaultValue: 'gozlenir',
  },
  admin_qeyd: { type: DataTypes.TEXT, allowNull: true },
  tesdiq_tarixi: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'balans_artirmalar',
  timestamps: true,
  createdAt: 'yaradildi',
  updatedAt: 'yenilendi',
});

module.exports = BalansArtirma;
