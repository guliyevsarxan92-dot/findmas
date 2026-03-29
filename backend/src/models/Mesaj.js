const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Mesaj = sequelize.define('Mesaj', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sifaris_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  // Göndərən: 'istifadeci' və ya 'usta'
  gonderən_nov: {
    type: DataTypes.ENUM('istifadeci', 'usta'),
    allowNull: false,
  },
  gonderən_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  metn: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Şəkil/fayl göndərmək üçün
  fayl_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  oxundu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'mesajlar',
  timestamps: true,
  createdAt: 'yaradildi',
  updatedAt: false,
  indexes: [
    { fields: ['sifaris_id'] },
  ],
});

module.exports = Mesaj;
