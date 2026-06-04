const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { KnowledgeBase, Agent } = require('../models');

// ── Multer config for knowledge base file uploads ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const allowedExtensions = ['.pdf', '.pptx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.mp4', '.heic'];

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} is not allowed`));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// Helper: determine fileType from extension
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.pdf', '.pptx', '.xls', '.xlsx'].includes(ext)) return 'document';
  if (['.png', '.jpg', '.jpeg'].includes(ext)) return 'picture';
  if (['.mp4', '.heic'].includes(ext)) return 'video';
  return 'unknown';
}

// GET all knowledge for a customer
router.get('/:customerId', async (req, res) => {
  try {
    const kb = await KnowledgeBase.findAll({ where: { customerId: req.params.customerId } });
    res.json(kb);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching knowledge base' });
  }
});

// CREATE knowledge (with optional file upload)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const data = {
      customerId: req.body.customerId,
      topic: req.body.topic,
      content: req.body.content || null,
    };

    if (req.file) {
      data.fileUrl = `/uploads/${req.file.filename}`;
      data.fileType = getFileType(req.file.originalname);
    }

    const kb = await KnowledgeBase.create(data);
    res.status(201).json(kb);
  } catch (error) {
    console.error('Error creating knowledge:', error);
    res.status(500).json({ message: 'Error creating knowledge' });
  }
});

// DELETE knowledge
router.delete('/:id', async (req, res) => {
  try {
    await KnowledgeBase.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Knowledge deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting knowledge' });
  }
});

// UPDATE knowledge (with optional new file upload)
router.put('/:id', upload.single('file'), async (req, res) => {
  try {
    const updateData = {
      topic: req.body.topic,
      content: req.body.content || null,
    };

    if (req.file) {
      updateData.fileUrl = `/uploads/${req.file.filename}`;
      updateData.fileType = getFileType(req.file.originalname);
    }

    await KnowledgeBase.update(updateData, { where: { id: req.params.id } });
    const updated = await KnowledgeBase.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating knowledge:', error);
    res.status(500).json({ message: 'Error updating knowledge' });
  }
});

module.exports = router;
