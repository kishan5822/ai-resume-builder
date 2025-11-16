import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiLoader, FiSave } from 'react-icons/fi';
import { aiAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import './InlineSettings.css';

const InlineSettings = ({ settings, onSave, onClose }) => {
  // State
  const [activeTab, setActiveTab] = useState('openrouter'); // 'openrouter' or 'gemini'
  const [openRouterKey, setOpenRouterKey] = useState(settings.apiKey || '');
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [selectedModel, setSelectedModel] = useState(settings.model || 'anthropic/claude-3.5-sonnet');
  
  // Validation states
  const [isValidatingOR, setIsValidatingOR] = useState(false);
  const [isValidatingGemini, setIsValidatingGemini] = useState(false);
  const [orKeyValid, setOrKeyValid] = useState(null);
  const [geminiKeyValid, setGeminiKeyValid] = useState(null);
  
  // Models states
  const [openRouterModels, setOpenRouterModels] = useState([]);
  const [geminiModels, setGeminiModels] = useState([]);
  const [isLoadingORModels, setIsLoadingORModels] = useState(false);
  const [isLoadingGeminiModels, setIsLoadingGeminiModels] = useState(false);

  // Load models on component mount
  useEffect(() => {
    loadOpenRouterModels();
    loadGeminiModels();
  }, []);

  // Detect which tab should be active based on selected model
  useEffect(() => {
    if (selectedModel.startsWith('gemini')) {
      setActiveTab('gemini');
    } else {
      setActiveTab('openrouter');
    }
  }, [selectedModel]);

  /**
   * Load OpenRouter models
   */
  const loadOpenRouterModels = async () => {
    setIsLoadingORModels(true);
    try {
      console.log('🔷 Loading OpenRouter models...');
      const response = await aiAPI.getModels('openrouter');
      
      if (response.data && response.data.success) {
        const models = response.data.models || [];
        console.log(`✅ Loaded ${models.length} OpenRouter models`);
        setOpenRouterModels(models);
      } else {
        console.warn('⚠️ No OpenRouter models returned, using fallback');
        setOpenRouterModels(getFallbackOpenRouterModels());
      }
    } catch (error) {
      console.error('❌ Failed to load OpenRouter models:', error);
      toast.error('Using default OpenRouter models');
      setOpenRouterModels(getFallbackOpenRouterModels());
    } finally {
      setIsLoadingORModels(false);
    }
  };

  /**
   * Load Gemini models
   */
  const loadGeminiModels = async (apiKey = null) => {
    setIsLoadingGeminiModels(true);
    try {
      console.log('🔶 Loading Gemini models...');
      const key = apiKey || geminiKey;
      const response = await aiAPI.getModels('gemini', key || undefined);
      
      if (response.data && response.data.success) {
        const models = response.data.models || [];
        console.log(`✅ Loaded ${models.length} Gemini models`);
        
        if (models.length > 0) {
          setGeminiModels(models);
        } else {
          setGeminiModels(getFallbackGeminiModels());
        }
      } else {
        console.warn('⚠️ No Gemini models returned, using fallback');
        setGeminiModels(getFallbackGeminiModels());
      }
    } catch (error) {
      console.error('❌ Failed to load Gemini models:', error);
      setGeminiModels(getFallbackGeminiModels());
    } finally {
      setIsLoadingGeminiModels(false);
    }
  };

  /**
   * Fallback OpenRouter models
   */
  const getFallbackOpenRouterModels = () => [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter' },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openrouter' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter' },
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openrouter' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'openrouter' },
    { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'openrouter' },
  ];

  /**
   * Fallback Gemini models
   */
  const getFallbackGeminiModels = () => [
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google' },
  ];

  /**
   * Validate OpenRouter API Key
   */
  const validateOpenRouterKey = async () => {
    if (!openRouterKey.trim()) {
      toast.error('Please enter an OpenRouter API key');
      return;
    }

    setIsValidatingOR(true);
    setOrKeyValid(null);
    
    try {
      console.log('🔷 Validating OpenRouter key...');
      const response = await aiAPI.validateKey(openRouterKey, 'openrouter');
      
      if (response.data && response.data.valid) {
        setOrKeyValid(true);
        toast.success('✅ OpenRouter API key is valid!');
        
        // Reload models with valid key
        await loadOpenRouterModels();
      } else {
        setOrKeyValid(false);
        toast.error('❌ Invalid OpenRouter API key');
      }
    } catch (error) {
      console.error('❌ OpenRouter validation error:', error);
      setOrKeyValid(false);
      toast.error('Failed to validate OpenRouter key');
    } finally {
      setIsValidatingOR(false);
    }
  };

  /**
   * Validate Gemini API Key
   */
  const validateGeminiKey = async () => {
    if (!geminiKey.trim()) {
      toast.error('Please enter a Gemini API key');
      return;
    }

    setIsValidatingGemini(true);
    setGeminiKeyValid(null);
    
    try {
      console.log('🔶 Validating Gemini key...');
      const response = await aiAPI.validateKey(geminiKey, 'gemini');
      
      if (response.data && response.data.valid) {
        setGeminiKeyValid(true);
        toast.success('✅ Gemini API key is valid!');
        
        // Reload Gemini models with the validated key
        await loadGeminiModels(geminiKey);
      } else {
        setGeminiKeyValid(false);
        toast.error('❌ Invalid Gemini API key');
      }
    } catch (error) {
      console.error('❌ Gemini validation error:', error);
      setGeminiKeyValid(false);
      toast.error('Failed to validate Gemini key');
    } finally {
      setIsValidatingGemini(false);
    }
  };

  /**
   * Handle Save
   */
  const handleSave = () => {
    const newSettings = {
      apiKey: openRouterKey,
      geminiApiKey: geminiKey,
      model: selectedModel,
      theme: settings.theme || 'light',
    };

    onSave(newSettings);
    toast.success('✅ Settings saved!');
    onClose();
  };

  /**
   * Get current models based on active tab
   */
  const getCurrentModels = () => {
    return activeTab === 'gemini' ? geminiModels : openRouterModels;
  };

  /**
   * Get loading state for current tab
   */
  const isLoadingCurrentModels = () => {
    return activeTab === 'gemini' ? isLoadingGeminiModels : isLoadingORModels;
  };

  return (
    <div className="inline-settings bg-white rounded-lg border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">⚙️ API Settings</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Close"
        >
          <FiX className="text-xl" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('openrouter')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'openrouter'
              ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          🔷 OpenRouter
          {openRouterModels.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">({openRouterModels.length} models)</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('gemini')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'gemini'
              ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          🔶 Google Gemini
          {geminiModels.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">({geminiModels.length} models)</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* OpenRouter Tab */}
        {activeTab === 'openrouter' && (
          <>
            {/* API Key Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                OpenRouter API Key
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs text-primary-600 hover:text-primary-700"
                >
                  Get Key →
                </a>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={openRouterKey}
                  onChange={(e) => {
                    setOpenRouterKey(e.target.value);
                    setOrKeyValid(null);
                  }}
                  placeholder="sk-or-v1-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                />
                {orKeyValid === true && (
                  <FiCheck className="absolute right-3 top-3 text-green-500" />
                )}
              </div>
              <button
                onClick={validateOpenRouterKey}
                disabled={!openRouterKey.trim() || isValidatingOR}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isValidatingOR ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Validating...
                  </>
                ) : (
                  'Validate Key'
                )}
              </button>
              {orKeyValid === false && (
                <p className="text-sm text-red-600">❌ Invalid API key</p>
              )}
              {orKeyValid === true && (
                <p className="text-sm text-green-600">✅ Valid API key</p>
              )}
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Model
                {isLoadingORModels && (
                  <span className="ml-2 text-xs text-gray-500">
                    <FiLoader className="inline animate-spin" /> Loading...
                  </span>
                )}
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoadingORModels}
              >
                {openRouterModels.length === 0 && !isLoadingORModels ? (
                  <option value="">No models available</option>
                ) : (
                  openRouterModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name || model.id}
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-gray-500">
                💰 Access 100+ AI models. Pay only for what you use (~$0.01-0.10 per resume)
              </p>
            </div>
          </>
        )}

        {/* Gemini Tab */}
        {activeTab === 'gemini' && (
          <>
            {/* API Key Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Google Gemini API Key
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs text-primary-600 hover:text-primary-700"
                >
                  Get Key →
                </a>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => {
                    setGeminiKey(e.target.value);
                    setGeminiKeyValid(null);
                  }}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                />
                {geminiKeyValid === true && (
                  <FiCheck className="absolute right-3 top-3 text-green-500" />
                )}
              </div>
              <button
                onClick={validateGeminiKey}
                disabled={!geminiKey.trim() || isValidatingGemini}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isValidatingGemini ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Validating...
                  </>
                ) : (
                  'Validate Key'
                )}
              </button>
              {geminiKeyValid === false && (
                <p className="text-sm text-red-600">❌ Invalid API key</p>
              )}
              {geminiKeyValid === true && (
                <p className="text-sm text-green-600">✅ Valid API key</p>
              )}
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Model
                {isLoadingGeminiModels && (
                  <span className="ml-2 text-xs text-gray-500">
                    <FiLoader className="inline animate-spin" /> Loading...
                  </span>
                )}
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoadingGeminiModels}
              >
                {geminiModels.length === 0 && !isLoadingGeminiModels ? (
                  <option value="">No models available</option>
                ) : (
                  geminiModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name || model.id}
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-gray-500">
                🆓 Free tier available! Direct Google API access with generous quotas
              </p>
            </div>
          </>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">💡 Quick Start</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>1. Enter your API key</li>
            <li>2. Click "Validate Key"</li>
            <li>3. Choose your preferred model</li>
            <li>4. Click "Save Settings"</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end space-x-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
        >
          <FiSave className="mr-2" />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default InlineSettings;
