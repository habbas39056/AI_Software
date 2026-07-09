const sequelize = require('../config/db');
const Customer = require('./Customer');
const Agent = require('./Agent');
const { Lead, LeadActivity, LeadPayment } = require('./Lead');
const KnowledgeBase = require('./KnowledgeBase');
const TeamMember = require('./TeamMember');
const Instruction = require('./Instruction');
const ExternalComplaint = require('./ExternalComplaint');
const ExternalInstruction = require('./ExternalInstruction');
const Conversation = require('./Conversation');

// Associations
Customer.hasMany(Agent, { foreignKey: 'customerId', as: 'agents' });
Agent.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(Lead, { foreignKey: 'customerId', as: 'leads' });
Lead.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(KnowledgeBase, { foreignKey: 'customerId', as: 'knowledgeBases' });
KnowledgeBase.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(TeamMember, { foreignKey: 'customerId', as: 'teamMembers' });
TeamMember.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(Instruction, { foreignKey: 'customerId', as: 'instructions' });
Instruction.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(ExternalComplaint, { foreignKey: 'customerId', as: 'externalComplaints' });
ExternalComplaint.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(ExternalInstruction, { foreignKey: 'customerId', as: 'externalInstructions' });
ExternalInstruction.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(Conversation, { foreignKey: 'customerId', as: 'conversations' });
Conversation.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

module.exports = {
  sequelize,
  Customer,
  Agent,
  Lead,
  LeadActivity,
  LeadPayment,
  KnowledgeBase,
  TeamMember,
  Instruction,
  ExternalComplaint,
  ExternalInstruction,
  Conversation,
};
