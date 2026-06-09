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
  moduleComplains: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'ModuleComplains'
  },
  moduleInstruction: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'ModuleInstruction'
  },
  moduleComplainsFields: {
    type: DataTypes.TEXT,
    field: 'ModuleComplainsFields',
    get() {
      const val = this.getDataValue('moduleComplainsFields');
      return val ? JSON.parse(val) : [];
    },
    set(val) {
      this.setDataValue('moduleComplainsFields', JSON.stringify(val || []));
    }
  },
  moduleInstructionFields: {
    type: DataTypes.TEXT,
    field: 'ModuleInstructionFields',
    get() {
      const val = this.getDataValue('moduleInstructionFields');
      return val ? JSON.parse(val) : [];
    },
    set(val) {
      this.setDataValue('moduleInstructionFields', JSON.stringify(val || []));
    }
  },
  customServices: {
    type: DataTypes.TEXT,
    field: 'CustomServices',
    get() {
      const val = this.getDataValue('customServices');
      return val ? JSON.parse(val) : ['Web Design', 'SEO', 'Social Media', 'Google Ads', 'App Development', 'Branding', 'Consulting', 'Other'];
    },
    set(val) {
      this.setDataValue('customServices', JSON.stringify(val));
    }
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
