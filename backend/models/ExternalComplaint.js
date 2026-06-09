const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ExternalComplaint = sequelize.define('ExternalComplaint', {
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
  installationAddress: {
    type: DataTypes.TEXT,
  },
  natureOfComplaint: {
    type: DataTypes.TEXT,
  },
  issueContinuous: {
    type: DataTypes.STRING,
  },
  restartedRouter: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'ExternalComplaints',
  timestamps: true,
});

module.exports = ExternalComplaint;
