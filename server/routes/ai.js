const express = require('express');
const router = express.Router();
const axios = require('axios');
const {
  generateResumeImprovements,
  resumeChatCompletion,
  getAvailableModels,
  enhanceBulletPoint,
  generateProfessionalSummary,
  analyzeResumeQuality,
  extractJobKeywords
} = require('../services/aiService');

/**
 * POST /api/ai/chat
 * Chat with AI about resume improvements
 */
router.post('/chat', async (req, res) => {
  try {
    const {
      messages,
      latexContent,
      jobDescription,
      apiKey,
      model,
      sessionId,
      uploadedFiles
    } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: 'OpenRouter API key is required. Please configure it in settings.'
      });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Log what we received
    console.log('📝 Chat request received:');
    console.log('  - LaTeX content length:', latexContent?.length || 0);
    console.log('  - LaTeX preview:', latexContent?.substring(0, 100) || 'EMPTY');
    console.log('  - Messages count:', messages?.length);
    console.log('  - Model:', model);

    if (!latexContent) {
      console.warn('⚠️ WARNING: No LaTeX content provided!');
      return res.status(400).json({ error: 'LaTeX content is required' });
    }

    // Call RAG-enhanced AI service
    const result = await resumeChatCompletion(
      messages,
      latexContent,
      jobDescription || '',
      apiKey,
      model || 'anthropic/claude-3.5-sonnet',
      sessionId || 'default-session',
      uploadedFiles || []
    );

    res.json({
      success: true,
      message: result.message,
      conversationId: result.conversationId
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.json({
      success: false,
      error: error.message || 'AI chat failed'
    });
  }
});

/**
 * POST /api/ai/generate-improvements
 * Generate resume improvements based on job description
 */
router.post('/generate-improvements', async (req, res) => {
  try {
    const {
      resumeContent,
      jobDescription,
      apiKey,
      model
    } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: 'OpenRouter API key is required. Please configure it in settings.'
      });
    }

    if (!resumeContent) {
      return res.status(400).json({ error: 'Resume content is required' });
    }

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const result = await generateResumeImprovements(
      resumeContent,
      jobDescription,
      apiKey,
      model || 'anthropic/claude-3.5-sonnet'
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      improvements: result.message,
      usage: result.usage,
      model: result.model
    });
  } catch (error) {
    console.error('Generate improvements error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate improvements'
    });
  }
});

/**
 * GET /api/ai/models
 * Get list of available models from all providers (OpenRouter + Gemini)
 */
router.get('/models', async (req, res) => {
  try {
    const provider = req.query.provider || 'all'; // all, openrouter, gemini
    const apiKey = req.query.apiKey || req.headers['x-api-key'];
    
    let allModels = [];
    
    // Get OpenRouter models
    if (provider === 'all' || provider === 'openrouter') {
      const openrouterResult = await getAvailableModels(apiKey);
      
      if (openrouterResult.success) {
        allModels = [...allModels, ...openrouterResult.models];
      }
    }
    
    // Get Gemini models (with optional API key for live fetching)
    if (provider === 'all' || provider === 'gemini' || provider === 'google') {
      const { getGeminiModels } = require('../services/aiService');
      const geminiApiKey = req.query.geminiApiKey || req.headers['x-gemini-api-key'];
      const geminiResult = await getGeminiModels(geminiApiKey);
      
      if (geminiResult.success) {
        allModels = [...allModels, ...geminiResult.models];
      }
    }
    
    // Sort by provider and name
    allModels.sort((a, b) => {
      if (a.provider !== b.provider) {
        return a.provider.localeCompare(b.provider);
      }
      return (a.name || a.id).localeCompare(b.name || b.id);
    });

    res.json({
      success: true,
      models: allModels,
      total: allModels.length,
      providers: {
        openrouter: allModels.filter(m => m.provider === 'openrouter').length,
        gemini: allModels.filter(m => m.provider === 'gemini' || m.provider === 'google').length
      }
    });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch models',
      models: []
    });
  }
});

/**
 * POST /api/ai/validate-key
 * Validate API key (OpenRouter or Gemini)
 */
