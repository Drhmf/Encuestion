import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// En testing usamos memoria para aislar la data
const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : path.join(dbDir, 'local.db');
export const db = new Database(dbPath);

// Initialize SQLite Schema mapping from PostgreSQL
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles ( id TEXT PRIMARY KEY, role TEXT DEFAULT 'ENCUESTADOR', name TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP );
  
  CREATE TABLE IF NOT EXISTS political_parties ( id TEXT PRIMARY KEY, name TEXT NOT NULL, acronym TEXT, logo_url TEXT, color TEXT DEFAULT '#3b82f6', created_at DATETIME DEFAULT CURRENT_TIMESTAMP );
  
  CREATE TABLE IF NOT EXISTS positions ( id TEXT PRIMARY KEY, title TEXT NOT NULL, level TEXT DEFAULT 'Nacional', created_at DATETIME DEFAULT CURRENT_TIMESTAMP );
  
  CREATE TABLE IF NOT EXISTS candidates ( id TEXT PRIMARY KEY, name TEXT NOT NULL, photo_url TEXT, party_id TEXT, position_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP );
  
  CREATE TABLE IF NOT EXISTS questions_bank ( id TEXT PRIMARY KEY, text TEXT NOT NULL, type TEXT DEFAULT 'SINGLE', options TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP );
  
  CREATE TABLE IF NOT EXISTS surveys ( id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT DEFAULT 'DRAFT', target_responses INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP );
  
  CREATE TABLE IF NOT EXISTS survey_questions ( survey_id TEXT, question_id TEXT, order_num INTEGER, PRIMARY KEY (survey_id, question_id) );
  
  CREATE TABLE IF NOT EXISTS surveyors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    access_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active_at DATETIME
  );
  
  CREATE TABLE IF NOT EXISTS survey_responses ( id TEXT PRIMARY KEY, survey_id TEXT, question_id TEXT, selected_candidate_id TEXT, answer_text TEXT, gps_lat REAL, gps_lng REAL, time_taken_seconds INTEGER, created_by TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP );

  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Crear cuenta de admin por defecto si no existe
try {
  const adminExists = db.prepare('SELECT id FROM admins WHERE username = ?').get('admin');
  if (!adminExists) {
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync('admin2026', salt, 64).toString('hex');
    const hash = `${salt}:${derivedKey}`;
    db.prepare('INSERT INTO admins (id, username, password_hash) VALUES (?, ?, ?)').run(crypto.randomUUID(), 'admin', hash);
  }
} catch(e) { /* ignore en caso de error durante migraciones */ }

try {
  db.prepare('ALTER TABLE survey_responses ADD COLUMN surveyor_id TEXT').run();
} catch(e) { /* ignore */ }

try {
  db.prepare('ALTER TABLE survey_responses ADD COLUMN respondent_age INTEGER').run();
} catch(e) { /* ignore */ }

try {
  db.prepare('ALTER TABLE survey_responses ADD COLUMN respondent_gender TEXT').run();
} catch(e) { /* ignore */ }

try {
  db.prepare('ALTER TABLE survey_questions ADD COLUMN condition_q_id TEXT').run();
} catch(e) { /* ignore */ }

try {
  db.prepare('ALTER TABLE survey_questions ADD COLUMN condition_ans TEXT').run();
} catch(e) { /* ignore */ }

try {
  db.prepare('ALTER TABLE questions_bank ADD COLUMN position_id TEXT').run();
} catch(e) { /* ignore */ }

try {
  db.prepare('ALTER TABLE surveyors ADD COLUMN device_id TEXT').run();
} catch(e) { /* ignore */ }
