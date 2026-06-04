const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TeamMember = sequelize.define('TeamMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'Id'
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'FullName'
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'CustomerId'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'Username'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'Password'
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'Sales',
    field: 'Role'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'Phone'
  },
  monthlyGoal: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 500000,
    field: 'MonthlyGoal'
  },
  commission: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10,
    field: 'Commission'
  },
  targetBonus: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 10000,
    field: 'TargetBonus'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'IsActive'
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD',
    field: 'Currency'
  },
}, {
  tableName: 'TeamMembers',
  timestamps: false,
});

module.exports = TeamMember;
