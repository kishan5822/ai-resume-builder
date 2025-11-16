import React from 'react';
import { FiX } from 'react-icons/fi';
import ChatPanel from './ChatPanel';

const ChatModal = ({ isOpen, onClose, isEmbedded = false, ...chatProps }) => {
  if (!isOpen) return null;

  // Embedded version (for 3-panel layout)
  if (isEmbedded) {
    return (
      <div className="h-full flex flex-col">
        <ChatPanel {...chatProps} />
      </div>
    );
  }

  // Modal version (overlay)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
          <h2 className="text-lg font-semibold text-gray-800">AI Resume Assistant</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Close Chat"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <ChatPanel {...chatProps} />
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
