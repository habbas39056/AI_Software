const express = require('express');
const router = express.Router();
const { Lead, LeadActivity, LeadPayment } = require('../models');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// GET all leads across all customers (or scoped if Client)
router.get('/all', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    let whereClause = {};
    if (req.user.role === 'Client') {
      whereClause = { customerId: req.user.customerId };
    } else if (req.user.role === 'TeamMember') {
      whereClause = { 
        customerId: req.user.customerId,
        [Op.or]: [
          { assignedTo: req.user.username },
          { assignedTo: req.user.name }
        ]
      };
    }
    const leads = await Lead.findAll({
      where: whereClause,
      include: [
        { model: LeadActivity, as: 'activities', order: [['createdAt', 'DESC']] },
        { model: LeadPayment, as: 'payments', order: [['date', 'DESC']] }
      ],
      order: [['lastMessageAt', 'DESC']]
    });
    const seenPhones = new Set();
    const uniqueLeads = leads.filter(l => {
      if (!l.phoneNumber) return true;
      if (seenPhones.has(l.phoneNumber)) return false;
      seenPhones.add(l.phoneNumber);
      return true;
    });
    res.json(uniqueLeads);
  } catch (error) {
    console.error('Error fetching all leads:', error);
    res.status(500).json({ message: 'Error fetching all leads' });
  }
});

// GET all leads for a customer
router.get('/:customerId', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    let whereClause = { customerId: req.params.customerId };
    
    if (req.user.role === 'TeamMember') {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { assignedTo: req.user.username },
          { assignedTo: req.user.name }
        ]
      };
    }

    const leads = await Lead.findAll({ 
      where: whereClause,
      include: [
        { model: LeadActivity, as: 'activities', order: [['createdAt', 'DESC']] },
        { model: LeadPayment, as: 'payments', order: [['date', 'DESC']] }
      ],
      order: [['lastMessageAt', 'DESC']]
    });
    const seenPhones = new Set();
    const uniqueLeads = leads.filter(l => {
      if (!l.phoneNumber) return true;
      if (seenPhones.has(l.phoneNumber)) return false;
      seenPhones.add(l.phoneNumber);
      return true;
    });
    res.json(uniqueLeads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: 'Error fetching leads' });
  }
});

// GET single lead with activities + payments
router.get('/detail/:id', async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id, {
      include: [
        { model: LeadActivity, as: 'activities', order: [['createdAt', 'DESC']] },
        { model: LeadPayment, as: 'payments', order: [['date', 'DESC']] }
      ]
    });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lead' });
  }
});

// CREATE lead
router.post('/', async (req, res) => {
  try {
    const { phoneNumber, customerId, summary, name } = req.body;
    
    // Check if a lead with this phone number already exists for this customer
    if (phoneNumber && customerId) {
      let existingLead = await Lead.findOne({ where: { phoneNumber, customerId } });
      
      if (existingLead) {
        const updatedFields = { lastMessageAt: new Date() };
        
        if (summary) {
          updatedFields.summary = summary; // Update with latest summary
        }
        if (name && (!existingLead.name || existingLead.name.trim() === '')) {
          updatedFields.name = name;
        }

        await existingLead.update(updatedFields);
        
        const result = existingLead.toJSON();
        result.activities = [];
        result.payments = [];
        return res.status(200).json(result);
      }
    }

    const lead = await Lead.create({
      ...req.body,
      lastMessageAt: new Date(),
      isPaused: false
    });
    const result = lead.toJSON();
    result.activities = [];
    result.payments = [];
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ message: 'Error creating lead' });
  }
});

// UPDATE lead
router.put('/:id', async (req, res) => {
  try {
    const { name, businessName, phoneNumber, email, service, dealValue, status, assignedTo, followUpDate, city, lossReason, summary, score, isPaused } = req.body;
    await Lead.update(
      { name, businessName, phoneNumber, email, service, dealValue, status, assignedTo, followUpDate, city, lossReason, summary, score, isPaused },
      { where: { id: req.params.id } }
    );
    const updated = await Lead.findByPk(req.params.id, {
      include: [
        { model: LeadActivity, as: 'activities' },
        { model: LeadPayment, as: 'payments' }
      ]
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ message: 'Error updating lead' });
  }
});

// DELETE lead
router.delete('/:id', async (req, res) => {
  try {
    await LeadPayment.destroy({ where: { leadId: req.params.id } });
    await LeadActivity.destroy({ where: { leadId: req.params.id } });
    await Lead.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lead' });
  }
});

// LOG ACTIVITY for a lead (optionally update follow-up date)
router.post('/:id/activity', async (req, res) => {
  try {
    const { type, note, newFollowUpDate } = req.body;
    const activity = await LeadActivity.create({
      leadId: req.params.id,
      type,
      note,
      newFollowUpDate: newFollowUpDate || null,
      createdAt: new Date()
    });
    // If a new follow-up date is provided, update the lead
    if (newFollowUpDate) {
      await Lead.update({ followUpDate: newFollowUpDate }, { where: { id: req.params.id } });
    }
    res.status(201).json(activity);
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ message: 'Error logging activity' });
  }
});

// GET activities for a lead
router.get('/:id/activities', async (req, res) => {
  try {
    const activities = await LeadActivity.findAll({
      where: { leadId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities' });
  }
});

// RECORD PAYMENT for a lead
router.post('/:id/payment', async (req, res) => {
  try {
    const { amount, date, note } = req.body;
    const payment = await LeadPayment.create({
      leadId: req.params.id,
      amount,
      date,
      note
    });
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Error recording payment' });
  }
});

// DELETE payment
router.delete('/payment/:paymentId', async (req, res) => {
  try {
    await LeadPayment.destroy({ where: { id: req.params.paymentId } });
    res.json({ message: 'Payment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting payment' });
  }
});

module.exports = router;
