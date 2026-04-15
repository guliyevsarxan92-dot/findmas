const sequelize = require('../config/database');
const User = require('./User');
const Usta = require('./Usta');
const Sifaris = require('./Sifaris');
const Mesaj = require('./Mesaj');
const Admin = require('./Admin');
const BalansArtirma = require('./BalansArtirma');
const Xidmet = require('./Xidmet');

// Əlaqələr
User.hasMany(Sifaris, { foreignKey: 'istifadeci_id', as: 'sifarisler' });
Sifaris.belongsTo(User, { foreignKey: 'istifadeci_id', as: 'istifadeci' });

Usta.hasMany(Sifaris, { foreignKey: 'usta_id', as: 'sifarisler' });
Sifaris.belongsTo(Usta, { foreignKey: 'usta_id', as: 'usta' });

Sifaris.hasMany(Mesaj, { foreignKey: 'sifaris_id', as: 'mesajlar' });
Mesaj.belongsTo(Sifaris, { foreignKey: 'sifaris_id', as: 'sifaris' });

Usta.hasMany(BalansArtirma, { foreignKey: 'usta_id', as: 'balans_artirmalar' });
BalansArtirma.belongsTo(Usta, { foreignKey: 'usta_id', as: 'usta' });

module.exports = { sequelize, User, Usta, Sifaris, Mesaj, Admin, BalansArtirma, Xidmet };
