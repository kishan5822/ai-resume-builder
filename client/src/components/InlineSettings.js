import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiEdit2, FiCheck, FiChevronDown, FiSave } from 'react-icons/fi';
import { aiAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import './InlineSettings.css';

const InlineSettings = ({ settings, onSave, onClose }) => {
  // Provider options
  const providers = [
    { id: 'openrouter', name: 'OpenRouter', icon: '🔷' },
    { id: 'google', name: 'Google', icon: '🔶' }
  ];

  // State
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [selectedModel, setSelectedModel] = useState(settings.model || 'anthropic/claude-3.5-sonnet');
  const [openRouterKey, setOpenRouterKey] = useState(settings.apiKey || '');
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [showApiInput, setShowApiInput] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [allModels, setAllModels] = useState({
    openrouter: [],
    google: []
  });
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [keysLoaded, setKeysLoaded] = useState(false);

  // Dropdown states
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  // Refs
  const providerDropdownRef = useRef(null);
  const modelDropdownRef = useRef(null);

  // Load API keys from settings on mount
  useEffect(() => {
    setOpenRouterKey(settings.apiKey || '');
    setGeminiKey(settings.geminiApiKey || '');
    setKeysLoaded(true);
  }, [settings.apiKey, settings.geminiApiKey]);

  // Load models after keys are loaded
  useEffect(() => {
    if (keysLoaded) {
      loadAllModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysLoaded]);

  // Detect provider from model
  useEffect(() => {
    const isGemini = selectedModel.startsWith('gemini');
    setSelectedProvider(isGemini ? 'google' : 'openrouter');
  }, [selectedModel]);

  // Load models from API
  const loadAllModels = async () => {
    setIsLoadingModels(true);
    try {
      console.log('🔍 Loading models with API keys:', {
        openRouter: openRouterKey ? 'SET' : 'NOT SET',
        gemini: geminiKey ? 'SET' : 'NOT SET'
      });
      
      // Fetch OpenRouter models - pass API key if available for live data
      const openRouterResponse = await aiAPI.getModels('openrouter', openRouterKey);
      const geminiResponse = await aiAPI.getModels('gemini', geminiKey);

      const openRouterModels = openRouterResponse.data.models || [];
      const geminiModels = geminiResponse.data.models || [];
      
      console.log(`✅ OpenRouter: ${openRouterModels.length} models`);
      console.log(`✅ Gemini: ${geminiModels.length} models`);

      setAllModels({
        openrouter: openRouterModels.map(m => ({
          id: m.id,
          name: m.name,
          tags: []
        })),
        google: geminiModels.map(m => ({
          id: m.id,
          name: m.name,
          tags: []
        }))
      });
      
      toast.success(`Loaded ${openRouterModels.length} OpenRouter + ${geminiModels.length} Gemini models`);
    } catch (error) {
      console.error('Failed to load models:', error);
      toast.error('Failed to load models. Using defaults.');
      
      // Fallback to hardcoded popular models
      setAllModels({
        openrouter: [
          { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', tags: [] },
          { id: 'openai/gpt-4o', name: 'GPT-4o', tags: [] },
          { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', tags: [] },
        ],
        google: [
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tags: [] },
          { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tags: [] },
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tags: [] },
        ]
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target)) {
        setProviderDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter models based on search
  const filteredModels = (allModels[selectedProvider] || []).filter(model =>
    model.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
    model.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
    (model.tags && model.tags.some(tag => tag.toLowerCase().includes(modelSearch.toLowerCase())))
  );
  
  // Debug: Log filtered models count
  useEffect(() => {
    console.log(`🔍 Filtered models for ${selectedProvider}:`, filteredModels.length);
    console.log(`📊 All models state:`, {
      openrouter: allModels.openrouter?.length || 0,
      google: allModels.google?.length || 0
    });
  }, [filteredModels.length, selectedProvider, allModels]);

  // Get current API key based on provider
  const getCurrentApiKey = () => {
    return selectedProvider === 'google' ? geminiKey : openRouterKey;
  };

  // Check if API key is set
  const isKeySet = () => {
    const key = getCurrentApiKey();
    return key && key.trim().length > 0;
  };

  // Validate API key
  const handleValidateKey = async () => {
    const key = getCurrentApiKey();
    if (!key.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setIsValidating(true);
    try {
      const response = await aiAPI.validateKey(key, selectedProvider);
      if (response.data.valid) {
        toast.success('✅ API key is valid!');
        
        // Reload models with the validated API key
        if (selectedProvider === 'google') {
          await reloadGeminiModels(key);
        } else {
          // Reload OpenRouter models
          await loadAllModels();
        }
      } else {
        toast.error('❌ Invalid API key');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate API key');
    } finally {
      setIsValidating(false);
    }
  };

  // Reload Gemini models with API key
  const reloadGeminiModels = async (apiKey) => {
    try {
      console.log('🔄 Reloading Gemini models with validated API key:', apiKey ? 'Key present' : 'No key');
      const geminiResponse = await aiAPI.getModels('gemini', apiKey);
      
      console.log('📦 Full Gemini response:', geminiResponse.data);
      
      const geminiModels = geminiResponse.data.models || [];
      
      console.log(`✅ Loaded ${geminiModels.length} Gemini models`);
      console.log('First 10 models:', geminiModels.slice(0, 10).map(m => ({ id: m.id, name: m.name })));
      
      const mappedModels = geminiModels.map(m => ({
        id: m.id,
        name: m.name,
        tags: []
      }));
      
      console.log('📝 Setting models to state:', mappedModels.length);
      
      setAllModels(prev => {
        console.log('Previous state:', prev.google?.length || 0, 'models');
        return {
          ...prev,
          google: mappedModels
        };
      });
      
      toast.success(`✅ Loaded ${geminiModels.length} Gemini models`);
    } catch (error) {
      console.error('❌ Failed to reload Gemini models:', error);
      toast.error('Failed to reload Gemini models');
    }
  };

  // Handle save
  const handleSave = () => {
    const newSettings = {
      apiKey: openRouterKey,
      geminiApiKey: geminiKey,
      model: selectedModel,
      theme: settings.theme || 'light',
    };

    onSave(newSettings);
    toast.success('Settings saved!');
    onClose();
  };

  // Handle provider change
  const handleProviderChange = (providerId) => {
    setSelectedProvider(providerId);
    setProviderDropdownOpen(false);
    setProviderSearch('');
    
    // Auto-select first model of new provider if current model doesn't belong to new provider
    const providerModels = allModels[providerId] || [];
    const currentModelBelongsToProvider = providerModels.some(m => m.id === selectedModel);
    
    if (!currentModelBelongsToProvider && providerModels.length > 0) {
      setSelectedModel(providerModels[0].id);
    }
  };

  // Handle model change
  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    setModelDropdownOpen(false);
    setModelSearch('');
  };

  return (
    <div className="inline-settings-container animate-slide-in">
      {/* Header Bar with Dropdowns */}
      <div className="settings-header">
        <div className="dropdowns-container">
          {/* Provider Dropdown */}
          <div className="dropdown-wrapper" ref={providerDropdownRef}>
            <button
              className="dropdown-trigger"
              onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
            >
              <span className="dropdown-icon">
                {providers.find(p => p.id === selectedProvider)?.icon}
              </span>
              <span className="dropdown-text">
                {providers.find(p => p.id === selectedProvider)?.name}
              </span>
              <FiChevronDown className={`chevron ${providerDropdownOpen ? 'rotate' : ''}`} />
            </button>

            {providerDropdownOpen && (
              <div className="dropdown-menu animate-fade-in">
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  className="dropdown-search"
                  autoFocus
                />
                <div className="dropdown-items">
                  {providers
                    .filter(p => p.name.toLowerCase().includes(providerSearch.toLowerCase()))
                    .map(provider => (
                      <button
                        key={provider.id}
                        className={`dropdown-item ${selectedProvider === provider.id ? 'active' : ''}`}
                        onClick={() => handleProviderChange(provider.id)}
                      >
                        <span className="item-icon">{provider.icon}</span>
                        <span className="item-text">{provider.name}</span>
                        {selectedProvider === provider.id && <FiCheck className="item-check" />}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Model Dropdown */}
          <div className="dropdown-wrapper" ref={modelDropdownRef}>
            <button
              className="dropdown-trigger"
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              disabled={isLoadingModels}
            >
              <span className="dropdown-text">
                {isLoadingModels 
                  ? 'Loading models...' 
                  : (allModels[selectedProvider] || []).find(m => m.id === selectedModel)?.name || 'Select Model'}
              </span>
              <FiChevronDown className={`chevron ${modelDropdownOpen ? 'rotate' : ''}`} />
            </button>

            {modelDropdownOpen && (
              <div className="dropdown-menu animate-fade-in">
                <input
                  type="text"
                  placeholder="Search models..."
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  className="dropdown-search"
                  autoFocus
                />
                <div className="dropdown-items">
                  {isLoadingModels ? (
                    <div className="dropdown-loading">
                      <div className="loading-spinner"></div>
                      <span>Loading {selectedProvider === 'google' ? 'Gemini' : 'OpenRouter'} models...</span>
                    </div>
                  ) : filteredModels.length === 0 ? (
                    <div className="dropdown-empty">
                      No models found matching "{modelSearch}"
                    </div>
                  ) : (
                    filteredModels.map(model => (
                      <button
                        key={model.id}
                        className={`dropdown-item ${selectedModel === model.id ? 'active' : ''}`}
                        onClick={() => handleModelChange(model.id)}
                      >
                        <div className="item-content">
                          <span className="item-text">{model.name}</span>
                          {model.tags && model.tags.length > 0 && (
                            <div className="item-tags">
                              {model.tags.map(tag => (
                                <span key={tag} className="tag">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {selectedModel === model.id && <FiCheck className="item-check" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Key Section */}
      <div className="api-key-section">
        <div className="api-key-status">
          <span className="status-label">
            {selectedProvider === 'google' ? 'Google' : 'OpenRouter'} API Key:
          </span>
          <span className={`status-value ${isKeySet() ? 'set' : 'not-set'}`}>
            {isKeySet() ? (
              <>
                <FiCheck className="status-icon" />
                Set
              </>
            ) : (
              'Not set (will still work if set in .env file)'
            )}
          </span>
          <button
            className="edit-button"
            onClick={() => setShowApiInput(!showApiInput)}
            title="Edit API key"
          >
            <FiEdit2 />
          </button>
          <a
            href={selectedProvider === 'google' 
              ? 'https://makersuite.google.com/app/apikey'
              : 'https://openrouter.ai/keys'}
            target="_blank"
            rel="noopener noreferrer"
            className="get-key-link"
          >
            Get API Key 🔗
          </a>
        </div>

        {/* API Key Input (shown when edit icon clicked) */}
        {showApiInput && (
          <div className="api-key-input-container animate-slide-down">
            <input
              type="password"
              placeholder={`Enter ${selectedProvider === 'google' ? 'Google' : 'OpenRouter'} API key...`}
              value={selectedProvider === 'google' ? geminiKey : openRouterKey}
              onChange={(e) => {
                if (selectedProvider === 'google') {
                  setGeminiKey(e.target.value);
                } else {
                  setOpenRouterKey(e.target.value);
                }
              }}
              className="api-key-input"
            />
            <button
              onClick={handleValidateKey}
              disabled={isValidating || !getCurrentApiKey().trim()}
              className="validate-button"
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </button>
          </div>
        )}
      </div>

      {/* Footer with Close and Save buttons */}
      <div className="settings-footer">
        <button className="close-button-footer" onClick={onClose}>
          <FiX />
          <span>Close</span>
        </button>
        <button className="save-button" onClick={handleSave}>
          <FiSave />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
};

export default InlineSettings;
