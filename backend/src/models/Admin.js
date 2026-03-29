const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ad: { type: DataTypes.STRING(100), allowNull: false },
  telefon: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  sifre_hash: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'adminler',
  timestamps: true,
  createdAt: 'yaradildi',
  updatedAt: false,
});

module.exports = Admin;
