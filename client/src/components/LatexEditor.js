import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { FiZap, FiX } from 'react-icons/fi';

const LatexEditor = ({ content, onChange, onCompile, isCompiling, onClose }) => {
  const handleManualCompile = () => {
    onCompile(content);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-semibold text-gray-700">LaTeX Code Editor</h2>
          {isCompiling && (
            <div className="flex items-center space-x-2 text-xs text-primary-600">
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
              <span>Compiling...</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualCompile}
            disabled={isCompiling}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
          >
            <FiZap className="text-sm" />
            <span>Compile</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
              title="Close editor"
            >
              <FiX className="text-lg" />
            </button>
          )}
        </div>
      </div>

      {/* Code Editor */}
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

      {/* Editor Footer */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Lines: {content.split('\n').length}</span>
          <span>Characters: {content.length}</span>
        </div>
      </div>
    </div>
  );
};

export default LatexEditor;
