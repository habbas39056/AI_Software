const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const KnowledgeBase = sequelize.define('KnowledgeBase', {
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
  topic: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Topic'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'Content'
  },
}, {
  tableName: 'KnowledgeBases',
  timestamps: false,
});

module.exports = KnowledgeBase;
