import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Header from './components/Header';
import CodeCanvas from './components/CodeCanvas';
import ChatModal from './components/ChatModal';
import PDFPreview from './components/PDFPreview';
import ResizableLayout from './components/ResizableLayout';
import WelcomeScreen from './components/WelcomeScreen';
import { latexAPI } from './services/api';
import { getSettings, saveSettings, getStoredResume, saveResume, getChatHistory } from './utils/storage';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [latexContent, setLatexContent] = useState('');
  const [pdfData, setPdfData] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [settings, setSettings] = useState(getSettings());
  const editorServiceRef = useRef(null);

  // Load stored data on mount
  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = () => {
    const storedResume = getStoredResume();
    const storedChat = getChatHistory();
    
    if (storedResume) {
      setLatexContent(storedResume.latexContent || '');
      setJobDescription(storedResume.jobDescription || '');
      setShowWelcome(false);
    }
    
    if (storedChat && storedChat.length > 0) {
      setChatMessages(storedChat);
    }
  };

  const handleStartNew = async () => {
    try {
      const response = await latexAPI.getTemplate();
      setLatexContent(response.data.template);
      setShowWelcome(false);
      toast.success('Template loaded successfully!');
      
      // Save to storage
      saveResume({
        latexContent: response.data.template,
        jobDescription: '',
        lastModified: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template');
    }
  };

  const handleUploadResume = (content) => {
    setLatexContent(content);
    setShowWelcome(false);
    
    saveResume({
      latexContent: content,
      jobDescription: jobDescription,
      lastModified: new Date().toISOString(),
    });
  };

  const handleLatexChange = (newContent) => {
    setLatexContent(newContent);
    
    // Save to storage
    saveResume({
      latexContent: newContent,
      jobDescription: jobDescription,
      lastModified: new Date().toISOString(),
    });
  };

  const handleCompile = async (content = latexContent) => {
    console.log('handleCompile called with content length:', content?.length || 0);
    console.log('latexContent state length:', latexContent?.length || 0);
    
    if (!content || content.trim().length === 0) {
      toast.error('No content to compile. Please load or create a resume first.');
      return;
    }
    
    setIsCompiling(true);
    try {
      const response = await latexAPI.compile(content);
      
      if (response.data.success) {
        setPdfData(response.data.pdf.base64);
        console.log('PDF data received, length:', response.data.pdf.base64.length);
        toast.success('Resume compiled successfully!');
      } else {
        toast.error('Compilation failed: ' + response.data.error);
      }
    } catch (error) {
      console.error('Compilation error:', error);
      toast.error(error.response?.data?.error || 'Failed to compile LaTeX');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleModelChange = (modelId) => {
    const newSettings = { ...settings, model: modelId };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleSettingsUpdate = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleChatResponse = (updatedLatex) => {
    if (updatedLatex) {
      setLatexContent(updatedLatex);
      handleCompile(updatedLatex);
    }
  };

  // Handler for AI edit commands (e.g., "change name to John Smith")
  const handleAIEditCommand = async (command) => {
    if (!editorServiceRef.current) {
      toast.error('Editor not ready');
      return { success: false, error: 'Editor not ready' };
    }

    try {
      const result = await editorServiceRef.current.executeEditCommand(command, {
        speed: 20, // Faster animation
        highlightDuration: 1500,
        scrollDelay: 200
      });

      if (result.success) {
        // Get updated content from editor
        setTimeout(() => {
          // Auto-compile after edit
          toast.success(`Updated ${result.field}: ${result.oldValue} → ${result.newValue}`);
          handleCompile();
        }, 500);
      } else {
        toast.error(result.error || 'Could not apply edit');
      }

      return result;
    } catch (error) {
      console.error('Edit command error:', error);
      toast.error('Failed to execute edit');
      return { success: false, error: error.message };
    }
  };

  const handleJobDescriptionChange = (jd) => {
    setJobDescription(jd);
    
    saveResume({
      latexContent: latexContent,
      jobDescription: jd,
      lastModified: new Date().toISOString(),
    });
  };

  if (showWelcome) {
    return (
      <>
        <Toaster position="top-right" />
        <WelcomeScreen
          onStartNew={handleStartNew}
          onUploadResume={handleUploadResume}
        />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toaster position="top-right" />
      
      <Header
        onNewResume={() => {
          setShowWelcome(true);
          setLatexContent('');
          setPdfData(null);
          setChatMessages([]);
          setJobDescription('');
          setShowChat(false);
        }}
        onCompile={handleCompile}
        onDownload={() => {
          if (pdfData) {
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${pdfData}`;
            link.download = 'resume.pdf';
            link.click();
          }
        }}
        isCompiling={isCompiling}
        pdfData={pdfData}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <ResizableLayout
          showMiddle={showChat}
          leftPanel={
            <CodeCanvas
              isOpen={true}
              onClose={() => {}}
              content={latexContent}
              onChange={handleLatexChange}
              onCompile={handleCompile}
              isCompiling={isCompiling}
              pdfData={pdfData}
              isEmbedded={true}
              editorServiceRef={editorServiceRef}
            />
          }
          middlePanel={
            <PDFPreview
              pdfData={pdfData}
              isCompiling={isCompiling}
            />
          }
          rightPanel={
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-gray-200">AI Assistant</h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
                  title="Close Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatModal
                  isOpen={true}
                  onClose={() => {}}
                  messages={chatMessages}
                  onMessagesChange={setChatMessages}
                  latexContent={latexContent}
                  jobDescription={jobDescription}
                  onJobDescriptionChange={handleJobDescriptionChange}
                  onLatexUpdate={handleChatResponse}
                  onAIEditCommand={handleAIEditCommand}
                  settings={settings}
                  onModelChange={handleModelChange}
                  onSettingsUpdate={handleSettingsUpdate}
                  isEmbedded={true}
                />
              </div>
            </>
          }
        />

        {/* AI Chat Toggle Button (when closed) */}
        {!showChat && (
          <button
            onClick={() => setShowChat(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-white z-40"
            title="Open AI Chat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        )}
      </div>

    </div>
  );
}

export default App;
