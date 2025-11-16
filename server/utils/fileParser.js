const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs-extra');

/**
 * Extract text from PDF file using pdf-parse v1 API
 * @param {string} filePath - Absolute path to the PDF file
 * @returns {Promise<Object>} Parse result with text and metadata
 */
async function extractTextFromPDF(filePath) {
  try {
    console.log('📖 Reading PDF from:', filePath);
    
    // Read file as buffer
    const dataBuffer = await fs.readFile(filePath);
    console.log('📊 PDF buffer size:', dataBuffer.length, 'bytes');
    
    // Parse PDF - pdf-parse v1 is a function that returns a promise
    const data = await pdfParse(dataBuffer);
    
    console.log('✅ PDF parsed successfully');
    console.log('   📄 Pages:', data.numpages);
    console.log('   📝 Text length:', data.text.length, 'characters');
    
    return {
      success: true,
      text: data.text,
      pages: data.numpages,
      info: data.info || {}
    };
  } catch (error) {
    console.error('❌ PDF parse error:', error.message);
    console.error('   Stack:', error.stack);
    
    return {
      success: false,
      error: error.message || 'Failed to parse PDF file'
    };
  }
}

/**
 * Extract text from DOCX file using mammoth
 * @param {string} filePath - Absolute path to the DOCX file
 * @returns {Promise<Object>} Parse result with text
 */
async function extractTextFromDOCX(filePath) {
  try {
    console.log('📝 Reading DOCX from:', filePath);
    
    // Mammoth extracts raw text from DOCX
    const result = await mammoth.extractRawText({ path: filePath });
    
    console.log('✅ DOCX parsed successfully');
    console.log('   📝 Text length:', result.value.length, 'characters');
    
    if (result.messages && result.messages.length > 0) {
      console.log('   ⚠️  Warnings:', result.messages.length);
      result.messages.forEach(msg => {
        console.log('      -', msg.message);
      });
    }
    
    return {
      success: true,
      text: result.value,
      messages: result.messages || []
    };
  } catch (error) {
    console.error('❌ DOCX parse error:', error.message);
    console.error('   Stack:', error.stack);
    
    return {
      success: false,
      error: error.message || 'Failed to parse DOCX file'
    };
  }
}

/**
 * Read plain text or LaTeX file
 * @param {string} filePath - Absolute path to the text file
 * @returns {Promise<Object>} Parse result with text content
 */
async function readTextFile(filePath) {
  try {
    console.log('📄 Reading text file from:', filePath);
    
    const content = await fs.readFile(filePath, 'utf8');
    
    console.log('✅ Text file read successfully');
    console.log('   📝 Text length:', content.length, 'characters');
    
    return {
      success: true,
      text: content,
      format: 'text'
    };
  } catch (error) {
    console.error('❌ Text file read error:', error.message);
    
    return {
      success: false,
      error: error.message || 'Failed to read text file'
    };
  }
}

/**
 * Universal file parser - automatically detects type and extracts text
 * @param {string} filePath - Absolute path to the file
 * @param {string} fileType - File extension (pdf, docx, tex, etc.)
 * @returns {Promise<Object>} Parse result with text and metadata
 */
async function parseFile(filePath, fileType) {
  const extension = fileType.toLowerCase().replace('.', '');
  
  console.log(`\n🔍 Parsing ${extension.toUpperCase()} file...`);
  
  // Validate file exists first
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      console.error('❌ Path is not a file:', filePath);
      return {
        success: false,
        error: 'Path is not a valid file'
      };
    }
    if (stats.size === 0) {
      console.error('❌ File is empty:', filePath);
      return {
        success: false,
        error: 'File is empty'
      };
    }
    console.log('✅ File validation passed. Size:', stats.size, 'bytes');
  } catch (error) {
    console.error('❌ File validation failed:', error.message);
    return {
      success: false,
      error: `File not found or not accessible: ${error.message}`
    };
  }
  
  switch (extension) {
    case 'pdf':
      return await extractTextFromPDF(filePath);
    
    case 'docx':
    case 'doc':
      return await extractTextFromDOCX(filePath);
    
    case 'tex':
    case 'latex':
    case 'txt':
      return await readTextFile(filePath);
    
    default:
      console.error('❌ Unsupported file type:', extension);
      return {
        success: false,
        error: `Unsupported file type: ${extension}. Supported types: PDF, DOCX, TEX, TXT`
      };
  }
}

module.exports = {
  extractTextFromPDF,
  extractTextFromDOCX,
  readTextFile,
  parseFile
};
