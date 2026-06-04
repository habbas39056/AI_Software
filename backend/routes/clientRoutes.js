const express = require('express');
const router = express.Router();
const { Customer, Agent, Lead, KnowledgeBase, TeamMember, LeadPayment } = require('../models');
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
        { 
          model: Lead, 
          as: 'leads',
          include: [{ model: LeadPayment, as: 'payments' }]
        },
        { model: KnowledgeBase, as: 'knowledgeBases' }
      ]
    });

    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (customer.subscriptionStatus === 'Suspended') {
      return res.json({ blocked: true });
    }

    // Filter leads for TeamMember
    let dashboardLeads = customer.leads || [];
    if (req.user.role === 'TeamMember') {
      dashboardLeads = dashboardLeads.filter(l => l.assignedTo === req.user.username || l.assignedTo === req.user.name);
    }
    
    // Calculate Monthly Goal Progress
    let monthlyGoal = 0;
    let receivedAmount = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (req.user.role === 'TeamMember') {
      const member = await TeamMember.findOne({ where: { username: req.user.username } });
      monthlyGoal = member ? parseFloat(member.monthlyGoal) || 0 : 0;
    } else {
      const members = await TeamMember.findAll({ where: { customerId } });
      monthlyGoal = members.reduce((sum, m) => sum + (parseFloat(m.monthlyGoal) || 0), 0);
    }

    dashboardLeads.forEach(lead => {
      (lead.payments || []).forEach(payment => {
        const pDate = new Date(payment.date);
        if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
          receivedAmount += parseFloat(payment.amount) || 0;
        }
      });
    });

    const daysLeft = customer.subscriptionExpiry ? Math.max(0, Math.ceil((new Date(customer.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
    
    const uniquePhoneNumbers = new Set(dashboardLeads.map(l => l.phoneNumber).filter(Boolean));
    const leadsWithNoPhone = dashboardLeads.filter(l => !l.phoneNumber).length;
    const leadsCount = uniquePhoneNumbers.size + leadsWithNoPhone;

    const totalDealValue = dashboardLeads.reduce((sum, l) => sum + (parseFloat(l.dealValue) || 0), 0);
    const followUpsCount = dashboardLeads.filter(l => l.followUpDate).length;

    // Remove payments from leads object to avoid sending huge payload if not needed
    const cleanLeads = dashboardLeads.map(l => {
      const { payments, ...rest } = l.toJSON();
      return rest;
    });

    res.json({
      role: req.user.role,
      customer: { ...customer.toJSON(), leads: cleanLeads },
      stats: {
        daysLeft,
        alertLevel: daysLeft <= 3 ? 'critical' : daysLeft <= 10 ? 'warning' : 'none',
        totalMessages: leadsCount,
        leadsCaptured: leadsCount,
        totalDealValue,
        followUpsCount,
        monthlyGoal,
        receivedAmount
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

    let userCurrency = customer.currency;
    if (req.user.role === 'TeamMember') {
      const tm = await TeamMember.findOne({ where: { username: req.user.username } });
      if (tm && tm.currency) {
        userCurrency = tm.currency;
      }
    }

    const responseData = customer.toJSON();
    responseData.currency = userCurrency;

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

router.put('/settings', authenticate, async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const { name, email, password, configApiKey, n8nWebhookUrl, instanceName, currency, scheduleEnabled, scheduleStartTime, scheduleEndTime, timezone } = req.body;
    
    if (req.user.role === 'TeamMember') {
      await TeamMember.update({ currency }, { where: { username: req.user.username } });
    } else {
      await Customer.update({ name, email, password, configApiKey, n8nWebhookUrl, currency }, { where: { whatsAppNumber: customerId } });
    }
    
    const agentUpdatePayload = {};
    if (instanceName !== undefined) agentUpdatePayload.instanceName = instanceName;
    if (scheduleEnabled !== undefined) agentUpdatePayload.scheduleEnabled = scheduleEnabled;
    if (scheduleStartTime !== undefined) agentUpdatePayload.scheduleStartTime = scheduleStartTime;
    if (scheduleEndTime !== undefined) agentUpdatePayload.scheduleEndTime = scheduleEndTime;
    if (timezone !== undefined) agentUpdatePayload.timezone = timezone;

    if (Object.keys(agentUpdatePayload).length > 0) {
      await Agent.update(agentUpdatePayload, { where: { customerId } });
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
