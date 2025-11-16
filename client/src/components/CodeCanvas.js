import React, { useState, useEffect, useCallback, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { 
  FiX, FiZap, FiMaximize2, FiMinimize2, FiEye, FiEyeOff,
  FiRotateCcw, FiRotateCw, FiBold, FiItalic, FiUnderline, FiLink
} from 'react-icons/fi';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { CodeEditorService } from '../services/codeEditor';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const CodeCanvas = ({ 
  isOpen, 
  onClose, 
  content, 
  onChange, 
  onCompile, 
  isCompiling,
  pdfData,
  isEmbedded = false,
  editorServiceRef: externalEditorServiceRef
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const canvasRef = React.useRef(null);
  const editorRef = useRef(null);
  const localEditorServiceRef = useRef(null);
  
  // Use external ref if provided, otherwise use local
  const editorServiceRef = externalEditorServiceRef || localEditorServiceRef;

  // Initialize editor service when editor view is available
  useEffect(() => {
    if (editorRef.current && editorRef.current.view) {
      if (!editorServiceRef.current) {
        editorServiceRef.current = new CodeEditorService(editorRef.current.view);
      } else {
        editorServiceRef.current.setView(editorRef.current.view);
      }
    }
  }, [editorRef.current?.view, editorServiceRef]);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when canvas is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const renderPDF = useCallback(async () => {
    if (!pdfData || !canvasRef.current) {
      console.log('Canvas: No PDF data or canvas ref');
      return;
    }

    try {
      console.log('Canvas: Starting PDF render...', 'Data length:', pdfData.length);
      
      // Convert base64 to Uint8Array
      const binaryString = atob(pdfData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('Canvas: PDF bytes created:', bytes.length);
      
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const pdf = await loadingTask.promise;
      
      console.log('Canvas: PDF loaded, pages:', pdf.numPages);
      
      const page = await pdf.getPage(1);
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas element not found');
      }
      
      const context = canvas.getContext('2d');
      
      // Calculate scale to fit container with better sizing
      const containerWidth = canvas.parentElement?.offsetWidth || 800;
      const viewport = page.getViewport({ scale: 1.0 });
      // Increased scale for larger preview, max 2.5x
      const scale = Math.min((containerWidth - 80) / viewport.width, 2.5);
      const scaledViewport = page.getViewport({ scale });
      
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };

      await page.render(renderContext).promise;
      console.log('Canvas: ✅ PDF rendered successfully');
    } catch (error) {
      console.error('Canvas: ❌ Error rendering PDF:', error);
    }
  }, [pdfData]);

  useEffect(() => {
    if (pdfData && showPreview && canvasRef.current) {
      renderPDF();
    }
  }, [pdfData, showPreview, renderPDF]);

  // Formatting functions for LaTeX
  const insertLatexCommand = useCallback((command, hasContent = true) => {
    if (!editorRef.current) return;
    
    const view = editorRef.current.view;
    if (!view) return;

    const selection = view.state.selection.main;
    const selectedText = view.state.doc.sliceString(selection.from, selection.to);
    
    let replacement = '';
    if (hasContent && selectedText) {
      replacement = `${command}{${selectedText}}`;
    } else if (hasContent) {
      replacement = `${command}{}`;
    } else {
      replacement = command;
    }

    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: replacement },
      selection: { anchor: selection.from + replacement.length }
    });
    
    view.focus();
  }, []);

  const handleUndo = () => {
    if (editorRef.current?.view) {
      const view = editorRef.current.view;
      // CodeMirror has built-in undo
      view.dispatch({
        effects: []
      });
    }
  };

  const handleRedo = () => {
    if (editorRef.current?.view) {
      const view = editorRef.current.view;
      // CodeMirror has built-in redo
      view.dispatch({
        effects: []
      });
    }
  };

  const handleBold = () => insertLatexCommand('\\textbf', true);
  const handleItalic = () => insertLatexCommand('\\textit', true);
  const handleUnderline = () => insertLatexCommand('\\underline', true);
  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      insertLatexCommand(`\\href{${url}}`, true);
    }
  };

  if (!isOpen && !isEmbedded) return null;

  // Embedded version (Overleaf-style)
  if (isEmbedded) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-1">
            {/* Undo/Redo */}
            <button
              onClick={handleUndo}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <FiRotateCcw className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={handleRedo}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <FiRotateCw className="w-4 h-4 text-gray-700" />
            </button>

            <div className="w-px h-5 bg-gray-300 mx-1"></div>

            {/* Text Formatting */}
            <button
              onClick={handleBold}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors font-bold"
              title="Bold (\\textbf)"
            >
              <FiBold className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={handleItalic}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors italic"
              title="Italic (\\textit)"
            >
              <FiItalic className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={handleUnderline}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="Underline (\\underline)"
            >
              <FiUnderline className="w-4 h-4 text-gray-700" />
            </button>

            <div className="w-px h-5 bg-gray-300 mx-1"></div>

            {/* Insert Link */}
            <button
              onClick={handleLink}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="Insert Link (\\href)"
            >
              <FiLink className="w-4 h-4 text-gray-700" />
            </button>

            {isCompiling && (
              <>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <div className="flex items-center space-x-1 text-xs text-primary-600 px-2">
                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-pulse"></div>
                  <span>Compiling...</span>
                </div>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {content.split('\n').length} lines • {content.length} chars
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <CodeMirror
            ref={editorRef}
            value={content}
            height="100%"
            extensions={[StreamLanguage.define(stex)]}
            onChange={(value) => onChange(value)}
            theme="light"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              foldGutter: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
            }}
            className="h-full text-sm"
          />
        </div>
      </div>
    );
  }

  // Overlay version (original Canvas)
  return (
    <div className={`fixed inset-0 z-50 canvas-overlay ${isOpen ? 'canvas-open' : ''}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Canvas Content */}
      <div className={`absolute inset-0 ${isFullscreen ? '' : 'p-4 md:p-8'} flex items-center justify-center canvas-content`}>
        <div className={`bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden ${
          isFullscreen ? 'w-full h-full' : 'w-full h-full max-w-7xl max-h-[90vh]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <h2 className="ml-4 text-lg font-semibold text-gray-800">LaTeX Canvas</h2>
              {isCompiling && (
                <div className="flex items-center space-x-2 text-sm text-primary-600">
                  <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                  <span>Compiling...</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                title={showPreview ? "Hide Preview" : "Show Preview"}
              >
                {showPreview ? <FiEye className="text-xl" /> : <FiEyeOff className="text-xl" />}
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <FiMinimize2 className="text-xl" /> : <FiMaximize2 className="text-xl" />}
              </button>

              <button
                onClick={() => onCompile(content)}
                disabled={isCompiling}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
              >
                <FiZap className="text-sm" />
                <span>Compile</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                title="Close Canvas"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor */}
            <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r border-gray-200 flex flex-col bg-gray-50`}>
              <div className="flex-1 overflow-hidden">
                <CodeMirror
                  value={content}
                  height="100%"
                  extensions={[StreamLanguage.define(stex)]}
                  onChange={(value) => onChange(value)}
                  theme="light"
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightSpecialChars: true,
                    foldGutter: true,
                    drawSelection: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                  }}
                  className="h-full text-sm"
                />
              </div>
              <div className="px-4 py-2 border-t border-gray-200 bg-white">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Lines: {content.split('\n').length}</span>
                  <span>Characters: {content.length}</span>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className="w-1/2 flex flex-col bg-gray-100">
                <div className="px-4 py-3 border-b border-gray-200 bg-white">
                  <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
                </div>
                <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
                  {isCompiling && (
                    <div className="flex flex-col items-center space-y-4 mt-16">
                      <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-600">Compiling your resume...</p>
                    </div>
                  )}

                  {!isCompiling && !pdfData && (
                    <div className="text-center space-y-3 mt-16">
                      <div className="text-6xl text-gray-300">📄</div>
                      <p className="text-gray-600">Click "Compile" to see preview</p>
                      <p className="text-sm text-gray-400">Your PDF will appear here</p>
                    </div>
                  )}

                  {!isCompiling && pdfData && (
                    <div className="bg-white shadow-2xl rounded-lg overflow-hidden max-w-full">
                      <canvas ref={canvasRef} className="w-full h-auto" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeCanvas;
