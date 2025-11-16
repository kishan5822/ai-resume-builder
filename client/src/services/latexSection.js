/**
 * LaTeX Section Update Service
 * Intelligently merges AI-generated content into specific sections
 */

export class LatexSectionService {
  /**
   * Detect if AI response is a full document or just a section
   */
  static isFullDocument(latexCode) {
    const hasDocumentClass = /\\documentclass/i.test(latexCode);
    const hasBeginDocument = /\\begin\{document\}/i.test(latexCode);
    const hasEndDocument = /\\end\{document\}/i.test(latexCode);
    
    return hasDocumentClass || (hasBeginDocument && hasEndDocument);
  }

  /**
   * Identify what section the content belongs to
   */
  static identifySection(content, userQuery) {
    const query = userQuery.toLowerCase();
    
    // Check for section keywords
    const sectionMap = {
      summary: ['summary', 'profile', 'about', 'objective', 'professional summary'],
      experience: ['experience', 'work history', 'employment', 'job', 'work experience'],
      education: ['education', 'degree', 'university', 'college', 'school'],
      skills: ['skills', 'technologies', 'expertise', 'technical skills'],
      projects: ['projects', 'portfolio', 'work'],
      certifications: ['certifications', 'certificates', 'credentials'],
      awards: ['awards', 'achievements', 'honors'],
      publications: ['publications', 'papers', 'articles']
    };

    for (const [section, keywords] of Object.entries(sectionMap)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return section;
      }
    }

    // Try to detect from LaTeX code structure
    if (/\\section\*?\{(.*?)\}/i.test(content)) {
      const match = content.match(/\\section\*?\{(.*?)\}/i);
      const sectionTitle = match[1].toLowerCase();
      
      for (const [section, keywords] of Object.entries(sectionMap)) {
        if (keywords.some(keyword => sectionTitle.includes(keyword))) {
          return section;
        }
      }
    }

