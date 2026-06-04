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
    allowNull: true,
    field: 'Content'
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'FileUrl'
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'FileType'
  },
}, {
  tableName: 'KnowledgeBases',
  timestamps: false,
});

module.exports = KnowledgeBase;
