const { Customer, Agent, Lead, KnowledgeBase } = require('../models');
const { Op } = require('sequelize');

exports.getDashboardData = async (req, res) => {
  console.log('Fetching dashboard data for admin...');
  try {
    const totalAgents = await Agent.count();
    const activeAgentsCount = await Agent.count({ where: { isActive: true } });
    const customersCount = await Customer.count();
    const activeCustomers = await Customer.findAll({
      where: { subscriptionStatus: 'Active' },
      include: [{ model: Agent, as: 'agents' }]
    });

    const totalRevenue = activeCustomers.reduce((sum, c) => sum + parseFloat(c.monthlyFee || 0), 0);

    const recentCustomers = await Customer.findAll({
      limit: 5,
      include: [{ model: Agent, as: 'agents' }]
    });

    res.json({
      stats: {
        totalClients: customersCount,
        activeAgents: activeAgentsCount,
        totalAgents: totalAgents,
        estimatedRevenue: totalRevenue
      },
      customers: recentCustomers
    });
  } catch (error) {
    console.error('CRITICAL ERROR IN DASHBOARD:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      include: [
        { model: Agent, as: 'agents' },
        { model: Lead, as: 'leads' }
      ]
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers' });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const data = req.body;
    const exists = await Customer.findByPk(data.whatsAppNumber);
    if (exists) return res.status(400).json({ message: 'Customer already exists' });

    const subscriptionDays = data.subscriptionDays || 30;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + subscriptionDays);

    const customer = await Customer.create({
      ...data,
      subscriptionExpiry: expiry,
      subscriptionStatus: 'Active'
    });

    // Create default agent
    await Agent.create({
      customerId: customer.whatsAppNumber,
      instanceName: data.instanceName || `bot_${customer.whatsAppNumber}`,
      isActive: true,
      status: 'pending'
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('FAILED TO CREATE CUSTOMER:', error);
    res.status(500).json({ message: error.message || 'Error creating customer' });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const customer = await Customer.findByPk(id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    await customer.update(data);
    res.json(customer);
  } catch (error) {
    console.error('FAILED TO UPDATE CUSTOMER:', error);
    res.status(500).json({ message: error.message || 'Error updating customer' });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await Customer.destroy({ where: { whatsAppNumber: id } });
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting customer' });
  }
};

exports.toggleSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    await Customer.update({ subscriptionStatus: status }, { where: { whatsAppNumber: id } });
    
    if (status === 'Suspended') {
      await Agent.update({ isActive: false }, { where: { customerId: id } });
    }
    
    res.json({ status });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling subscription' });
  }
};
exports.getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id, {
      include: [
        { model: Agent, as: 'agents' },
        { model: Lead, as: 'leads' },
        { model: KnowledgeBase, as: 'knowledgeBases' }
      ]
    });
    
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    
    const daysLeft = customer.subscriptionExpiry ? Math.max(0, Math.ceil((new Date(customer.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
    
    res.json({
      customer,
      daysLeft
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer details' });
  }
};

exports.renewSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;
    
    const customer = await Customer.findByPk(id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    
    // Reset expiry to exactly 'days' from NOW
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + parseInt(days));
    
    await Customer.update({ 
      subscriptionExpiry: newExpiry,
      subscriptionStatus: 'Active',
      subscriptionDays: days 
    }, { where: { whatsAppNumber: id } });
    
    res.json({ message: 'Subscription renewed', newExpiry });
  } catch (error) {
    res.status(500).json({ message: 'Error renewing subscription' });
  }
};
