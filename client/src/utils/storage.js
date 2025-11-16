const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Get stored settings from localStorage
 */
export const getSettings = () => {
  const settings = localStorage.getItem('ai_resume_settings');
  return settings ? JSON.parse(settings) : {
    apiKey: '',
    model: 'anthropic/claude-3.5-sonnet',
    theme: 'light'
  };
};

/**
 * Save settings to localStorage
 */
export const saveSettings = (settings) => {
  localStorage.setItem('ai_resume_settings', JSON.stringify(settings));
};

/**
 * Get stored resume data from localStorage
 */
export const getStoredResume = () => {
  const resume = localStorage.getItem('ai_resume_current');
  return resume ? JSON.parse(resume) : null;
};

/**
 * Save resume to localStorage
 */
export const saveResume = (resume) => {
  localStorage.setItem('ai_resume_current', JSON.stringify(resume));
};

/**
 * Clear stored resume
 */
export const clearResume = () => {
  localStorage.removeItem('ai_resume_current');
};

/**
 * Get chat history from localStorage
 */
export const getChatHistory = () => {
  const history = localStorage.getItem('ai_resume_chat');
  return history ? JSON.parse(history) : [];
};

/**
 * Save chat history to localStorage
 */
export const saveChatHistory = (history) => {
  localStorage.setItem('ai_resume_chat', JSON.stringify(history));
};

/**
 * Clear chat history
 */
export const clearChatHistory = () => {
  localStorage.removeItem('ai_resume_chat');
};

export { API_BASE_URL };
