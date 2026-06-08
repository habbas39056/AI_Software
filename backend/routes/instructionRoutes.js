const express = require('express');
const router = express.Router();
const { Instruction } = require('../models');
const authenticate = require('../middleware/auth');

// GET all instructions for the authenticated customer
router.get('/', authenticate, async (req, res) => {
  try {
    const customerId = req.user.customerId || (req.user.role === 'Super Admin' ? 'admin' : null);
    const instructions = await Instruction.findAll({ where: { customerId } });
    res.json(instructions);
  } catch (error) {
    console.error('Error fetching instructions:', error);
    res.status(500).json({ message: 'Server error fetching instructions' });
  }
});

// POST a new instruction
router.post('/', authenticate, async (req, res) => {
  try {
    const customerId = req.user.customerId || (req.user.role === 'Super Admin' ? 'admin' : null);
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const instruction = await Instruction.create({
      customerId,
      title,
      content
    });

    res.status(201).json(instruction);
  } catch (error) {
    console.error('Error creating instruction:', error);
    res.status(500).json({ message: 'Server error creating instruction' });
  }
});

// PUT (update) an existing instruction
router.put('/:id', authenticate, async (req, res) => {
  try {
    const customerId = req.user.customerId || (req.user.role === 'Super Admin' ? 'admin' : null);
    const instructionId = req.params.id;
    const { title, content } = req.body;

    const instruction = await Instruction.findOne({ where: { id: instructionId, customerId } });
    if (!instruction) {
      return res.status(404).json({ message: 'Instruction not found' });
    }

    if (title) instruction.title = title;
    if (content) instruction.content = content;

    await instruction.save();
    res.json(instruction);
  } catch (error) {
    console.error('Error updating instruction:', error);
    res.status(500).json({ message: 'Server error updating instruction' });
  }
});

// DELETE an instruction
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const customerId = req.user.customerId || (req.user.role === 'Super Admin' ? 'admin' : null);
    const instructionId = req.params.id;

    const instruction = await Instruction.findOne({ where: { id: instructionId, customerId } });
    if (!instruction) {
      return res.status(404).json({ message: 'Instruction not found' });
    }

    await instruction.destroy();
    res.json({ message: 'Instruction deleted successfully' });
  } catch (error) {
    console.error('Error deleting instruction:', error);
    res.status(500).json({ message: 'Server error deleting instruction' });
  }
});

module.exports = router;
