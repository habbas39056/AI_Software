const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Agent = sequelize.define('Agent', {
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
  instanceName: {
    type: DataTypes.STRING,
    field: 'InstanceName'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'IsActive'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'offline',
    field: 'Status'
  },
}, {
  tableName: 'Agents',
  timestamps: false,
});

module.exports = Agent;
