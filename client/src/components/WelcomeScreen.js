import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFileText, FiZap } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { uploadAPI } from '../services/api';

const WelcomeScreen = ({ onStartNew, onUploadResume }) => {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const response = await uploadAPI.uploadResume(file);
      
      if (response.data.success) {
        // If it's a LaTeX file, use the content directly
        if (file.name.endsWith('.tex')) {
          onUploadResume(response.data.content);
        } else {
          // For PDF/DOCX, we need to convert to LaTeX
          // For MVP, we'll just show the text content
          toast.success('Resume uploaded! Please edit the LaTeX template with your information.');
          onStartNew(); // Start with template and let user edit
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload resume');
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/x-tex': ['.tex'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-xl mb-6">
            <FiFileText className="text-6xl text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Resume Builder
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create professional resumes with LaTeX and AI assistance. Tailor your resume to any job description in seconds.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Start New */}
          <div
            onClick={onStartNew}
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-primary-500 animate-slide-up"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-primary-100 rounded-full group-hover:bg-primary-500 transition-colors duration-300">
                <FiZap className="text-4xl text-primary-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Start New Resume</h3>
              <p className="text-gray-600">
                Begin with our professional FAANGPath template and customize it with AI assistance
              </p>
              <div className="pt-4">
                <button className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg">
                  Create New
                </button>
              </div>
            </div>
          </div>

          {/* Upload Resume */}
          <div
            {...getRootProps()}
            className={`group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-dashed ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-500'
            } animate-slide-up`}
            style={{ animationDelay: '0.1s' }}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-full transition-colors duration-300 ${
                isDragActive
                  ? 'bg-primary-500'
                  : 'bg-gray-100 group-hover:bg-primary-100'
              }`}>
                <FiUpload className={`text-4xl transition-colors duration-300 ${
                  isDragActive
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-primary-600'
                }`} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {isUploading ? 'Uploading...' : 'Upload Resume'}
              </h3>
              <p className="text-gray-600">
                {isDragActive
                  ? 'Drop your resume here'
                  : 'Drag & drop or click to upload your existing resume (PDF, DOCX, or LaTeX)'}
              </p>
              {!isUploading && (
                <div className="pt-4">
                  <button className="px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors shadow-md hover:shadow-lg">
                    Choose File
                  </button>
                </div>
              )}
              {isUploading && (
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-primary-600 rounded-full loading-dot"></div>
                  <div className="w-2 h-2 bg-primary-600 rounded-full loading-dot"></div>
                  <div className="w-2 h-2 bg-primary-600 rounded-full loading-dot"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl p-8 shadow-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            ✨ What You'll Get
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl mb-2">🎨</div>
              <h4 className="font-semibold text-gray-900">Professional Templates</h4>
              <p className="text-sm text-gray-600">
                LaTeX-powered templates used by FAANG engineers
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl mb-2">🤖</div>
              <h4 className="font-semibold text-gray-900">AI Assistance</h4>
              <p className="text-sm text-gray-600">
                Get smart suggestions to improve your resume
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl mb-2">⚡</div>
              <h4 className="font-semibold text-gray-900">Real-time Editing</h4>
              <p className="text-sm text-gray-600">
                See changes instantly with live preview
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p>No account required • All data stored locally • Free to use</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
