import axios from 'axios';
import { API_BASE_URL } from '../utils/storage';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * System API calls
 */
export const systemAPI = {
  checkHealth: () => api.get('/health'),
  checkTectonic: () => api.get('/system/check-tectonic'),
  getSystemInfo: () => api.get('/system/info'),
};

/**
 * LaTeX API calls
 */
export const latexAPI = {
  compile: (latexContent, filename = 'resume.tex') =>
    api.post('/latex/compile', { latexContent, filename }),
  
  getTemplate: () => api.get('/latex/template'),
  
  downloadPDF: (filename) =>
    api.get(`/latex/download/${filename}`, { responseType: 'blob' }),
};

/**
 * Upload API calls
 */
export const uploadAPI = {
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  uploadJobDescription: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/job-description', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  deleteFile: (filename) => api.delete(`/upload/${filename}`),
};

/**
 * AI API calls
 */
export const aiAPI = {
  chat: (messages, latexContent, jobDescription, apiKey, model, signal = null, sessionId = null, uploadedFiles = []) =>
    api.post('/ai/chat', {
      messages,
      latexContent,
      jobDescription,
      apiKey,
      model,
      sessionId,
      uploadedFiles,
    }, signal ? { signal } : {}),
  
  generateImprovements: (resumeContent, jobDescription, apiKey, model) =>
    api.post('/ai/generate-improvements', {
      resumeContent,
      jobDescription,
      apiKey,
      model,
    }),
  
  getModels: (provider = 'all', apiKey = null) => {
    const params = { provider };
    if (apiKey) {
      // Use correct parameter name based on provider
      if (provider === 'gemini' || provider === 'google') {
        params.geminiApiKey = apiKey;
      } else {
        params.apiKey = apiKey;
      }
    }
    return api.get('/ai/models', { params });
  },
  
  validateKey: (apiKey, provider = 'openrouter') => api.post('/ai/validate-key', { apiKey, provider }),
  
  rateResponse: (conversationId, rating, wasHelpful) => api.post('/ai/rate-response', {
    conversationId,
    rating,
    wasHelpful
  }),
};

export default api;
