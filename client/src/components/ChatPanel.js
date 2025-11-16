import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiX, FiSettings, FiSquare, FiEdit2, FiCopy, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { aiAPI, uploadAPI } from '../services/api';
import { saveChatHistory, saveSettings } from '../utils/storage';
import { LatexSectionService } from '../services/latexSection';
import InlineSettings from './InlineSettings';

const ChatPanel = ({
  messages,
  onMessagesChange,
  latexContent,
  jobDescription,
  onJobDescriptionChange,
  onLatexUpdate,
  onAIEditCommand,
  settings,
  onModelChange,
  onSettingsUpdate,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset file input
    e.target.value = '';

    // Check file type
    const fileType = file.name.toLowerCase();
    if (!fileType.endsWith('.pdf') && !fileType.endsWith('.docx')) {
      toast.error('Please upload only PDF or DOCX files');
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading(`Uploading ${file.name}...`);

    try {
      const response = await uploadAPI.uploadJobDescription(file);
      
      if (response.data && response.data.success) {
        setUploadedFile({
          name: file.name,
          content: response.data.content,
        });
        onJobDescriptionChange(response.data.content);
        
        // Determine file type for better message
        const fileTypeLabel = fileType.endsWith('.pdf') ? 'PDF' : 'DOCX';
        toast.success(`${fileTypeLabel} uploaded! Ask me anything about it.`, { id: loadingToast });
        
        // Don't add system message - wait for user to ask questions
        // This is how ChatGPT/Claude work - they wait for user input after file upload
      } else {
        toast.error('Upload failed: Invalid response from server', { id: loadingToast });
      }
    } catch (error) {
      console.error('File upload error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.message || 'Network error or file is too large';
      toast.error(`Upload failed: ${errorMessage}`, { id: loadingToast });
    }
  };

  // Detect if message is an edit command
  const isEditCommand = (text) => {
    const editKeywords = [
      'change', 'update', 'edit', 'modify', 'replace', 'set',
      'name', 'email', 'phone', 'address', 'linkedin', 'github'
    ];
    const lowerText = text.toLowerCase();
    return editKeywords.some(keyword => lowerText.includes(keyword));
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      toast('Generation stopped', { icon: '⏹️' });
    }
  };

  const handleEditMessage = (index) => {
    const messageToEdit = messages[index];
    if (messageToEdit.role === 'user') {
      setInput(messageToEdit.content);
      setEditingMessageIndex(index);
      // Focus the textarea
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(
          messageToEdit.content.length,
          messageToEdit.content.length
        );
      }, 100);
      toast('Editing message - modify and send', { icon: '✏️' });
    }
  };

  const handleCopyMessage = (content) => {
    // Remove code blocks from the content before copying
    const cleanContent = content.replace(/```latex\n[\s\S]*?\n```/g, '').trim();
    navigator.clipboard.writeText(cleanContent);
    toast.success('Copied to clipboard');
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Check if the selected model is a Gemini model
    const isGeminiModel = settings.model?.startsWith('gemini');
    const requiredKey = isGeminiModel ? settings.geminiApiKey : settings.apiKey;
    const providerName = isGeminiModel ? 'Google Gemini' : 'OpenRouter';

    if (!requiredKey) {
      toast.error(`Please configure your ${providerName} API key in settings`);
      return;
    }

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    let updatedMessages;
    
    if (editingMessageIndex !== null) {
      // Editing mode: Remove all messages after the edited one
      updatedMessages = messages.slice(0, editingMessageIndex);
      updatedMessages.push(userMessage);
      setEditingMessageIndex(null);
      toast('Message edited and resent', { icon: '✅' });
    } else {
      // Normal mode: Just append
      updatedMessages = [...messages, userMessage];
    }

    onMessagesChange(updatedMessages);
    saveChatHistory(updatedMessages);
    const originalInput = input;
    setInput('');
    setIsLoading(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Try to handle as edit command first if it looks like one
      if (isEditCommand(originalInput) && onAIEditCommand) {
        const editResult = await onAIEditCommand(originalInput);
        
        if (editResult.success) {
          // Edit successful - add confirmation message
          const confirmMessage = {
            role: 'assistant',
            content: `✅ I've updated your ${editResult.field} from "${editResult.oldValue}" to "${editResult.newValue}" and recompiled the resume.`,
            timestamp: new Date().toISOString(),
          };
          
          const finalMessages = [...updatedMessages, confirmMessage];
          onMessagesChange(finalMessages);
          saveChatHistory(finalMessages);
          setIsLoading(false);
          return; // Exit early - edit handled
        }
        // If edit failed, fall through to AI API
      }
      // Prepare messages for API
      const apiMessages = updatedMessages
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Prepare uploaded files for AI context
      const filesForAI = uploadedFile ? [{
        name: uploadedFile.name,
        content: uploadedFile.content,
        type: uploadedFile.type || 'unknown'
      }] : [];

      // Debug: Log what we're sending to the API
      console.log('📤 Sending to AI API:');
      console.log('  - LaTeX content length:', latexContent?.length || 0);
      console.log('  - LaTeX preview:', latexContent?.substring(0, 100) || 'EMPTY');
      console.log('  - Messages count:', apiMessages.length);
      console.log('  - Model:', settings.model);

      const response = await aiAPI.chat(
        apiMessages,
        latexContent,
        jobDescription,
        requiredKey,
        settings.model,
        abortControllerRef.current.signal,
        sessionId,
        filesForAI
      );

      if (response.data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date().toISOString(),
          conversationId: response.data.conversationId, // For rating
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        onMessagesChange(finalMessages);
        saveChatHistory(finalMessages);

        // Debug: Log the full AI response
        console.log('🤖 AI Response:', response.data.message);

        // Check if response contains LaTeX code (flexible regex to catch different formats)
        const latexCodeMatch = response.data.message.match(/```latex\s*\n([\s\S]*?)\n\s*```/);
        
        if (latexCodeMatch) {
          const aiGeneratedCode = latexCodeMatch[1];
          console.log('✅ LaTeX code extracted from AI:');
          console.log('  - Length:', aiGeneratedCode.length);
          console.log('  - Is full document:', /\\documentclass/.test(aiGeneratedCode));
          
          // Check if AI returned a full document
          const isFullDocument = /\\documentclass/.test(aiGeneratedCode) && 
                                  /\\begin\{document\}/.test(aiGeneratedCode) && 
                                  /\\end\{document\}/.test(aiGeneratedCode);
          
          if (isFullDocument) {
            // Full document - just replace everything
            console.log('✅ Applying complete resume update');
            onLatexUpdate(aiGeneratedCode);
            toast.success('Resume updated successfully');
          } else {
            // Partial update - try intelligent merge (fallback for backward compatibility)
            console.log('⚠️ Partial update detected, attempting merge');
            console.log('📋 Current resume length:', latexContent?.length || 0);
            
            // Intelligently merge the code
            const updateResult = LatexSectionService.updateLatexIntelligently(
              latexContent,
              aiGeneratedCode,
              originalInput
            );

            console.log('🔧 Update result:', {
              updateType: updateResult.updateType,
              section: updateResult.section,
              newLength: updateResult.latex?.length || 0,
              warning: updateResult.warning
            });

            if (updateResult.warning) {
              toast(updateResult.warning, { icon: '⚠️' });
            } else if (updateResult.updateType === 'section') {
              toast.success(`Updated ${updateResult.section} section`);
            } else {
              toast.success('Resume updated successfully');
            }

            onLatexUpdate(updateResult.latex);
          }
        } else {
          // Debug: Check if AI sent code but we couldn't extract it
          if (response.data.message.includes('```')) {
            console.warn('⚠️ Found code block but failed to extract LaTeX:', response.data.message);
            toast.error('Failed to extract code from AI response');
          }
        }
      } else {
        toast.error(response.data.error || 'AI request failed');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Don't show error if request was aborted
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        return; // Request was cancelled by user
      }
      
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSettingsSave = (newSettings) => {
    // Save to localStorage
    saveSettings(newSettings);
    // Update parent App component state
    if (onSettingsUpdate) {
      onSettingsUpdate(newSettings);
    } else if (onModelChange) {
      // Fallback for backward compatibility
      onModelChange(newSettings.model);
    }
    // Close settings panel
    setShowSettings(false);
  };

  const handleRating = async (messageIndex, wasHelpful) => {
    const message = messages[messageIndex];
    if (!message.conversationId) {
      toast.error('Cannot rate this message');
      return;
    }

    try {
      await aiAPI.rateResponse(message.conversationId, wasHelpful ? 5 : 1, wasHelpful);
      
      // Update message to show rated state
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = { ...message, rated: wasHelpful ? 'up' : 'down' };
      onMessagesChange(updatedMessages);
      saveChatHistory(updatedMessages);
      
      toast.success(wasHelpful ? '👍 Thanks for the feedback!' : '👎 I\'ll learn from this');
    } catch (error) {
      console.error('Rating error:', error);
      toast.error('Failed to save rating');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Inline Settings */}
      {showSettings && (
        <div className="p-4">
          <InlineSettings
            settings={settings}
            onSave={handleSettingsSave}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}

      {/* Job Description Badge */}
      {uploadedFile && !showSettings && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between animate-slide-down">
          <div className="flex items-center space-x-2 text-sm">
            <FiPaperclip className="text-blue-600 animate-bounce-gentle" />
            <span className="text-blue-900 font-medium">{uploadedFile.name}</span>
            <span className="text-xs text-blue-600">({uploadedFile.type})</span>
          </div>
          <button
            onClick={() => {
              setUploadedFile(null);
              onJobDescriptionChange('');
              toast.success('File removed');
            }}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-1 transition-all duration-200 hover:scale-110 active:scale-95"
            title="Remove file"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 pb-6 space-y-6 ${showSettings ? 'hidden' : ''}`}>
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4 fade-in-up">
            <div className="text-6xl animate-bounce-gentle">💬</div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800 stagger-item">
                Hi! How can I help you today?
              </h3>
              <p className="text-sm text-gray-600 max-w-xs mx-auto stagger-item">
                I can help you create or improve your resume
              </p>
            </div>
            <div className="space-y-2 pt-4">
              <p className="text-xs text-gray-500">Example prompts:</p>
              <div className="space-y-2">
                <div className="text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg px-4 py-2 inline-block cursor-pointer transition-colors border border-gray-200">
                  "Create a resume for a software engineer"
                </div>
                <br/>
                <div className="text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg px-4 py-2 inline-block cursor-pointer transition-colors border border-gray-200">
                  "Improve my resume for this job description"
                </div>
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          // Check if this is the last user message
          const isLastUserMessage = message.role === 'user' && 
            index === messages.map((m, i) => m.role === 'user' ? i : -1).filter(i => i !== -1).pop();
          
          return (
            <div
              key={index}
              className={`message-appear group py-6 px-4 hover:bg-gray-50/50 transition-all duration-300 ${
                message.role === 'assistant' ? 'bg-gray-50/30' : ''
              }`}
            >
              <div className={`max-w-3xl mx-auto ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`${message.role === 'user' ? 'max-w-[85%]' : 'w-full'}`}>
                  {/* Message content */}
                  <div className="min-w-0">
                    {message.role === 'assistant' ? (
                      <div className="prose prose-gray prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            // Display code blocks with syntax highlighting
                            code: ({node, inline, className, children, ...props}) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              
                              return !inline && match ? (
                                <div className="relative my-4 rounded-lg overflow-hidden bg-[#1e1e1e] border border-gray-300">
                                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                                    <span className="text-xs text-gray-300 font-mono">{match[1]}</span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(codeString);
                                        toast.success('Code copied!');
                                      }}
                                      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                    >
                                      <FiCopy className="text-xs" />
                                      Copy code
                                    </button>
                                  </div>
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{
                                      margin: 0,
                                      padding: '1rem',
                                      background: '#1e1e1e',
                                      fontSize: '13px',
                                      lineHeight: '1.6',
                                    }}
                                    {...props}
                                  >
                                    {codeString}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-orange-600 border border-gray-200" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            // Style other markdown elements
                            strong: ({node, ...props}) => <strong className="text-orange-600 font-semibold" {...props} />,
                            em: ({node, ...props}) => <em className="text-gray-700" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="text-gray-800" {...props} />,
                            p: ({node, ...props}) => <p className="text-[15px] leading-relaxed mb-3 last:mb-0 text-gray-800" {...props} />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-gray-800">
                        {message.content}
                      </div>
                    )}
                    
                    {/* Action buttons below message - ChatGPT style */}
                    <div className={`flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                      message.role === 'user' ? 'justify-end' : ''
                    }`}>
                      <button
                        onClick={() => handleCopyMessage(message.content)}
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all duration-200 hover:scale-110 active:scale-95"
                        title="Copy"
                      >
                        <FiCopy className="text-sm transition-transform" />
                      </button>
                      
                      {/* Rating buttons for AI responses */}
                      {message.role === 'assistant' && message.conversationId && (
                        <>
                          <button
                            onClick={() => handleRating(index, true)}
                            className={`p-1 rounded transition-all duration-200 hover:scale-110 active:scale-95 ${
                              message.rated === 'up' 
                                ? 'text-green-600 bg-green-50' 
                                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title="Good response"
                            disabled={message.rated}
                          >
                            <FiThumbsUp className="text-sm transition-transform" />
                          </button>
                          <button
                            onClick={() => handleRating(index, false)}
                            className={`p-1 rounded transition-all duration-200 hover:scale-110 active:scale-95 ${
                              message.rated === 'down' 
                                ? 'text-red-600 bg-red-50' 
                                : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Needs improvement"
                            disabled={message.rated}
                          >
                            <FiThumbsDown className="text-sm transition-transform" />
                          </button>
                        </>
                      )}
                      
                      {message.role === 'user' && isLastUserMessage && !isLoading && (
                        <button
                          onClick={() => handleEditMessage(index)}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all duration-200 hover:scale-110 active:scale-95 animate-fade-in"
                          title="Edit"
                        >
                          <FiEdit2 className="text-sm transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="py-6 px-4 bg-gray-50/30 animate-fade-in">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Claude Style */}
      {!showSettings && (
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="bg-white rounded-xl border border-gray-300 focus-within:border-orange-500 transition-colors shadow-sm">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.tex"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          {editingMessageIndex !== null && (
            <div className="px-4 pt-3 pb-2 bg-orange-50 border-l-2 border-orange-500 animate-slide-down">
              <div className="flex items-center justify-between">
                <span className="text-xs text-orange-600 font-medium flex items-center">
                  <FiEdit2 className="mr-1.5 animate-bounce-gentle" />
                  Editing message
                </span>
                <button
                  onClick={() => {
                    setEditingMessageIndex(null);
                    setInput('');
                    toast('Edit cancelled', { icon: '❌' });
                  }}
                  className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={editingMessageIndex !== null ? "Modify message and press Enter to resend..." : "Reply to AI Resume Builder..."}
            className="w-full px-4 pt-3 pb-2 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-sm"
            style={{ 
              minHeight: '80px', 
              maxHeight: '400px', 
              resize: 'vertical',
              overflowY: 'auto'
            }}
            disabled={isLoading}
          />
          
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                title="Upload document (PDF/DOCX/TEX)"
              >
                <FiPaperclip className="text-lg transition-transform" />
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                title="Settings"
              >
                <FiSettings className={`text-lg transition-all duration-300 ${showSettings ? 'rotate-90' : ''}`} />
              </button>
            </div>

            <button
              onClick={isLoading ? handleStopGeneration : handleSendMessage}
              disabled={!isLoading && !input.trim()}
              className={`button-press hover-lift p-2 text-white rounded-lg transition-all duration-200 transform ${
                isLoading 
                  ? 'bg-red-500 hover:bg-red-600 hover:scale-105' 
                  : 'bg-orange-600 hover:bg-orange-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
              }`}
              title={isLoading ? 'Stop generation' : 'Send message'}
            >
              {isLoading ? (
                <FiSquare className="text-base transition-transform" />
              ) : (
                <FiSend className="text-base transition-transform" />
              )}
            </button>
          </div>
        </div>
        
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">
              AI can make mistakes. Please double-check responses.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
