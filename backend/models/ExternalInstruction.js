const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ExternalInstruction = sequelize.define('ExternalInstruction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fullName: {
    type: DataTypes.STRING,
  },
  phoneNumber: {
    type: DataTypes.STRING,
  },
  emailAddress: {
    type: DataTypes.STRING,
  },
  installationAddress: {
    type: DataTypes.TEXT,
  },
  nearestLandmark: {
    type: DataTypes.STRING,
  },
  purposeOfUsage: {
    type: DataTypes.STRING,
  },
  ownsWifiDevice: {
    type: DataTypes.STRING,
  },
  wifiCoverageRequired: {
    type: DataTypes.STRING,
  },
  connectionType: {
    type: DataTypes.STRING,
  },
  expectedUsers: {
    type: DataTypes.STRING,
  },
  installationTimeline: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'ExternalInstructions',
  timestamps: true,
});

module.exports = ExternalInstruction;
