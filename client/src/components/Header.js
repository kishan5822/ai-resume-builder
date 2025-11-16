import React from 'react';
import { FiFileText, FiZap, FiDownload } from 'react-icons/fi';

const Header = ({ 
  onNewResume, 
  onCompile, 
  onDownload, 
  isCompiling, 
  pdfData
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onNewResume}
          className="flex items-center space-x-2 hover:opacity-80 transition-all duration-300 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
            <FiFileText className="text-white text-xl transition-transform group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 transition-colors">AI Resume Builder</h1>
            <p className="text-xs text-gray-500 transition-colors">LaTeX-powered with AI assistance</p>
          </div>
        </button>
      </div>

      <div className="flex items-center space-x-3">
        {/* Compile Button */}
        <button
          onClick={() => {
            console.log('Header compile button clicked');
            onCompile();
          }}
          disabled={isCompiling}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-105 active:scale-95 disabled:hover:scale-100"
        >
          <FiZap className={`text-sm transition-transform ${isCompiling ? 'animate-spin' : ''}`} />
          <span>{isCompiling ? 'Compiling...' : 'Compile'}</span>
        </button>

        {/* Download Button */}
        {pdfData && (
          <button
            onClick={onDownload}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all duration-200 hover:scale-105 active:scale-95 animate-fade-in"
          >
            <FiDownload className="text-sm animate-bounce-gentle" />
            <span>Download</span>
          </button>
        )}

        {/* New Chat Button */}
        <button
          onClick={onNewResume}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          New Chat
        </button>
      </div>
    </header>
  );
};

export default Header;
