const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'Id'
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'CustomerId'
  },
  name: {
    type: DataTypes.STRING,
    field: 'Name'
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'PhoneNumber'
  },
  summary: {
    type: DataTypes.TEXT,
    field: 'Summary'
  },
  score: {
    type: DataTypes.STRING,
    defaultValue: 'General Inquiry',
    field: 'Score'
  },
  isPaused: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'IsPaused'
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'LastMessageAt'
  },
}, {
  tableName: 'Leads',
  timestamps: false,
});

module.exports = Lead;
