const express = require('express');
const router = express.Router();
const { checkTectonicInstallation } = require('../utils/latexCompiler');

/**
 * GET /api/system/check-tectonic
 * Check if Tectonic is installed
 */
router.get('/check-tectonic', async (req, res) => {
  try {
    const result = await checkTectonicInstallation();
    
    res.json({
      ...result,
      installationGuide: {
        windows: 'choco install tectonic or download from https://github.com/tectonic-typesetting/tectonic/releases',
        macos: 'brew install tectonic',
        linux: 'cargo install tectonic or download from releases'
      }
    });
  } catch (error) {
    res.status(500).json({
      installed: false,
      error: error.message || 'Failed to check Tectonic installation'
    });
  }
});

/**
 * GET /api/system/info
 * Get system information
 */
router.get('/info', (req, res) => {
  res.json({
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    memory: {
      total: Math.round(require('os').totalmem() / 1024 / 1024),
      free: Math.round(require('os').freemem() / 1024 / 1024)
    }
  });
});

module.exports = router;
