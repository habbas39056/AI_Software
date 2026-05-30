const express = require('express');
const router = express.Router();
const { KnowledgeBase, Agent } = require('../models');

router.get('/:customerId', async (req, res) => {
  try {
    // Check if the agent is active (not paused)
    const agent = await Agent.findOne({ where: { customerId: req.params.customerId } });
    if (agent && !agent.isActive) {
      // Agent is paused — return empty so n8n gets no knowledge and AI won't reply
      console.log(`[Knowledge] Agent for customer ${req.params.customerId} is PAUSED — returning empty.`);
      return res.json([]);
    }

    const kb = await KnowledgeBase.findAll({ where: { customerId: req.params.customerId } });
    res.json(kb);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching knowledge base' });
  }
});

router.post('/', async (req, res) => {
  try {
    const kb = await KnowledgeBase.create(req.body);
    res.status(201).json(kb);
  } catch (error) {
    res.status(500).json({ message: 'Error creating knowledge' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await KnowledgeBase.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Knowledge deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting knowledge' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { topic, content } = req.body;
    await KnowledgeBase.update({ topic, content }, { where: { id: req.params.id } });
    const updated = await KnowledgeBase.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating knowledge' });
  }
});

module.exports = router;
