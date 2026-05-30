const express = require('express');
const router = express.Router();
const { Customer, Agent, Lead, KnowledgeBase } = require('../models');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const authenticate = require('../middleware/auth');

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const customerId = req.user.customerId;
    if (!customerId) return res.status(400).json({ message: 'Not a client account' });

    const customer = await Customer.findByPk(customerId, {
      include: [
        { model: Agent, as: 'agents' },
        { model: Lead, as: 'leads' },
        { model: KnowledgeBase, as: 'knowledgeBases' }
      ]
    });

    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (customer.subscriptionStatus === 'Suspended') {
      return res.json({ blocked: true });
    }

    const daysLeft = customer.subscriptionExpiry ? Math.max(0, Math.ceil((new Date(customer.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
    const leadsCount = customer.leads?.length || 0;

    res.json({
      customer,
      stats: {
        daysLeft,
        alertLevel: daysLeft <= 3 ? 'critical' : daysLeft <= 10 ? 'warning' : 'none',
        totalMessages: leadsCount,
        leadsCaptured: leadsCount,
        hoursSaved: leadsCount > 0 ? Math.round(leadsCount * 0.5 * 10) / 10 : 0,
        articlesCount: customer.knowledgeBases?.length || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching client dashboard' });
  }
});

router.get('/settings', authenticate, async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const customer = await Customer.findByPk(customerId, {
      include: [{ model: Agent, as: 'agents' }]
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

router.post('/settings', authenticate, async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const { name, email, password, instanceName, configApiKey, n8nWebhookUrl } = req.body;
    
    await Customer.update({ name, email, password, configApiKey, n8nWebhookUrl }, { where: { whatsAppNumber: customerId } });
    
    if (instanceName) {
      await Agent.update({ instanceName }, { where: { customerId } });
    }
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings' });
  }
});

router.post('/toggle-agent', authenticate, async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const { isActive } = req.query;
    await Agent.update({ isActive: isActive === 'true' }, { where: { customerId } });
    res.json({ isActive: isActive === 'true' });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling agent' });
  }
});

module.exports = router;
