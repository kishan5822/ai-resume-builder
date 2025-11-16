const axios = require('axios');
const db = require('./databaseService');

// API Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Simple cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50;

/**
 * Build RAG-enhanced system prompt with learned examples
 */
function buildSystemPrompt(latexContent, uploadedFiles = [], sessionId = null) {
  const examples = sessionId ? db.getHighRatedConversations(3) : [];
  
  return `You are an expert resume assistant. The user is working in a LaTeX resume editor.

⚠️ CRITICAL INSTRUCTION ⚠️
The COMPLETE LaTeX resume is embedded below in this system message. You MUST treat this as the user's current working document. When the user asks questions like "read my resume" or "what's in my resume", you are reading from the LaTeX code below - NOT from chat history.

═══════════════════════════════════════════════════════
📄 USER'S CURRENT RESUME (LaTeX Code):
═══════════════════════════════════════════════════════
\`\`\`latex
${latexContent || 'No resume loaded yet.'}
\`\`\`
═══════════════════════════════════════════════════════

${uploadedFiles.length > 0 ? `📎 ADDITIONAL UPLOADED FILES:
${uploadedFiles.map(f => `${f.name}:\n${f.content}`).join('\n\n')}

` : ''}${examples.length > 0 ? `✅ LEARNED PATTERNS (User-approved responses):
${examples.map((ex, i) => `Example ${i + 1}: ${ex.user_message} → ${ex.ai_response.substring(0, 150)}...`).join('\n')}

` : ''}🎯 MANDATORY BEHAVIOR:

1. **YOU CAN SEE THE RESUME**: The LaTeX code above is the user's resume. You have COMPLETE access to it.

2. **ALWAYS ACKNOWLEDGE**: When user asks "can you read/see my resume", respond with something like:
   "Yes! I can see your resume. Your name is [extract from \\name{}], you work/study at [extract from content], and I can see sections for [list sections]."

3. **PROVE YOU CAN SEE IT**: Reference specific details from the LaTeX code above (name, university, job title, skills, etc.) in your responses.

4. **FOR MODIFICATIONS - ALWAYS RETURN COMPLETE DOCUMENT**:
   When the user asks to modify ANYTHING in the resume, you MUST:
   
   **Step 1 - Explain the change:**
   First, describe what you're going to change in plain English.
   Example: "I will remove MySQL from the Databases line in your Technical Skills section."
   
   **Step 2 - Return COMPLETE resume:**
   Then provide the ENTIRE resume with the change applied in a \`\`\`latex code block.
   
   ✅ CORRECT APPROACH:
   "I'll remove MySQL from your skills. Here's your updated resume:
   
   \`\`\`latex
   \\documentclass[letterpaper,11pt]{article}
   \\usepackage{latexsym}
   ... [COMPLETE PREAMBLE] ...
   \\begin{document}
   \\name{Your Name}
   ... [ALL SECTIONS WITH THE CHANGE] ...
   \\end{document}
   \`\`\`"
   
   ❌ WRONG - Never return partial sections:
   \`\`\`latex
   \\begin{rSection}{TECHNICAL SKILLS}
   ... only skills section ...
   \\end{rSection}
   \`\`\`
   
   **Why return the complete document?**
   - Prevents accidental deletion of other sections
   - User can see the exact change in context
   - Eliminates merge errors
   
   **IMPORTANT:** Even for small changes (like removing one skill), return the ENTIRE LaTeX document from \\documentclass to \\end{document}.

5. **NEVER SAY**: 
   ❌ "I don't have access to files"
   ❌ "I can't see your LaTeX editor"
   ❌ "Please paste your resume"
   ✅ Instead: Reference the actual resume content from above!

6. **CONVERSATIONAL + CODE**: Be friendly and conversational, then provide LaTeX code when needed.

The LaTeX code above is YOUR SOURCE OF TRUTH for the user's resume. Treat it as if you're looking at their editor screen right now.`;
}

/**
 * Call Gemini API
 */