    return null;
  }

  /**
   * Find section boundaries in LaTeX document
   */
  static findSectionBoundaries(latexCode, sectionName) {
    const lines = latexCode.split('\n');
    let startIndex = -1;
    let contentStartIndex = -1;
    let endIndex = -1;

    // Map section names to their LaTeX equivalents
    const sectionMappings = {
      'summary': ['OBJECTIVE', 'Professional Summary', 'Summary', 'Profile', 'About'],
      'experience': ['EXPERIENCE', 'Work Experience', 'Employment', 'Professional Experience'],
      'education': ['Education', 'EDUCATION', 'Academic Background'],
      'skills': ['SKILLS', 'Technical Skills', 'Skills', 'Expertise'],
      'projects': ['PROJECTS', 'Projects', 'Portfolio'],
      'certifications': ['Certifications', 'CERTIFICATIONS', 'Certificates'],
      'awards': ['Awards', 'AWARDS', 'Achievements', 'Honors'],
      'publications': ['Publications', 'PUBLICATIONS', 'Papers']
    };

    // Get possible section titles for this section
    const possibleTitles = sectionMappings[sectionName.toLowerCase()] || [sectionName];

    // Common section patterns - including rSection environment
    const patterns = possibleTitles.flatMap(title => [
      new RegExp(`\\\\begin\\{rSection\\}\\{${title}\\}`, 'i'),  // \begin{rSection}{TITLE}
      new RegExp(`\\\\section\\*?\\{${title}\\}`, 'i'),           // \section{TITLE}
      new RegExp(`%+\\s*${title}`, 'i')                           // % TITLE
    ]);

    // Find start (section header line)
    for (let i = 0; i < lines.length; i++) {
      if (patterns.some(pattern => pattern.test(lines[i]))) {
        startIndex = i;
        // Content starts after the section header (skip empty lines)
        contentStartIndex = i + 1;
        while (contentStartIndex < lines.length && lines[contentStartIndex].trim() === '') {
          contentStartIndex++;
        }
        break;
      }
    }

    if (startIndex === -1) return null;

    // Find end (look for \end{rSection}, next section, or end of document)
    for (let i = contentStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if we hit the end of this section or another section starts
      if (
        /^\\end\{rSection\}/.test(line) ||        // End of rSection environment (STOP BEFORE THIS)
        /^\\section\*?\{/.test(line) ||           // New section
        /^\\end\{document\}/.test(line) ||        // End of document
        /^%%%+/.test(line) ||                     // Comment separator
        /^\\begin\{rSection\}/.test(line) ||      // New rSection environment
        line === '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%'  // Hard separator
      ) {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) {
      endIndex = lines.length;
    }

    return {
      start: startIndex,              // Section header line
      contentStart: contentStartIndex, // Where content actually starts
      end: endIndex,                  // Where section ends (before \end{rSection})
      linesBefore: lines.slice(0, startIndex),
      sectionHeader: lines[startIndex], // Just the header line
      sectionContent: lines.slice(contentStartIndex, endIndex), // Old content to replace
      linesAfter: lines.slice(endIndex)  // Everything from \end{rSection} onwards
    };
  }

  /**
   * Extract section content from AI response
   */
  static extractSectionContent(aiResponse) {
    // Remove code blocks
    let content = aiResponse.replace(/```latex\n?/g, '').replace(/```\n?/g, '');
    
    // If it's just plain text, wrap it appropriately
    if (!/\\/.test(content)) {
      // Plain text - needs to be wrapped
      content = content.trim();
    }

    return content.trim();
  }

  /**
   * Merge section content into existing document
   */
  static mergeSectionIntoDocument(existingLatex, newSectionContent, sectionName, userQuery) {
    // First, check if AI gave us a full document
    if (this.isFullDocument(newSectionContent)) {
      console.log('⚠️ AI returned full document, using as-is');
      return newSectionContent;
    }

    // Extract the section content (remove code block markers)
    let content = this.extractSectionContent(newSectionContent);
    console.log('📄 Original AI content length:', content.length);
    console.log('📄 AI content preview:', content.substring(0, 200));
    
    // CRITICAL FIX: Remove section wrappers if AI included them (multiple patterns)
    // Pattern 1: \begin{rSection}{...}
    const beforeStrip1 = content;
    content = content.replace(/\\begin\{rSection\}\{[^}]*\}\s*/gi, '');
    if (content !== beforeStrip1) {
      console.log('✂️ Stripped \\begin{rSection}');
    }
    
    // Pattern 2: \end{rSection}
    const beforeStrip2 = content;
    content = content.replace(/\s*\\end\{rSection\}/gi, '');
    if (content !== beforeStrip2) {
      console.log('✂️ Stripped \\end{rSection}');
    }
    
    // Pattern 3: Also strip \begin{itemize} and \end{itemize} wrappers if it's ONLY that
    const lines = content.trim().split('\n');
    if (lines[0] && lines[0].trim() === '\\begin{itemize}' && 
        lines[lines.length - 1] && lines[lines.length - 1].trim() === '\\end{itemize}') {
      console.log('✂️ Detected standalone itemize block, keeping it');
    }
    
    content = content.trim();
    console.log('✅ Final content length after stripping:', content.length);
    console.log('✅ Final content preview:', content.substring(0, 200));

    // Find the section boundaries
    const boundaries = this.findSectionBoundaries(existingLatex, sectionName);

    if (!boundaries) {
      console.warn('⚠️ Section not found:', sectionName);
      // Section not found - AI might be creating new content
      // Try to insert before the first section or after preamble
      const lines = existingLatex.split('\n');
      const beginDocIndex = lines.findIndex(line => /\\begin\{document\}/.test(line));
      
      if (beginDocIndex !== -1) {
        // Insert after \begin{document}
        lines.splice(beginDocIndex + 1, 0, '', content, '');
        return lines.join('\n');
      }
      
      // Fallback: return as-is
      return existingLatex;
    }

    console.log('✅ Found section boundaries:', {
      start: boundaries.start,
      contentStart: boundaries.contentStart,
      end: boundaries.end,
      linesAfter: boundaries.linesAfter.length
    });

    // Replace the section content (keep header, replace content only, keep end tag)
    const newDocument = [
      ...boundaries.linesBefore,      // Everything before the section
      boundaries.sectionHeader,        // Keep the section header: \begin{rSection}{TITLE}
      '',                              // Empty line after header
      content,                         // New content (AI-generated, without wrappers)
      '',                              // Empty line after content
      ...boundaries.linesAfter         // Everything after (includes \end{rSection})
    ].join('\n');

    return newDocument;
  }

  /**
   * Update preamble commands (name, address, etc.)
   */
  static updatePreambleCommand(existingLatex, aiGeneratedCode) {
    const lines = existingLatex.split('\n');
    let updated = false;

    // Extract ANY LaTeX command patterns from AI code
    const commandPattern = /\\(\w+)\{[^}]*\}/g;
    const matches = aiGeneratedCode.match(commandPattern);

    if (!matches) return null;

    matches.forEach(newCommand => {
      const commandName = newCommand.match(/\\(\w+)\{/)[1];
      
      // Skip document structure commands
      if (['begin', 'end', 'section', 'subsection', 'item', 'textbf', 'textit', 'href'].includes(commandName)) {
        return;
      }
      
      // Find and replace the command in the preamble
      for (let i = 0; i < lines.length; i++) {
        // Stop at \begin{document}
        if (lines[i].includes('\\begin{document}')) break;
        
        // Find the command to replace
        const pattern = new RegExp(`\\\\${commandName}\\{[^}]*\\}`, 'g');
        if (pattern.test(lines[i])) {
          lines[i] = lines[i].replace(pattern, newCommand);
          updated = true;
          break; // Only replace the first occurrence
        }
      }
    });

    return updated ? lines.join('\n') : null;
  }

  /**
   * Smart diff-based merge for any LaTeX content
   */
  static smartMerge(existingLatex, aiGeneratedCode, userQuery) {
    const cleanAiCode = this.extractSectionContent(aiGeneratedCode);
    
    // Strategy 1: Look for specific patterns mentioned in user query
    const queryLower = userQuery.toLowerCase();
    
    // Extract key terms from query (things to look for)
    const searchTerms = queryLower
      .replace(/change|update|modify|edit|add|remove|delete|fix/g, '')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 3);

    if (searchTerms.length > 0) {
      // Try to find and replace relevant content
      const lines = existingLatex.split('\n');
      let foundRelevantContent = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        
        // Check if this line contains any search terms
        if (searchTerms.some(term => line.includes(term))) {
          // Found relevant line - try to replace intelligently
          
          // If AI code is short (< 5 lines), replace this specific line/block
          if (cleanAiCode.split('\n').length < 5) {
            lines[i] = cleanAiCode;
            foundRelevantContent = true;
            break;
          }
        }
      }
      
      if (foundRelevantContent) {
        return lines.join('\n');
      }
    }

    // Strategy 2: If AI code looks like a complete section, try section merge
    const section = this.identifySection(cleanAiCode, userQuery);
    if (section) {
      return this.mergeSectionIntoDocument(existingLatex, cleanAiCode, section, userQuery);
    }

    // Strategy 3: If nothing else works, just return the AI code as the full document
    // This means AI is giving us a complete rewrite
    return cleanAiCode;
  }

  /**
   * Main function to intelligently update LaTeX code
   */
  static updateLatexIntelligently(existingLatex, aiGeneratedCode, userQuery) {
    // If AI generated a full document, return it
    if (this.isFullDocument(aiGeneratedCode)) {
      return {
        latex: aiGeneratedCode,
        updateType: 'full',
        section: null
      };
    }

    // Strategy 1: Check if this is a preamble update (name, address, etc.)
    const preambleUpdate = this.updatePreambleCommand(existingLatex, aiGeneratedCode);
    if (preambleUpdate) {
      return {
        latex: preambleUpdate,
        updateType: 'preamble',
        section: 'contact info'
      };
    }

    // Strategy 2: Try to identify and update a specific section
    const section = this.identifySection(aiGeneratedCode, userQuery);
    if (section) {
      const mergedLatex = this.mergeSectionIntoDocument(
        existingLatex,
        aiGeneratedCode,
        section,
        userQuery
      );
      
      return {
        latex: mergedLatex,
        updateType: 'section',
        section: section
      };
    }

    // Strategy 3: Use smart merge as fallback
    const smartMerged = this.smartMerge(existingLatex, aiGeneratedCode, userQuery);
    
    return {
      latex: smartMerged,
      updateType: 'smart',
      section: 'content'
    };
  }
}

export default LatexSectionService;