router.post('/validate-key', async (req, res) => {
  try {
    const { apiKey, provider = 'openrouter' } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        valid: false,
        error: 'API key is required'
      });
    }

    // Validate based on provider (accept both 'gemini' and 'google')
    if (provider === 'gemini' || provider === 'google') {
      // Validate Gemini API key format
      if (!apiKey.startsWith('AIzaSy')) {
        return res.json({
          valid: false,
          error: 'Invalid Gemini API key format. Should start with "AIzaSy"'
        });
      }

      // Test Gemini API key with a simple request to list models
      // Using header-based authentication as per latest Gemini API docs
      try {
        const response = await axios.get(
          'https://generativelanguage.googleapis.com/v1beta/models',
          {
            headers: {
              'x-goog-api-key': apiKey
            },
            timeout: 10000,
            validateStatus: (status) => status < 500
          }
        );
        
        // Check if the response is successful
        if (response.status === 200 && response.data.models) {
          return res.json({
            valid: true,
            provider: 'gemini',
            message: 'Gemini API key is valid'
          });
        } else {
          console.error('Gemini validation failed:', response.status, response.data);
          return res.json({
            valid: false,
            error: `Invalid Gemini API key (Status: ${response.status})`
          });
        }
      } catch (error) {
        console.error('Gemini validation error:', error.response?.data || error.message);
        return res.json({
          valid: false,
          error: error.response?.data?.error?.message || 'Invalid Gemini API key or network issue'
        });
      }
    } else {
      // Validate OpenRouter key format
      if (!apiKey.startsWith('sk-or-')) {
        return res.json({
          valid: false,
          error: 'Invalid OpenRouter API key format. Should start with "sk-or-"'
        });
      }

      // Test OpenRouter API key
      try {
        const response = await axios.get('https://openrouter.ai/api/v1/auth/key', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        return res.json({
          valid: true,
          provider: 'openrouter',
          message: 'OpenRouter API key is valid'
        });
      } catch (error) {
        return res.json({
          valid: false,
          error: 'Invalid OpenRouter API key'
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      valid: false,
      error: error.message || 'Validation failed'
    });
  }
});

/**
 * GET /api/ai/cache-stats
 * Get cache statistics for monitoring
 */
router.get('/cache-stats', (req, res) => {
  try {
    const { getCacheStats } = require('../services/aiService');
    const stats = getCacheStats();
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/clear-cache
 * Clear the response cache
 */
router.post('/clear-cache', (req, res) => {
  try {
    const { clearCache } = require('../services/aiService');
    const result = clearCache();
    
    res.json({
      success: true,
      message: `Cleared ${result.cleared} cached responses`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/select-model
 * Get optimal model recommendation for a task
 */
router.post('/select-model', (req, res) => {
  try {
    const { task, userPreference } = req.body;
    const { selectOptimalModel } = require('../services/aiService');
    
    const recommendedModel = selectOptimalModel(task, userPreference);
    
    res.json({
      success: true,
      model: recommendedModel,
      task: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/enhance-bullet
 * Enhance a single resume bullet point with metrics and impact
 */
router.post('/enhance-bullet', async (req, res) => {
  try {
    const { bulletPoint, jobContext, apiKey, model } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: 'OpenRouter API key is required'
      });
    }

    if (!bulletPoint) {
      return res.status(400).json({ error: 'Bullet point text is required' });
    }

    const result = await enhanceBulletPoint(
      bulletPoint,
      jobContext || '',
      apiKey,
      model || 'anthropic/claude-3.5-sonnet'
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      enhanced: result.message,
      usage: result.usage
    });
  } catch (error) {
    console.error('Enhance bullet error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to enhance bullet point'
    });
  }
});

/**
 * POST /api/ai/generate-summary
 * Generate professional summary/objective tailored to job
 */
router.post('/generate-summary', async (req, res) => {
  try {
    const { resumeContent, jobDescription, apiKey, model } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: 'OpenRouter API key is required'
      });
    }

    if (!resumeContent) {
      return res.status(400).json({ error: 'Resume content is required' });
    }

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const result = await generateProfessionalSummary(
      resumeContent,
      jobDescription,
      apiKey,
      model || 'anthropic/claude-3.5-sonnet'
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      summary: result.message,
      usage: result.usage
    });
  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate summary'
    });
  }
});

/**
 * POST /api/ai/analyze-quality
 * Analyze resume quality and provide improvement suggestions
 */
router.post('/analyze-quality', async (req, res) => {
  try {
    const { resumeContent, apiKey, model } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: 'OpenRouter API key is required'
      });
    }

    if (!resumeContent) {
      return res.status(400).json({ error: 'Resume content is required' });
    }

    const result = await analyzeResumeQuality(
      resumeContent,
      apiKey,
      model || 'anthropic/claude-3.5-sonnet'
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      analysis: result.message,
      usage: result.usage
    });
  } catch (error) {
    console.error('Analyze quality error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze resume'
    });
  }
});

/**
 * POST /api/ai/rate-response
 * Rate an AI response (thumbs up/down)
 */
router.post('/rate-response', async (req, res) => {
  try {
    const { conversationId, rating, wasHelpful } = req.body;
    const db = require('../services/databaseService');

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    db.updateConversationRating(conversationId, rating || 0, wasHelpful);

    res.json({
      success: true,
      message: 'Rating saved'
    });
  } catch (error) {
    console.error('Rate response error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/extract-keywords
 * Extract important keywords from job description for ATS optimization
 */
router.post('/extract-keywords', async (req, res) => {
  try {
    const { jobDescription, apiKey, model } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: 'OpenRouter API key is required'
      });
    }

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const result = await extractJobKeywords(
      jobDescription,
      apiKey,
      model || 'anthropic/claude-3.5-sonnet'
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      keywords: result.message,
      usage: result.usage
    });
  } catch (error) {
    console.error('Extract keywords error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract keywords'
    });
  }
});

module.exports = router;