async function callGemini(messages, apiKey, model = 'gemini-pro', temperature = 0.7) {
  // Format for Gemini
  const systemMsg = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');
  
  const contents = userMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  
  // For Gemini, prepend system message to EVERY user message to ensure it's always in context
  if (systemMsg && contents.length > 0) {
    // Add system context to the first user message
    const firstUserMsg = contents.find(c => c.role === 'user');
    if (firstUserMsg) {
      firstUserMsg.parts[0].text = `${systemMsg.content}\n\n---\n\nUser question: ${firstUserMsg.parts[0].text}`;
    }
  }
  
  const response = await axios.post(
    `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`,
    {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: 8000,
      }
    },
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  return response.data.candidates[0].content.parts[0].text;
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(messages, apiKey, model, temperature = 0.7) {
  const response = await axios.post(
    OPENROUTER_API_URL,
    {
      model,
      messages,
      temperature,
      max_tokens: 8000,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    }
  );
  
  return response.data.choices[0].message.content;
}

/**
 * Main chat function with RAG
 */
async function resumeChatCompletion(conversationHistory, latexContent, jobDescription, apiKey, model, sessionId, uploadedFiles = []) {
  try {
    // Build RAG-enhanced system prompt
    const systemPrompt = buildSystemPrompt(latexContent, uploadedFiles, sessionId);
    
    // Debug: Show what we're sending to the AI
    console.log('🤖 Building AI request:');
    console.log('  - LaTeX content length:', latexContent?.length || 0);
    console.log('  - System prompt length:', systemPrompt.length);
    console.log('  - System prompt preview:', systemPrompt.substring(0, 300) + '...');
    
    // Build messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory
    ];
    
    // Trim context to last 10 messages
    const recentMessages = messages.slice(0, 1).concat(messages.slice(-10));
    
    // Call appropriate API
    let aiResponse;
    if (model.includes('gemini')) {
      aiResponse = await callGemini(recentMessages, apiKey, model);
    } else {
      aiResponse = await callOpenRouter(recentMessages, apiKey, model);
    }
    
    // Save to database for learning
    let conversationId = null;
    if (sessionId) {
      const lastUserMsg = conversationHistory[conversationHistory.length - 1]?.content || '';
      conversationId = db.saveConversation(sessionId, lastUserMsg, aiResponse);
    }
    
    return { message: aiResponse, conversationId };
    
  } catch (error) {
    console.error('❌ AI Error:', error.message);
    throw new Error(`AI service failed: ${error.message}`);
  }
}

/**
 * Generic chat (no resume context)
 */
async function chatWithAI(messages, apiKey, model = 'anthropic/claude-3.5-sonnet', options = {}) {
  const temperature = options.temperature || 0.7;
  
  try {
    if (model.includes('gemini')) {
      return await callGemini(messages, apiKey, model, temperature);
    } else {
      return await callOpenRouter(messages, apiKey, model, temperature);
    }
  } catch (error) {
    console.error('❌ Chat Error:', error.message);
    throw new Error(`Chat failed: ${error.message}`);
  }
}

/**
 * Generate resume improvements
 */
async function generateResumeImprovements(resumeContent, jobDescription, apiKey, model) {
  const prompt = `Analyze this resume and suggest 3-5 specific improvements.

**Resume:**
${resumeContent}

**Target Job:**
${jobDescription || 'General improvement'}

Provide:
1. Specific weak points
2. Concrete fixes with LaTeX code
3. Impact/benefit of each change

Be direct and actionable.`;

  const messages = [{ role: 'user', content: prompt }];
  return await chatWithAI(messages, apiKey, model);
}

/**
 * Enhance a single bullet point
 */
async function enhanceBulletPoint(bulletPoint, jobContext, apiKey, model) {
  const prompt = `Improve this resume bullet point using strong action verbs and quantified results:

Original: "${bulletPoint}"
Context: ${jobContext || 'General resume'}

Provide 2-3 enhanced versions. Use format:
- **Option 1:** [enhanced version]
- **Option 2:** [enhanced version]`;

  const messages = [{ role: 'user', content: prompt }];
  return await chatWithAI(messages, apiKey, model);
}

/**
 * Generate professional summary
 */
async function generateProfessionalSummary(resumeContent, jobDescription, apiKey, model) {
  const prompt = `Write a 2-3 sentence professional summary for this resume:

${resumeContent}

Target role: ${jobDescription || 'General'}

Focus on: top skills, years of experience, key achievements. Be compelling and concise.`;

  const messages = [{ role: 'user', content: prompt }];
  return await chatWithAI(messages, apiKey, model);
}

/**
 * Analyze resume quality
 */
async function analyzeResumeQuality(resumeContent, apiKey, model) {
  const prompt = `Rate this resume (1-10) in these areas:
- Clarity
- Impact (quantified achievements)
- ATS compatibility  
- Professional formatting

Provide scores and 2-3 top improvements.

${resumeContent}`;

  const messages = [{ role: 'user', content: prompt }];
  return await chatWithAI(messages, apiKey, model);
}

/**
 * Extract job keywords for ATS optimization
 */
