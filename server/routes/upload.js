const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { parseFile } = require('../utils/fileParser');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 File filter check:', {
      name: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    const allowedTypes = ['.pdf', '.docx', '.doc', '.tex'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      console.log('✅ File type allowed:', ext);
      cb(null, true);
    } else {
      console.log('❌ File type not allowed:', ext);
      cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

/**
 * POST /api/upload/resume
 * Upload resume file (PDF, DOCX, or LaTeX)
 */
router.post('/resume', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).substring(1);

    // Parse the file to extract text
    const parseResult = await parseFile(filePath, fileType);

    if (!parseResult.success) {
      // Clean up file
      await fs.remove(filePath);
      return res.status(400).json({ error: parseResult.error });
    }

    res.json({
      success: true,
      message: 'File uploaded and parsed successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        size: req.file.size,
        type: fileType
      },
      content: parseResult.text,
      metadata: {
        pages: parseResult.pages,
        format: parseResult.format
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
});

/**
 * POST /api/upload/job-description
 * Upload job description file (PDF or DOCX)
 */
router.post('/job-description', upload.single('file'), async (req, res) => {
  try {
    console.log('📎 Job description upload request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    console.log('📄 File received:', {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).substring(1);

    console.log('🔍 Parsing file:', fileType);
    
    // Parse the file to extract text
    const parseResult = await parseFile(filePath, fileType);

    console.log('📊 Parse result:', parseResult.success ? 'Success' : 'Failed');

    // Clean up file immediately after parsing
    await fs.remove(filePath);

    if (!parseResult.success) {
      console.log('❌ Parse error:', parseResult.error);
      return res.status(400).json({ 
        success: false,
        error: parseResult.error || 'Failed to parse file' 
      });
    }

    console.log('✅ Job description uploaded successfully');
    
    res.json({
      success: true,
      message: 'Job description extracted successfully',
      content: parseResult.text
    });
  } catch (error) {
    console.error('❌ Job description upload error:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message || 'File upload failed' 
    });
  }
});

/**
 * DELETE /api/upload/:filename
 * Delete uploaded file
 */
router.delete('/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);

    await fs.remove(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message || 'File deletion failed' });
  }
});

module.exports = router;
