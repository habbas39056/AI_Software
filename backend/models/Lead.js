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
  businessName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'BusinessName'
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'PhoneNumber'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'Email'
  },
  service: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'Service'
  },
  dealValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    field: 'DealValue'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'New',
    field: 'Status'
  },
  assignedTo: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'AssignedTo'
  },
  followUpDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'FollowUpDate'
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'City'
  },
  lossReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'LossReason'
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
  messageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'MessageCount'
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

// ── Activity Log ──
const LeadActivity = sequelize.define('LeadActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'Id'
  },
  leadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'LeadId'
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Type'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'Note'
  },
  newFollowUpDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'NewFollowUpDate'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'CreatedAt'
  },
}, {
  tableName: 'LeadActivities',
  timestamps: false,
});

// ── Payment Log ──
const LeadPayment = sequelize.define('LeadPayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'Id'
  },
  leadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'LeadId'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'Amount'
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'Date'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'Note'
  },
}, {
  tableName: 'LeadPayments',
  timestamps: false,
});

Lead.hasMany(LeadActivity, { foreignKey: 'leadId', as: 'activities' });
LeadActivity.belongsTo(Lead, { foreignKey: 'leadId' });

Lead.hasMany(LeadPayment, { foreignKey: 'leadId', as: 'payments' });
LeadPayment.belongsTo(Lead, { foreignKey: 'leadId' });

module.exports = { Lead, LeadActivity, LeadPayment };
