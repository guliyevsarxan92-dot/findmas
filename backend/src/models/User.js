const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
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
  // cihaz tokeni (FCM push bildiriş üçün)
  fcm_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  aktiv: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'istifadeciler',
  timestamps: true,
  createdAt: 'yaradildi',
  updatedAt: 'yenilendi',
});

module.exports = User;
