const express = require('express');
const router = express.Router();
const { TeamMember, Lead, LeadPayment } = require('../models');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// GET all team members
router.get('/', async (req, res) => {
  try {
    const where = req.user.role === 'Client' ? { customerId: req.user.customerId } : {};
    const members = await TeamMember.findAll({ where, order: [['fullName', 'ASC']] });
    res.json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Error fetching team members' });
  }
});

// GET commissions
router.get('/commissions', async (req, res) => {
  try {
    const where = req.user.role === 'Client' ? { customerId: req.user.customerId } : {};
    
    // 1. Get team members
    const members = await TeamMember.findAll({ where });
    const memberMap = new Map();
    members.forEach(m => memberMap.set(m.fullName, m));

    // 2. Get leads with payments
    const leads = await Lead.findAll({
      where,
      include: [{ model: LeadPayment, as: 'payments' }]
    });

    const commissions = [];
    
    leads.forEach(lead => {
      if (!lead.assignedTo) return;
      const agent = memberMap.get(lead.assignedTo);
      if (!agent) return; // Agent not found or not in this customer's team

      lead.payments.forEach(payment => {
        const rate = parseFloat(agent.commission) || 0;
        const amount = parseFloat(payment.amount) || 0;
        const commissionAmount = (amount * rate) / 100;

        const dateObj = new Date(payment.date);
        const monthStr = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        commissions.push({
          id: payment.id,
          agent: agent.fullName,
          client: lead.name + (lead.businessName ? ` (${lead.businessName})` : ''),
          service: lead.service || '—',
          payment: amount,
          rate: rate,
          commission: commissionAmount,
          month: monthStr,
          status: 'Pending'
        });
      });
    });

    // Sort by most recent payment first (descending ID for simplicity)
    commissions.sort((a, b) => b.id - a.id);

    res.json(commissions);
  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({ message: 'Error fetching commissions' });
  }
});

// GET single member
router.get('/:id', async (req, res) => {
  try {
    const member = await TeamMember.findByPk(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching member' });
  }
});

// CREATE member
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.user.role === 'Client') {
      data.customerId = req.user.customerId;
    }
    const member = await TeamMember.create(data);
    res.status(201).json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Error creating member' });
  }
});

// UPDATE member
router.put('/:id', async (req, res) => {
  try {
    const member = await TeamMember.findByPk(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    if (req.user.role === 'Client' && member.customerId !== req.user.customerId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { fullName, username, password, role, phone, monthlyGoal, commission, targetBonus, isActive } = req.body;
    const updateData = { fullName, username, role, phone, monthlyGoal, commission, targetBonus };
    if (isActive !== undefined) updateData.isActive = isActive;
    // Only update password if provided (non-empty)
    if (password && password.trim() !== '') updateData.password = password;
    
    await member.update(updateData);
    res.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Error updating member' });
  }
});

// TOGGLE active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const member = await TeamMember.findByPk(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    if (req.user.role === 'Client' && member.customerId !== req.user.customerId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    member.isActive = !member.isActive;
    await member.save();
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling member status' });
  }
});

// DELETE member
router.delete('/:id', async (req, res) => {
  try {
    const member = await TeamMember.findByPk(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    if (req.user.role === 'Client' && member.customerId !== req.user.customerId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await member.destroy();
    res.json({ message: 'Member deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting member' });
  }
});

module.exports = router;
