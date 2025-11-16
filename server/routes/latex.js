const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { compileLaTeX } = require('../utils/latexCompiler');

/**
 * POST /api/latex/compile
 * Compile LaTeX code to PDF
 */
router.post('/compile', async (req, res) => {
  try {
    console.log('📝 Compile request received');
    const { latexContent, filename } = req.body;

    if (!latexContent) {
      console.error('❌ No LaTeX content provided');
      return res.status(400).json({ error: 'LaTeX content is required' });
    }
    
    console.log('✅ LaTeX content received, length:', latexContent.length);

    // Create temp directory for this compilation
    const compilationId = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const tempDir = path.join(__dirname, '../temp', compilationId);
    const outputDir = path.join(__dirname, '../output');
    
    await fs.ensureDir(tempDir);
    await fs.ensureDir(outputDir);

    // Write LaTeX content to file
    const texFilename = filename || 'resume.tex';
    const texFilePath = path.join(tempDir, texFilename);
    await fs.writeFile(texFilePath, latexContent, 'utf8');
    console.log('📄 Created .tex file:', texFilePath);

    // Copy resume.cls to temp directory
    const clsSourcePath = path.join(__dirname, '../../resume.cls');
    const clsDestPath = path.join(tempDir, 'resume.cls');
    
    console.log('🔍 Looking for resume.cls at:', clsSourcePath);
    
    if (await fs.pathExists(clsSourcePath)) {
      await fs.copy(clsSourcePath, clsDestPath);
      console.log('✅ Copied resume.cls to:', clsDestPath);
      
      // Verify the copy worked
      const clsExists = await fs.pathExists(clsDestPath);
      console.log('✅ Verified resume.cls exists in temp dir:', clsExists);
    } else {
      console.error('❌ resume.cls NOT FOUND at:', clsSourcePath);
      await fs.remove(tempDir);
      return res.status(500).json({
        success: false,
        error: 'resume.cls template file not found',
        details: `Looking at: ${clsSourcePath}`
      });
    }

    // Compile LaTeX with Tectonic
    console.log('🔨 Compiling LaTeX in:', tempDir);
    const compileResult = await compileLaTeX(texFilePath, tempDir);

    if (!compileResult.success) {
      console.error('❌ Compilation failed:', compileResult.error);
      // Clean up temp directory
      await fs.remove(tempDir);
      return res.status(400).json({
        success: false,
        error: 'LaTeX compilation failed',
        details: compileResult.error + (compileResult.details ? '\n' + compileResult.details : '')
      });
    }
    
    console.log('✅ Compilation successful');

    // Get the generated PDF filename
    const pdfFilename = texFilename.replace('.tex', '.pdf');
    const pdfTempPath = path.join(tempDir, pdfFilename);
    const pdfOutputPath = path.join(outputDir, pdfFilename);

    // Check if PDF was created in temp directory
    if (!(await fs.pathExists(pdfTempPath))) {
      await fs.remove(tempDir);
      return res.status(500).json({
        success: false,
        error: 'PDF was not generated',
        details: compileResult.details || 'Check LaTeX syntax'
      });
    }

    // Move PDF to output directory
    await fs.copy(pdfTempPath, pdfOutputPath, { overwrite: true });

    // Read PDF as base64 for response
    const pdfBuffer = await fs.readFile(pdfOutputPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Clean up temp directory
    await fs.remove(tempDir);

    res.json({
      success: true,
      message: 'LaTeX compiled successfully',
      pdf: {
        filename: pdfFilename,
        url: `/output/${pdfFilename}`,
        base64: pdfBase64,
        size: pdfBuffer.length
      },
      compilationOutput: compileResult.output
    });
  } catch (error) {
    console.error('❌ Compilation error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Compilation failed',
      details: error.stack
    });
  }
});

/**
 * GET /api/latex/template
 * Get the default FAANGPath template
 */
router.get('/template', async (req, res) => {
  try {
    const templatePath = path.join(__dirname, '../../resume_faangpath.tex');
    const templateContent = await fs.readFile(templatePath, 'utf8');

    res.json({
      success: true,
      template: templateContent,
      name: 'FAANGPath Template'
    });
  } catch (error) {
    console.error('Template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load template'
    });
  }
});

/**
 * GET /api/latex/download/:filename
 * Download compiled PDF
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../output', filename);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, filename);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = router;
