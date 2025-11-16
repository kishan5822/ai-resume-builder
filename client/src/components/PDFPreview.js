import React, { useEffect, useRef, useState } from 'react';
import { FiLoader } from 'react-icons/fi';

const PDFPreview = ({ pdfData, isCompiling }) => {
  const iframeRef = useRef(null);
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    if (pdfData && iframeRef.current) {
      try {
        console.log('Loading PDF in iframe...', 'Data length:', pdfData.length);
        
        // Validate base64 data
        if (!pdfData || pdfData.length < 100) {
          throw new Error('PDF data is too short or invalid');
        }

        // Create blob URL for the PDF
        const pdfBlob = base64ToBlob(pdfData, 'application/pdf');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Set iframe src
        iframeRef.current.src = pdfUrl;
        setRenderError(null);
        
        console.log('✅ PDF loaded in iframe successfully');
        
        // Cleanup URL when component unmounts
        return () => {
          URL.revokeObjectURL(pdfUrl);
        };
      } catch (error) {
        console.error('❌ Error loading PDF:', error);
        setRenderError(error.message || 'Failed to load PDF');
      }
    }
  }, [pdfData]);

  // Helper function to convert base64 to Blob
  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Preview Content */}
      <div className="flex-1 overflow-hidden bg-gray-100 relative">
        {isCompiling && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center space-y-4">
              <FiLoader className="text-4xl text-primary-600 animate-spin" />
              <p className="text-gray-600">Compiling your resume...</p>
            </div>
          </div>
        )}

        {!isCompiling && !pdfData && !renderError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center space-y-2">
              <div className="text-6xl text-gray-300">📄</div>
              <p className="text-gray-600">Your resume preview will appear here</p>
              <p className="text-sm text-gray-400">Click "Compile" to generate PDF</p>
            </div>
          </div>
        )}

        {!isCompiling && renderError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center space-y-2">
              <div className="text-6xl text-red-300">⚠️</div>
              <p className="text-red-600">Failed to render PDF</p>
              <p className="text-sm text-gray-500">{renderError}</p>
            </div>
          </div>
        )}

        {/* Interactive PDF iframe */}
        {!isCompiling && pdfData && !renderError && (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="PDF Preview"
          />
        )}
      </div>
    </div>
  );
};

export default PDFPreview;
