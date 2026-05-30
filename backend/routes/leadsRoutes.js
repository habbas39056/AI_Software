const express = require('express');
const router = express.Router();
const { Lead } = require('../models');

router.get('/:customerId', async (req, res) => {
  try {
    const leads = await Lead.findAll({ 
      where: { customerId: req.params.customerId },
      order: [['lastMessageAt', 'DESC']]
    });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leads' });
  }
});

router.post('/', async (req, res) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      lastMessageAt: new Date(),
      isPaused: false
    });
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Error creating lead' });
  }
});

module.exports = router;
