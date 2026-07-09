const express = require('express');
const router = express.Router();
const { Lead, LeadActivity, LeadPayment } = require('../models');
const authenticate = require('../middleware/auth');
const xlsx = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

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
          { assignedTo: req.user.name },
          { assignedTo: 'AI Agent' },
          { assignedTo: null },
          { assignedTo: '' }
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
          { assignedTo: req.user.name },
          { assignedTo: 'AI Agent' },
          { assignedTo: null },
          { assignedTo: '' }
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
    const phoneNumber = req.body.phoneNumber || req.body.PhoneNumber || req.body.phone_number;
    const customerId = req.body.customerId || req.body.CustomerId || req.body.customer_id;
    const summary = req.body.summary || req.body.Summary;
    const name = req.body.name || req.body.Name;
    
    const pNum = phoneNumber ? String(phoneNumber).trim() : null;
    const cId = customerId ? String(customerId).trim() : null;

    if (pNum && cId) {
      let existingLead = await Lead.findOne({ where: { phoneNumber: pNum, customerId: cId } });
      
      if (existingLead) {
        const updatedFields = { 
          lastMessageAt: new Date(),
          messageCount: (existingLead.messageCount || 1) + 1 
        };
        
        if (summary) updatedFields.summary = summary;
        if (name && (!existingLead.name || existingLead.name.trim() === '')) updatedFields.name = name;

        await existingLead.update(updatedFields);
        return res.status(200).json(existingLead.toJSON());
      }
    }

    try {
      const lead = await Lead.create({
        ...req.body,
        lastMessageAt: new Date(),
        isPaused: false,
        messageCount: 1
      });
      res.status(201).json(lead.toJSON());
    } catch (createError) {
      if (createError.name === 'SequelizeUniqueConstraintError' && pNum && cId) {
        // Fallback: If create fails due to unique constraint, it means the lead DOES exist.
        // We will forcefully update it!
        let existingLead = await Lead.findOne({ where: { phoneNumber: pNum, customerId: cId } });
        if (existingLead) {
          const updatedFields = { 
            lastMessageAt: new Date(),
            messageCount: (existingLead.messageCount || 1) + 1 
          };
          if (summary) updatedFields.summary = summary;
          if (name && (!existingLead.name || existingLead.name.trim() === '')) updatedFields.name = name;
  
          await existingLead.update(updatedFields);
          return res.status(200).json(existingLead.toJSON());
        }
      }
      throw createError; // Re-throw if it wasn't a unique constraint error or we couldn't resolve it
    }
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ message: 'Error creating lead' });
  }
});

// UPDATE lead
router.put('/:id', async (req, res) => {
  try {
    let { name, businessName, phoneNumber, email, service, dealValue, status, assignedTo, followUpDate, city, lossReason, summary, score, isPaused } = req.body;
    
    // N8N fallback for capitalized keys
    if (!summary && req.body.Summary) summary = req.body.Summary;
    if (!name && req.body.Name) name = req.body.Name;
    if (!status && req.body.Status) status = req.body.Status;

    const existingLead = await Lead.findByPk(req.params.id);
    if (!existingLead) return res.status(404).json({ message: 'Lead not found' });

    let newMessageCount = existingLead.messageCount || 1;
    let newLastMessageAt = existingLead.lastMessageAt;

    // If summary is provided and is different from the existing summary, increment messageCount
    if (summary && summary !== existingLead.summary) {
      newMessageCount += 1;
      newLastMessageAt = new Date();
    }

    await Lead.update(
      { 
        name, businessName, phoneNumber, email, service, dealValue, status, assignedTo, followUpDate, city, lossReason, summary, score, isPaused,
        messageCount: newMessageCount,
        lastMessageAt: newLastMessageAt
      },
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

// EXPORT leads to Excel
router.get('/export/:customerId', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { customerId } = req.params;
    let whereClause = {};
    
    if (customerId && customerId !== 'all') {
      whereClause.customerId = customerId;
    }

    if (req.user.role === 'Client') {
      whereClause.customerId = req.user.customerId;
    } else if (req.user.role === 'TeamMember') {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { assignedTo: req.user.username },
          { assignedTo: req.user.name },
          { assignedTo: 'AI Agent' },
          { assignedTo: null },
          { assignedTo: '' }
        ]
      };
    }

    const leads = await Lead.findAll({
      where: whereClause,
      order: [['lastMessageAt', 'DESC']]
    });

    // We deduplicate by phoneNumber to match the GET /all logic
    const seenPhones = new Set();
    const uniqueLeads = leads.filter(l => {
      if (!l.phoneNumber) return true;
      if (seenPhones.has(l.phoneNumber)) return false;
      seenPhones.add(l.phoneNumber);
      return true;
    });

    const exportData = uniqueLeads.map(l => ({
      'Name': l.name || '',
      'Business Name': l.businessName || '',
      'Phone Number': l.phoneNumber || '',
      'Email': l.email || '',
      'Service': l.service || '',
      'Deal Value': l.dealValue || 0,
      'Status': l.status || '',
      'Assigned To': l.assignedTo || '',
      'Follow-up Date': l.followUpDate ? l.followUpDate.toISOString().split('T')[0] : '',
      'City': l.city || '',
      'Loss Reason': l.lossReason || '',
      'Summary': l.summary || '',
      'Created At': l.createdAt ? l.createdAt.toISOString().split('T')[0] : ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Leads');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="leads_export.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting leads:', error);
    res.status(500).json({ message: 'Error exporting leads' });
  }
});

// IMPORT leads from Excel
router.post('/import/:customerId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const customerId = req.params.customerId !== 'all' ? req.params.customerId : req.user.customerId;
    if (!customerId) return res.status(400).json({ message: 'Customer ID is required for import' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    let importedCount = 0;
    let updatedCount = 0;

    for (const row of rows) {
      const phoneNumber = String(row['Phone Number'] || row['phone'] || row['phoneNumber'] || row['WhatsApp'] || '').trim();
      const name = String(row['Name'] || row['name'] || '').trim();
      if (!phoneNumber) continue; // Skip rows without phone number

      const summary = row['Summary'] || row['Notes'] || row['notes'];
      const status = row['Status'] || row['status'] || 'New';
      const email = row['Email'] || row['email'];
      const businessName = row['Business Name'] || row['businessName'];
      const service = row['Service'] || row['service'];
      const dealValue = row['Deal Value'] || row['dealValue'] || 0;
      const assignedTo = row['Assigned To'] || row['assignedTo'];
      const city = row['City'] || row['city'];

      let existingLead = await Lead.findOne({ where: { phoneNumber, customerId } });

      if (existingLead) {
        await existingLead.update({
          name: name || existingLead.name,
          email: email || existingLead.email,
          businessName: businessName || existingLead.businessName,
          service: service || existingLead.service,
          dealValue: dealValue || existingLead.dealValue,
          status: status || existingLead.status,
          assignedTo: assignedTo || existingLead.assignedTo,
          city: city || existingLead.city,
          summary: summary || existingLead.summary
        });
        updatedCount++;
      } else {
        await Lead.create({
          customerId,
          phoneNumber,
          name,
          email,
          businessName,
          service,
          dealValue,
          status,
          assignedTo,
          city,
          summary,
          lastMessageAt: new Date(),
          isPaused: false,
          messageCount: 1
        });
        importedCount++;
      }
    }

    res.json({ message: `Import successful. ${importedCount} created, ${updatedCount} updated.`, importedCount, updatedCount });
  } catch (error) {
    console.error('Error importing leads:', error);
    res.status(500).json({ message: 'Error importing leads' });
  }
});

module.exports = router;
