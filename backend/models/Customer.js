const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Customer = sequelize.define('Customer', {
  whatsAppNumber: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    field: 'WhatsAppNumber'
  },
  name: {
    type: DataTypes.STRING,
    field: 'Name'
  },
  email: {
    type: DataTypes.STRING,
    field: 'Email'
  },
  address: {
    type: DataTypes.STRING,
    field: 'Address'
  },
  businessEntity: {
    type: DataTypes.STRING,
    field: 'BusinessEntity'
  },
  password: {
    type: DataTypes.STRING,
    field: 'Password'
  },
  instanceName: {
    type: DataTypes.STRING,
    field: 'InstanceName'
  },
  n8nWebhookUrl: {
    type: DataTypes.STRING,
    field: 'N8nWebhookUrl'
  },
  profileImage: {
    type: DataTypes.STRING,
    field: 'ProfileImage'
  },
  subscriptionStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
    field: 'SubscriptionStatus'
  },
  subscriptionExpiry: {
    type: DataTypes.DATE,
    field: 'SubscriptionExpiry'
  },
  subscriptionDays: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    field: 'SubscriptionDays'
  },
  monthlyFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 14000,
    field: 'MonthlyFee'
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD',
    field: 'Currency'
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'CreatedAt',
  },
}, {
  tableName: 'Customers',
  timestamps: true,
  updatedAt: false,
});

module.exports = Customer;
