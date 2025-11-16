/**
 * AI-Powered Code Editor Service
 * Handles intelligent code editing with visual animations
 */

export class CodeEditorService {
  constructor(editorView) {
    this.view = editorView;
    this.isAnimating = false;
  }

  /**
   * Update the editor view reference
   */
  setView(view) {
    this.view = view;
  }

  /**
   * Find text in the document and return its position
   */
  findText(searchText, options = {}) {
    if (!this.view) return null;

    const doc = this.view.state.doc;
    const text = doc.toString();
    const caseSensitive = options.caseSensitive !== false;
    
    const searchStr = caseSensitive ? searchText : searchText.toLowerCase();
    const docStr = caseSensitive ? text : text.toLowerCase();
    
    const index = docStr.indexOf(searchStr);
    
    if (index === -1) return null;

    return {
      from: index,
      to: index + searchText.length,
      text: text.substring(index, index + searchText.length)
    };
  }

  /**
   * Find text by pattern (useful for LaTeX commands)
   */
  findByPattern(pattern, groupIndex = 0) {
    if (!this.view) return null;

    const doc = this.view.state.doc;
    const text = doc.toString();
    
    const regex = new RegExp(pattern, 'gi');
    const matches = [...text.matchAll(regex)];
    
    if (matches.length === 0) return null;

    const results = matches.map(match => {
      const matchText = match[groupIndex] || match[0];
      const startIndex = match.index + (match[0].indexOf(matchText));
      
      return {
        from: startIndex,
        to: startIndex + matchText.length,
        text: matchText,
        fullMatch: match[0],
        groups: match
      };
    });

    return results.length === 1 ? results[0] : results;
  }

  /**
   * Scroll to a specific position in the editor
   */
  async scrollToPosition(pos, animate = true) {
    if (!this.view) return;

    // Center the position in the viewport
    const { from } = this.view.state.doc.lineAt(pos);
    this.view.dispatch({
      selection: { anchor: from },
      scrollIntoView: true
    });
  }

  /**
   * Highlight a range with a specific style
   */
  highlightRange(from, to, duration = 2000) {
    if (!this.view) return;

    // Create a highlight decoration
    const highlight = document.createElement('div');
    highlight.style.cssText = `
      position: absolute;
      background: rgba(255, 200, 0, 0.3);
      pointer-events: none;
      transition: opacity 0.5s ease-out;
      z-index: 10;
    `;

    // Get the coordinates of the range
    const startCoords = this.view.coordsAtPos(from);
    const endCoords = this.view.coordsAtPos(to);

    if (startCoords && endCoords) {
      const editorRect = this.view.dom.getBoundingClientRect();
      
      highlight.style.left = `${startCoords.left - editorRect.left}px`;
      highlight.style.top = `${startCoords.top - editorRect.top}px`;
      highlight.style.width = `${endCoords.right - startCoords.left}px`;
      highlight.style.height = `${endCoords.bottom - startCoords.top}px`;

      this.view.dom.appendChild(highlight);

      // Fade out and remove
      setTimeout(() => {
        highlight.style.opacity = '0';
        setTimeout(() => {
          if (highlight.parentNode) {
            highlight.parentNode.removeChild(highlight);
          }
        }, 500);
      }, duration);
    }
  }

