const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Xidmet = sequelize.define('Xidmet', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  key: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  ad: { type: DataTypes.STRING(100), allowNull: false },
  altbaslik: { type: DataTypes.STRING(200), allowNull: true },
  ikon: { type: DataTypes.STRING(60), allowNull: false },
  ikon_lib: { type: DataTypes.STRING(30), defaultValue: 'Ionicons' },
  rang: { type: DataTypes.STRING(10), defaultValue: '#6366F1' },
  qiymet_min: { type: DataTypes.INTEGER, defaultValue: 5 },
  qiymet_max: { type: DataTypes.INTEGER, defaultValue: 50 },
  qiymet: { type: DataTypes.INTEGER, defaultValue: 0 },
  aktiv: { type: DataTypes.BOOLEAN, defaultValue: true },
  sira: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'xidmetler',
  timestamps: true,
  createdAt: 'yaradildi',
  updatedAt: 'yenilendi',
});

module.exports = Xidmet;