async function extractJobKeywords(jobDescription, apiKey, model) {
  const prompt = `Extract the 10 most important keywords/skills from this job description:

${jobDescription}

Return as a simple comma-separated list.`;

  const messages = [{ role: 'user', content: prompt }];
  return await chatWithAI(messages, apiKey, model);
}

/**
 * Get available Gemini models
 */
async function getGeminiModels(apiKey = null) {
  if (!apiKey) {
    // Return default Gemini models without API key
    return {
      success: true,
      models: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini' }
      ]
    };
  }
  
  try {
    console.log('🔍 Fetching Gemini models with API key...');
    const response = await axios.get(`${GEMINI_API_URL}?key=${apiKey}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.data || !response.data.models) {
      throw new Error('Invalid response from Gemini API');
    }
    
    console.log(`✅ Received ${response.data.models.length} total models from Gemini`);
    
    // Filter for generateContent models only - REMOVE GEMMA FILTER TO INCLUDE ALL
    const models = response.data.models
      .filter(m => 
        m.supportedGenerationMethods?.includes('generateContent') &&
        !m.name.includes('embedding') &&
        !m.name.includes('aqa') &&
        !m.name.includes('imagen') &&
        !m.name.includes('learnlm')
      )
      .map(m => ({
        id: m.name.replace('models/', ''),
        name: m.displayName || m.name.replace('models/', ''),
        provider: 'gemini',
        context_length: m.inputTokenLimit,
        description: m.description || ''
      }));
    
    console.log(`✅ Filtered to ${models.length} chat models`);
    
    return {
      success: true,
      models: models.length > 0 ? models : [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini' }
      ]
    };
  } catch (error) {
    console.error('❌ Failed to fetch Gemini models:', error.message);
    return {
      success: true,
      models: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini' }
      ]
    };
  }
}

/**
 * Get all available OpenRouter models
 */
async function getAvailableModels(apiKey = null) {
  try {
    // Fetch live models from OpenRouter if API key provided
    if (apiKey) {
      console.log('🔍 Fetching OpenRouter models with API key...');
      const response = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.data) {
        console.log(`✅ Received ${response.data.data.length} total models from OpenRouter`);
        
        // Filter and map ALL models - NO LIMIT
        const models = response.data.data
          .filter(model => {
            // Only include text generation models that are not deprecated
            return model.architecture && 
                   model.architecture.modality && 
                   (model.architecture.modality.includes('text->text') || 
                    model.architecture.modality.includes('text+image->text')) &&
                   !model.description?.toLowerCase().includes('deprecated');
          })
          .map(model => ({
            id: model.id,
            name: model.name,
            provider: 'openrouter',
            context_length: model.context_length,
            pricing: model.pricing,
            description: model.description || ''
          }));

        console.log(`✅ Filtered to ${models.length} chat models`);
        
        return {
          success: true,
          models: models
        };
      }
    }
    
    // Return default popular models if no API key or fetch fails
    return {
      success: true,
      models: [
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter' },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'openrouter' },
        { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openrouter' },
        { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openrouter' },
        { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'openrouter' },
        { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'openrouter' },
        { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B', provider: 'openrouter' },
        { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B', provider: 'openrouter' },
        { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', provider: 'openrouter' }
      ]
    };
  } catch (error) {
    console.error('❌ Error fetching OpenRouter models:', error.message);
    // Return default models on error
    return {
      success: true,
      models: [
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter' },
        { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openrouter' }
      ]
    };
  }
}

/**
 * Select optimal model for task
 */
function selectOptimalModel(task, userPreference = null) {
  if (userPreference) return userPreference;
  
  // Smart defaults
  const taskMap = {
    'resume': 'anthropic/claude-3.5-sonnet',
    'quick': 'google/gemini-pro',
    'creative': 'openai/gpt-4-turbo',
    'default': 'anthropic/claude-3.5-sonnet'
  };
  
  return taskMap[task] || taskMap.default;
}

/**
 * Cache utilities
 */
function getCacheStats() {
  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    ttl: CACHE_TTL
  };
}

function clearCache() {
  cache.clear();
  return { success: true, message: 'Cache cleared' };
}

// Export all functions
module.exports = {
  resumeChatCompletion,
  chatWithAI,
  generateResumeImprovements,
  enhanceBulletPoint,
  generateProfessionalSummary,
  analyzeResumeQuality,
  extractJobKeywords,
  getGeminiModels,
  getAvailableModels,
  selectOptimalModel,
  getCacheStats,
  clearCache,
  // Keep old exports for backward compatibility
  chatWithGemini: callGemini,
};