  /**
   * Delete text character by character with animation
   */
  async deleteTextAnimated(from, to, speed = 30) {
    if (!this.view || this.isAnimating) return false;
    
    this.isAnimating = true;
    const length = to - from;

    try {
      for (let i = 0; i < length; i++) {
        if (!this.view) break;

        this.view.dispatch({
          changes: {
            from: to - i - 1,
            to: to - i,
            insert: ''
          }
        });

        await this.sleep(speed);
      }
      return true;
    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Insert text character by character with animation
   */
  async insertTextAnimated(pos, text, speed = 30) {
    if (!this.view || this.isAnimating) return false;
    
    this.isAnimating = true;

    try {
      for (let i = 0; i < text.length; i++) {
        if (!this.view) break;

        this.view.dispatch({
          changes: {
            from: pos + i,
            to: pos + i,
            insert: text[i]
          }
        });

        await this.sleep(speed);
      }
      return true;
    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Replace text with full animation sequence
   * 1. Scroll to position
   * 2. Highlight old text
   * 3. Delete old text with animation
   * 4. Insert new text with animation
   * 5. Highlight new text briefly
   */
  async replaceTextAnimated(from, to, newText, options = {}) {
    if (!this.view || this.isAnimating) return false;

    const {
      speed = 30,
      highlightDuration = 1500,
      scrollDelay = 300,
      showHighlight = true
    } = options;

    try {
      // 1. Scroll to position
      await this.scrollToPosition(from);
      await this.sleep(scrollDelay);

      // 2. Highlight old text
      if (showHighlight) {
        this.highlightRange(from, to, highlightDuration);
        await this.sleep(highlightDuration);
      }

      // 3. Delete old text with animation
      await this.deleteTextAnimated(from, to, speed);

      // 4. Insert new text with animation
      await this.insertTextAnimated(from, newText, speed);

      // 5. Highlight new text briefly
      if (showHighlight) {
        this.highlightRange(from, from + newText.length, 1000);
      }

      return true;
    } catch (error) {
      console.error('Error in replaceTextAnimated:', error);
      return false;
    }
  }

  /**
   * Parse natural language command and find what to edit
   */
  parseEditCommand(command, currentDoc) {
    const lowerCommand = command.toLowerCase();
    const doc = currentDoc || (this.view ? this.view.state.doc.toString() : '');

    // Patterns for different types of edits
    const patterns = {
      // "change name to John Smith"
      name: {
        keywords: ['name', 'my name', 'called'],
        patterns: [
          /\\name\{([^}]+)\}/,
          /\\author\{([^}]+)\}/
        ]
      },
      // "update email to john@email.com"
      email: {
        keywords: ['email', 'e-mail', 'mail'],
        patterns: [
          /\\email\{([^}]+)\}/,
          /\\href\{mailto:([^}]+)\}/,
          /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/
        ]
      },
      // "change phone to 123-456-7890"
      phone: {
        keywords: ['phone', 'mobile', 'cell', 'number'],
        patterns: [
          /\\phone\{([^}]+)\}/,
          /\\mobile\{([^}]+)\}/,
          /(\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/
        ]
      },
      // "update address to 123 Main St"
      address: {
        keywords: ['address', 'location', 'city', 'street'],
        patterns: [
          /\\address\{([^}]+)\}/,
          /\\location\{([^}]+)\}/
        ]
      },
      // "change linkedin to linkedin.com/in/user"
      linkedin: {
        keywords: ['linkedin', 'linked in'],
        patterns: [
          /\\linkedin\{([^}]+)\}/,
          /\\href\{https?:\/\/(?:www\.)?linkedin\.com\/[^}]+\}\{([^}]+)\}/
        ]
      },
      // "update github to github.com/user"
      github: {
        keywords: ['github', 'git hub'],
        patterns: [
          /\\github\{([^}]+)\}/,
          /\\href\{https?:\/\/(?:www\.)?github\.com\/[^}]+\}\{([^}]+)\}/
        ]
      }
    };

    // Find which field to edit
    for (const [field, config] of Object.entries(patterns)) {
      const hasKeyword = config.keywords.some(kw => lowerCommand.includes(kw));
      
      if (hasKeyword) {
        // Try each pattern
        for (const pattern of config.patterns) {
          const match = doc.match(pattern);
          if (match) {
            const startIndex = match.index;
            const matchedText = match[1] || match[0];
            const fullMatch = match[0];
            
            // Extract new value from command
            const newValue = this.extractNewValue(command, config.keywords);
            
            return {
              field,
              found: true,
              position: {
                from: startIndex + fullMatch.indexOf(matchedText),
                to: startIndex + fullMatch.indexOf(matchedText) + matchedText.length
              },
              oldValue: matchedText,
              newValue: newValue,
              pattern: fullMatch
            };
          }
        }
      }
    }

    return { found: false, reason: 'Could not identify what to edit' };
  }

  /**
   * Extract the new value from the command
   */
  extractNewValue(command, keywords) {
    const lowerCommand = command.toLowerCase();
    
    // Common patterns: "change X to Y", "update X to Y", "set X to Y"
    const toPattern = /(?:change|update|set|make|edit).*?(?:to|as)\s+(.+?)(?:\.|$)/i;
    const match = command.match(toPattern);
    
    if (match) {
      return match[1].trim();
    }

    // Fallback: take everything after the last keyword
    let lastKeywordIndex = -1;
    for (const keyword of keywords) {
      const idx = lowerCommand.lastIndexOf(keyword);
      if (idx > lastKeywordIndex) {
        lastKeywordIndex = idx + keyword.length;
      }
    }

    if (lastKeywordIndex !== -1) {
      return command.substring(lastKeywordIndex).trim().replace(/^(to|as|:)\s+/i, '');
    }

    return '';
  }

  /**
   * Execute an edit command from natural language
   */
  async executeEditCommand(command, options = {}) {
    const parseResult = this.parseEditCommand(command);
    
    if (!parseResult.found) {
      return {
        success: false,
        error: parseResult.reason || 'Could not parse command'
      };
    }

    const { position, oldValue, newValue } = parseResult;
    
    if (!newValue) {
      return {
        success: false,
        error: 'Could not extract new value from command'
      };
    }

    const success = await this.replaceTextAnimated(
      position.from,
      position.to,
      newValue,
      options
    );

    return {
      success,
      field: parseResult.field,
      oldValue,
      newValue,
      position
    };
  }

  /**
   * Utility: Sleep for animation delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel any ongoing animation
   */
  cancelAnimation() {
    this.isAnimating = false;
  }
}

export default CodeEditorService;
