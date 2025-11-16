import React, { useState, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { aiAPI } from '../services/api';
import { saveSettings } from '../utils/storage';

const SettingsModal = ({ isOpen, onClose, settings, onSave }) => {
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const [model, setModel] = useState(settings.model || 'anthropic/claude-3.5-sonnet');
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(null);
  const [isValidatingGemini, setIsValidatingGemini] = useState(false);
  const [isGeminiValid, setIsGeminiValid] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadModels();
    }
  }, [isOpen]);

  const loadModels = async () => {
    try {
      const response = await aiAPI.getModels();
      if (response.data.success) {
        setAvailableModels(response.data.models);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const validateApiKey = async () => {
    if (!apiKey.trim()) return;

    setIsValidating(true);
    setIsValid(null);

    try {
      const response = await aiAPI.validateKey(apiKey, 'openrouter');
      setIsValid(response.data.valid);
      
      // Load models after successful validation
      if (response.data.valid) {
        await loadModels();
      }
    } catch (error) {
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const validateGeminiKey = async () => {
    if (!geminiApiKey.trim()) return;

    setIsValidatingGemini(true);
    setIsGeminiValid(null);

    try {
      const response = await aiAPI.validateKey(geminiApiKey, 'gemini');
      setIsGeminiValid(response.data.valid);
      
      // Load Gemini models after successful validation
      if (response.data.valid) {
        const geminiResponse = await aiAPI.getModels('gemini', geminiApiKey);
        if (geminiResponse.data.success && geminiResponse.data.models.length > 0) {
          // Merge with existing models
          setAvailableModels(prev => {
            const filtered = prev.filter(m => m.provider !== 'google');
            return [...filtered, ...geminiResponse.data.models];
          });
        }
      }
    } catch (error) {
      setIsGeminiValid(false);
    } finally {
      setIsValidatingGemini(false);
    }
  };

  const handleSave = () => {
    const newSettings = {
      apiKey,
      geminiApiKey,
      model,
      theme: settings.theme || 'light',
    };

    saveSettings(newSettings);
    onSave(newSettings);
    onClose();
  };

  if (!isOpen) return null;

  // Popular models - OpenRouter
  const popularModels = [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Recommended)' },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
  ];

  // Gemini models
  const geminiModels = [
    { id: 'gemini-pro', name: 'Gemini Pro (Free)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast & Cheap)' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* API Key Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">
                OpenRouter API Key
              </label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Get API Key →
              </a>
            </div>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setIsValid(null);
                }}
                placeholder="sk-or-v1-..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {isValid === true && (
                <FiCheck className="absolute right-3 top-3 text-green-500" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={validateApiKey}
                disabled={!apiKey.trim() || isValidating}
                className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isValidating ? 'Validating...' : 'Validate Key'}
              </button>
              {isValid === false && (
                <span className="text-sm text-red-600">Invalid API key</span>
              )}
              {isValid === true && (
                <span className="text-sm text-green-600">Valid API key</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>

          {/* Gemini API Key Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">
                Google Gemini API Key
              </label>
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Get API Key →
              </a>
            </div>
            <div className="relative">
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => {
                  setGeminiApiKey(e.target.value);
                  setIsGeminiValid(null);
                }}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {isGeminiValid === true && (
                <FiCheck className="absolute right-3 top-3 text-green-500" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={validateGeminiKey}
                disabled={!geminiApiKey.trim() || isValidatingGemini}
                className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isValidatingGemini ? 'Validating...' : 'Validate Key'}
              </button>
              {isGeminiValid === false && (
                <span className="text-sm text-red-600">Invalid API key</span>
              )}
              {isGeminiValid === true && (
                <span className="text-sm text-green-600">Valid API key</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Optional: Use Gemini models for free tier or better pricing. Your key is stored locally.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              AI Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <optgroup label="🔷 OpenRouter - Popular Models">
                {popularModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🔶 Google Gemini - Direct API">
                {geminiModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
              {availableModels.length > 0 && (
                <optgroup label="🌐 All OpenRouter Models">
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="text-xs text-gray-500">
              Different models have different capabilities and pricing. Claude 3.5 Sonnet
              is recommended for best results.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              💡 Getting Started
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>OpenRouter:</strong> Access to 100+ AI models (Claude, GPT-4, etc.)</li>
              <li><strong>Google Gemini:</strong> Free tier available, direct API access</li>
              <li>• API keys are stored securely in your browser</li>
              <li>• You only pay for what you use (typically $0.01-0.10 per resume)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
