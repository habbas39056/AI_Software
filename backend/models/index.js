const sequelize = require('../config/db');
const Customer = require('./Customer');
const Agent = require('./Agent');
const Lead = require('./Lead');
const KnowledgeBase = require('./KnowledgeBase');

// Associations
Customer.hasMany(Agent, { foreignKey: 'customerId', as: 'agents' });
Agent.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(Lead, { foreignKey: 'customerId', as: 'leads' });
Lead.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(KnowledgeBase, { foreignKey: 'customerId', as: 'knowledgeBases' });
KnowledgeBase.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

module.exports = {
  sequelize,
  Customer,
  Agent,
  Lead,
  KnowledgeBase,
};
