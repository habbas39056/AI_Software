const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { KnowledgeBase, Agent } = require('../models');
const xlsx = require('xlsx');

// Memory storage for Excel imports
const memoryUpload = multer({ storage: multer.memoryStorage() });

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
      data.fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
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
      updateData.fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
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

// EXPORT knowledge base to Excel
router.get('/export/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    let whereClause = {};
    if (customerId && customerId !== 'all') {
      whereClause.customerId = customerId;
    }

    const kbData = await KnowledgeBase.findAll({ where: whereClause });

    const exportData = kbData.map(kb => ({
      'Topic': kb.topic || '',
      'Content': kb.content || '',
      'File Type': kb.fileType || '',
      'File URL': kb.fileUrl || '',
      'Created At': kb.createdAt ? kb.createdAt.toISOString().split('T')[0] : ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'KnowledgeBase');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="knowledge_base_export.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting knowledge base:', error);
    res.status(500).json({ message: 'Error exporting knowledge base' });
  }
});

// IMPORT knowledge base from Excel
router.post('/import/:customerId', memoryUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const customerId = req.params.customerId;
    if (!customerId || customerId === 'all') return res.status(400).json({ message: 'Valid Customer ID is required for import' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    let importedCount = 0;
    let updatedCount = 0;

    for (const row of rows) {
      const topic = String(row['Topic'] || row['topic'] || '').trim();
      if (!topic) continue; // Skip rows without topic

      const content = row['Content'] || row['content'] || '';
      const fileType = row['File Type'] || row['fileType'] || null;
      const fileUrl = row['File URL'] || row['fileUrl'] || null;

      let existingKb = await KnowledgeBase.findOne({ where: { topic, customerId } });

      if (existingKb) {
        await existingKb.update({
          content: content || existingKb.content,
          fileType: fileType || existingKb.fileType,
          fileUrl: fileUrl || existingKb.fileUrl
        });
        updatedCount++;
      } else {
        await KnowledgeBase.create({
          customerId,
          topic,
          content,
          fileType,
          fileUrl
        });
        importedCount++;
      }
    }

    res.json({ message: `Import successful. ${importedCount} created, ${updatedCount} updated.`, importedCount, updatedCount });
  } catch (error) {
    console.error('Error importing knowledge base:', error);
    res.status(500).json({ message: 'Error importing knowledge base' });
  }
});

module.exports = router;
