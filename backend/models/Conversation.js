const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Conversation = sequelize.define('Conversation', {
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
    allowNull: false,
    field: 'InstanceName'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'Message'
  },
  instanceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'InstanceNumber'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'CreatedAt'
  }
}, {
  tableName: 'Conversations',
  timestamps: false,
});

module.exports = Conversation;
