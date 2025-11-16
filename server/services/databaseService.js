const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra');

// Initialize database
const dbPath = path.join(__dirname, '..', 'data', 'resume.db');
fs.ensureDirSync(path.dirname(dbPath));

const db = new Database(dbPath);
db.pragma('journal_mode = WAL'); // Better performance

// Create tables
db.exec(`
  -- Conversations table
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    rating INTEGER DEFAULT 0,
    was_helpful BOOLEAN DEFAULT NULL
  );

  -- Resume versions table
  CREATE TABLE IF NOT EXISTS resume_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    latex_content TEXT NOT NULL,
    version_note TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- User preferences (learned patterns)
  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    preference_key TEXT UNIQUE NOT NULL,
    preference_value TEXT NOT NULL,
    confidence_score REAL DEFAULT 0.5,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Full-text search for conversations
  CREATE VIRTUAL TABLE IF NOT EXISTS conversations_fts USING fts5(
    user_message, 
    ai_response,
    content=conversations,
    content_rowid=id
  );

  -- Triggers to keep FTS in sync
  CREATE TRIGGER IF NOT EXISTS conversations_ai AFTER INSERT ON conversations BEGIN
    INSERT INTO conversations_fts(rowid, user_message, ai_response)
    VALUES (new.id, new.user_message, new.ai_response);
  END;

  CREATE TRIGGER IF NOT EXISTS conversations_ad AFTER DELETE ON conversations BEGIN
    DELETE FROM conversations_fts WHERE rowid = old.id;
  END;

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_rating ON conversations(rating);
  CREATE INDEX IF NOT EXISTS idx_resume_versions_session ON resume_versions(session_id);
`);

console.log('✅ Database initialized:', dbPath);

/**
 * Save a conversation to the database
 */
function saveConversation(sessionId, userMessage, aiResponse, rating = 0) {
  const stmt = db.prepare(`
    INSERT INTO conversations (session_id, user_message, ai_response, rating)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(sessionId, userMessage, aiResponse, rating);
  return result.lastInsertRowid;
}

/**
 * Update conversation rating (thumbs up/down)
 */
function updateConversationRating(conversationId, rating, wasHelpful) {
  const stmt = db.prepare(`
    UPDATE conversations 
    SET rating = ?, was_helpful = ?
    WHERE id = ?
  `);
  
  stmt.run(rating, wasHelpful ? 1 : 0, conversationId);
}

/**
 * Get recent conversations for context
 */
function getRecentConversations(sessionId, limit = 10) {
  const stmt = db.prepare(`
    SELECT user_message, ai_response, rating, timestamp
    FROM conversations
    WHERE session_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  
  return stmt.all(sessionId, limit).reverse(); // Return in chronological order
}

/**
 * Get highly rated conversations (for learning)
 */
function getHighRatedConversations(limit = 5) {
  const stmt = db.prepare(`
    SELECT user_message, ai_response, rating
    FROM conversations
    WHERE rating >= 4 OR was_helpful = 1
    ORDER BY rating DESC, timestamp DESC
    LIMIT ?
  `);
  
  return stmt.all(limit);
}

/**
 * Search conversations by keyword
 */
function searchConversations(query, limit = 10) {
  const stmt = db.prepare(`
    SELECT c.id, c.user_message, c.ai_response, c.rating, c.timestamp
    FROM conversations_fts fts
    JOIN conversations c ON c.id = fts.rowid
    WHERE conversations_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `);
  
  return stmt.all(query, limit);
}

/**
 * Save resume version
 */
function saveResumeVersion(sessionId, latexContent, versionNote = '') {
  const stmt = db.prepare(`
    INSERT INTO resume_versions (session_id, latex_content, version_note)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(sessionId, latexContent, versionNote);
  return result.lastInsertRowid;
}

/**
 * Get resume version history
 */
function getResumeVersions(sessionId, limit = 20) {
  const stmt = db.prepare(`
    SELECT id, latex_content, version_note, timestamp
    FROM resume_versions
    WHERE session_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  
  return stmt.all(sessionId, limit);
}

/**
 * Save user preference (learned pattern)
 */
function saveUserPreference(key, value, confidence = 0.5) {
  const stmt = db.prepare(`
    INSERT INTO user_preferences (preference_key, preference_value, confidence_score)
    VALUES (?, ?, ?)
    ON CONFLICT(preference_key) 
    DO UPDATE SET 
      preference_value = ?,
      confidence_score = ?,
      updated_at = CURRENT_TIMESTAMP
  `);
  
  stmt.run(key, value, confidence, value, confidence);
}

/**
 * Get user preferences
 */
function getUserPreferences() {
  const stmt = db.prepare(`
    SELECT preference_key, preference_value, confidence_score
    FROM user_preferences
    ORDER BY confidence_score DESC
  `);
  
  return stmt.all();
}

/**
 * Get statistics
 */
function getStatistics() {
  return {
    totalConversations: db.prepare('SELECT COUNT(*) as count FROM conversations').get().count,
    totalVersions: db.prepare('SELECT COUNT(*) as count FROM resume_versions').get().count,
    avgRating: db.prepare('SELECT AVG(rating) as avg FROM conversations WHERE rating > 0').get().avg || 0,
    helpfulResponses: db.prepare('SELECT COUNT(*) as count FROM conversations WHERE was_helpful = 1').get().count,
  };
}

/**
 * Clean old data (optional maintenance)
 */
function cleanOldData(daysToKeep = 90) {
  const stmt = db.prepare(`
    DELETE FROM conversations 
    WHERE timestamp < datetime('now', '-' || ? || ' days')
  `);
  
  const result = stmt.run(daysToKeep);
  return result.changes;
}

/**
 * Export all data for backup
 */
function exportData() {
  return {
    conversations: db.prepare('SELECT * FROM conversations ORDER BY timestamp').all(),
    versions: db.prepare('SELECT * FROM resume_versions ORDER BY timestamp').all(),
    preferences: db.prepare('SELECT * FROM user_preferences').all(),
  };
}

/**
 * Close database connection
 */
function closeDatabase() {
  db.close();
}

module.exports = {
  db,
  saveConversation,
  updateConversationRating,
  getRecentConversations,
  getHighRatedConversations,
  searchConversations,
  saveResumeVersion,
  getResumeVersions,
  saveUserPreference,
  getUserPreferences,
  getStatistics,
  cleanOldData,
  exportData,
  closeDatabase,
};
