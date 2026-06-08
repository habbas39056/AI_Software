const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Instruction = sequelize.define('Instruction', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Title'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'Content'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'CreatedAt'
  }
}, {
  tableName: 'Instructions',
  timestamps: false,
});

module.exports = Instruction;
