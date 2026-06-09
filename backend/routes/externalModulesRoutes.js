const express = require('express');
const router = express.Router();
const { ExternalComplaint, ExternalInstruction } = require('../models');
const authenticate = require('../middleware/auth');

// GET all external complaints
router.get('/complaints', authenticate, async (req, res) => {
  try {
    const complaints = await ExternalComplaint.findAll();
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching external complaints:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new external complaint
router.post('/complaints', async (req, res) => {
  try {
    const complaint = await ExternalComplaint.create(req.body);
    res.status(201).json(complaint);
  } catch (error) {
    console.error('Error creating external complaint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT (update) an external complaint
router.put('/complaints/:id', authenticate, async (req, res) => {
  try {
    const complaint = await ExternalComplaint.findByPk(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    await complaint.update(req.body);
    res.json(complaint);
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE an external complaint
router.delete('/complaints/:id', authenticate, async (req, res) => {
  try {
    const complaint = await ExternalComplaint.findByPk(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    await complaint.destroy();
    res.json({ message: 'Complaint deleted' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all external instructions
router.get('/instructions', authenticate, async (req, res) => {
  try {
    const instructions = await ExternalInstruction.findAll();
    res.json(instructions);
  } catch (error) {
    console.error('Error fetching external instructions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new external instruction
router.post('/instructions', async (req, res) => {
  try {
    const instruction = await ExternalInstruction.create(req.body);
    res.status(201).json(instruction);
  } catch (error) {
    console.error('Error creating external instruction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT (update) an external instruction
router.put('/instructions/:id', authenticate, async (req, res) => {
  try {
    const instruction = await ExternalInstruction.findByPk(req.params.id);
    if (!instruction) return res.status(404).json({ message: 'Instruction not found' });
    await instruction.update(req.body);
    res.json(instruction);
  } catch (error) {
    console.error('Error updating instruction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE an external instruction
router.delete('/instructions/:id', authenticate, async (req, res) => {
  try {
    const instruction = await ExternalInstruction.findByPk(req.params.id);
    if (!instruction) return res.status(404).json({ message: 'Instruction not found' });
    await instruction.destroy();
    res.json({ message: 'Instruction deleted' });
  } catch (error) {
    console.error('Error deleting instruction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
