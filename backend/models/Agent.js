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
  scheduleEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'ScheduleEnabled'
  },
  scheduleStartTime: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ScheduleStartTime'
  },
  scheduleEndTime: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ScheduleEndTime'
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC',
    field: 'Timezone'
  },
  instagramAccessToken: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'InstagramAccessToken'
  },
  instagramAccountId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'InstagramAccountId'
  },
  facebookAccessToken: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'FacebookAccessToken'
  },
  facebookPageId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'FacebookPageId'
  },
}, {
  tableName: 'Agents',
  timestamps: false,
});

module.exports = Agent;
