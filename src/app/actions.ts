'use server';

import { db } from '@/lib/db';
import crypto from 'crypto';

// --- ADMIN VERIFICATION ---
export async function verifyAdmin(password: string) {
  try {
    const adminRow = db.prepare("SELECT password_hash FROM admins WHERE username = 'admin'").get() as { password_hash: string } | undefined;
    if (!adminRow) return false;

    const [salt, storedKey] = adminRow.password_hash.split(':');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    
    // Perform timing-safe equal to prevent side channel attacks if we want to be very robust, 
    // but a secure string comparison is fine since it's just hex hashes
    return storedKey === derivedKey;
  } catch (error) {
    console.error('Error verifying admin:', error);
    return false;
  }
}

export async function changeAdminPassword(oldPassword: string, newPassword: string) {
  const isValid = await verifyAdmin(oldPassword);
  if (!isValid) {
    return { success: false, error: 'La clave actual es incorrecta' };
  }
  
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(newPassword, salt, 64).toString('hex');
  const hash = `${salt}:${derivedKey}`;
  
  db.prepare("UPDATE admins SET password_hash = ? WHERE username = 'admin'").run(hash);
  return { success: true };
}

// --- POLITICAL PARTIES ---
export async function getParties() {
  return db.prepare('SELECT * FROM political_parties ORDER BY created_at DESC').all();
}

export async function createParty(data: any) {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO political_parties (id, name, acronym, color) VALUES (?, ?, ?, ?)').run(id, data.name, data.acronym, data.color);
  return { id, ...data };
}

export async function deleteParty(id: string) {
  db.prepare('DELETE FROM political_parties WHERE id = ?').run(id);
  db.prepare('DELETE FROM candidates WHERE party_id = ?').run(id);
}

export async function updateParty(id: string, party: { name: string, acronym: string, color: string }) {
  db.prepare('UPDATE political_parties SET name = ?, acronym = ?, color = ? WHERE id = ?').run(party.name, party.acronym, party.color, id);
}

// --- POSITIONS ---
export async function getPositions() {
  return db.prepare('SELECT * FROM positions ORDER BY created_at DESC').all();
}

export async function createPosition(data: any) {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO positions (id, title, level) VALUES (?, ?, ?)').run(id, data.title, data.level);
  return { id, ...data };
}

export async function deletePosition(id: string) {
  db.prepare('DELETE FROM positions WHERE id = ?').run(id);
  db.prepare('DELETE FROM candidates WHERE position_id = ?').run(id);
}

export async function updatePosition(id: string, title: string) {
  db.prepare('UPDATE positions SET title = ? WHERE id = ?').run(title, id);
}

// --- CANDIDATES ---
export async function getCandidates() {
  // SQLite JOIN emulation to replicate Supabase nested records
  const candidates = db.prepare(`
    SELECT c.*, 
           p.name as political_parties_name, p.color as political_parties_color,
           pos.title as positions_title
    FROM candidates c
    LEFT JOIN political_parties p ON c.party_id = p.id
    LEFT JOIN positions pos ON c.position_id = pos.id
    ORDER BY c.created_at DESC
  `).all() as any[];

  return candidates.map(c => ({
    ...c,
    political_parties: { name: c.political_parties_name, color: c.political_parties_color },
    positions: { title: c.positions_title }
  }));
}

export async function createCandidate(data: any) {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO candidates (id, name, photo_url, party_id, position_id) VALUES (?, ?, ?, ?, ?)').run(id, data.name, data.photo_url || null, data.party_id, data.position_id);
  
  // Return nested mock so UI updates gracefully
  const p = db.prepare('SELECT name, color FROM political_parties WHERE id = ?').get(data.party_id) as any;
  const pos = db.prepare('SELECT title FROM positions WHERE id = ?').get(data.position_id) as any;
  
  return { 
    id, 
    ...data, 
    political_parties: p || null,
    positions: pos || null
  };
}

export async function deleteCandidate(id: string) {
  db.prepare('DELETE FROM candidates WHERE id = ?').run(id);
  db.prepare('DELETE FROM survey_responses WHERE selected_candidate_id = ?').run(id);
}

export async function updateCandidate(id: string, candidate: any) {
  db.prepare('UPDATE candidates SET name=?, photo_url=?, party_id=?, position_id=? WHERE id=?').run(candidate.name, candidate.photo_url || null, candidate.party_id, candidate.position_id, id);
}

// --- QUESTIONS ---
export async function getQuestions() {
  const raw = db.prepare('SELECT * FROM questions_bank ORDER BY created_at DESC').all() as any[];
  return raw.map(q => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : null
  }));
}

export async function createQuestion(data: any) {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO questions_bank (id, text, type, options, position_id) VALUES (?, ?, ?, ?, ?)').run(id, data.text, data.type, data.options ? JSON.stringify(data.options) : null, data.position_id || null);
  return { id, ...data };
}

export async function deleteQuestion(id: string) {
  db.prepare('DELETE FROM questions_bank WHERE id = ?').run(id);
  db.prepare('DELETE FROM survey_questions WHERE question_id = ?').run(id);
  db.prepare('DELETE FROM survey_responses WHERE question_id = ?').run(id);
}

export async function updateQuestion(id: string, q: any) {
  db.prepare('UPDATE questions_bank SET text=?, type=?, options=?, position_id=? WHERE id=?').run(q.text, q.type, q.options ? JSON.stringify(q.options) : null, q.position_id || null, id);
}

// --- SURVEYS (ESTUDIOS) ---
export async function getSurveys() {
  const surveys = db.prepare('SELECT * FROM surveys ORDER BY created_at DESC').all() as any[];
  
  // Attach question mapping to each survey
  for (const s of surveys) {
    s.mapped_questions = db.prepare('SELECT question_id, condition_q_id, condition_ans FROM survey_questions WHERE survey_id = ? ORDER BY order_num ASC').all(s.id);
  }
  return surveys;
}

export async function createSurvey(data: any, mappedQuestions: {qId: string, condQId: string|null, condAns: string|null}[]) {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO surveys (id, title, status) VALUES (?, ?, ?)').run(id, data.title, data.status);
  
  const insertQ = db.prepare('INSERT INTO survey_questions (survey_id, question_id, order_num, condition_q_id, condition_ans) VALUES (?, ?, ?, ?, ?)');
  const applyMapping = db.transaction(() => {
    mappedQuestions.forEach((q, idx) => insertQ.run(id, q.qId, idx, q.condQId, q.condAns));
  });
  applyMapping();
  
  return { id, title: data.title, status: data.status, mapped_questions: mappedQuestions };
}

export async function deleteSurvey(id: string) {
  db.prepare('DELETE FROM surveys WHERE id = ?').run(id);
  db.prepare('DELETE FROM survey_questions WHERE survey_id = ?').run(id);
  db.prepare('DELETE FROM survey_responses WHERE survey_id = ?').run(id); // Borrar resultados dashboard
}

export async function updateSurvey(id: string, title: string, status: string, mappedQuestions: {qId: string, condQId: string|null, condAns: string|null}[]) {
  const transaction = db.transaction(() => {
    db.prepare('UPDATE surveys SET title=?, status=? WHERE id=?').run(title, status, id);
    db.prepare('DELETE FROM survey_questions WHERE survey_id=?').run(id);
    const insertMapping = db.prepare('INSERT INTO survey_questions (survey_id, question_id, order_num, condition_q_id, condition_ans) VALUES (?, ?, ?, ?, ?)');
    mappedQuestions.forEach((q, idx) => {
      insertMapping.run(id, q.qId, idx, q.condQId, q.condAns);
    });
  });
  transaction();
}

export async function getActiveSurveys() {
  const surveys = db.prepare("SELECT * FROM surveys WHERE status = 'ACTIVE' ORDER BY created_at DESC").all();
  return surveys;
}

export async function getSurveyQuestionsContext(surveyId: string) {
  // Returns exclusively questions mapped to this active survey
  const rawQs = db.prepare(`
    SELECT q.*, sq.condition_q_id, sq.condition_ans 
    FROM questions_bank q
    INNER JOIN survey_questions sq ON q.id = sq.question_id
    WHERE sq.survey_id = ?
    ORDER BY sq.order_num ASC
  `).all(surveyId) as any[];
  
  return rawQs.map(q => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : null,
    condition_q_id: q.condition_q_id || null,
    condition_ans: q.condition_ans || null,
    position_id: q.position_id || null
  }));
}

export async function submitSurveyResponses(payload: any[]) {
  try {
    const stmt = db.prepare('INSERT INTO survey_responses (id, survey_id, question_id, selected_candidate_id, answer_text, gps_lat, gps_lng, time_taken_seconds, respondent_age, respondent_gender, surveyor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    
    // SQLite requiere que el parametro a run() no sea indefinido, si object value es undef fallback a null
    const insertMany = db.transaction((rows: any[]) => {
      for (const row of rows) {
        stmt.run(
          crypto.randomUUID(), 
          row.survey_id || null, 
          row.question_id || null, 
          row.selected_candidate_id || null, 
          row.answer_text || null, 
          row.gps_lat || null, 
          row.gps_lng || null, 
          row.time_taken_seconds || 0,
          row.respondent_age || null,
          row.respondent_gender || null,
          row.surveyor_id || null
        );
      }
      
      if(rows.length > 0 && rows[0].surveyor_id) {
         try {
           db.prepare("UPDATE surveyors SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?").run(rows[0].surveyor_id);
         } catch(e) {}
      }
    });
    
    insertMany(payload);
    return { success: true };
  } catch(e: any) {
    console.error("Critical Server Action Db Error:", e);
    throw new Error(e.message);
  }
}

export async function getDashboardStats(filters?: { survey_id?: string, gender?: string, age?: number }) {
  const surveys = db.prepare('SELECT COUNT(*) as count FROM surveys').get() as any;
  const candidates = db.prepare('SELECT COUNT(*) as count FROM candidates').get() as any;
  const positions = db.prepare('SELECT COUNT(*) as count FROM positions').get() as any;
  
  let query = 'SELECT sr.* FROM survey_responses sr INNER JOIN surveys s ON sr.survey_id = s.id WHERE 1=1';
  const params: any[] = [];
  
  if (filters?.survey_id) { query += ' AND sr.survey_id = ?'; params.push(filters.survey_id); }
  if (filters?.gender) { query += ' AND sr.respondent_gender = ?'; params.push(filters.gender); }
  if (filters?.age) { query += ' AND sr.respondent_age = ?'; params.push(filters.age); }
  
  query += ' ORDER BY sr.created_at DESC LIMIT 5000';
  const allResponses = db.prepare(query).all(...params) as any[];

  const allSurveys = db.prepare('SELECT id, title FROM surveys ORDER BY created_at DESC').all();

  return {
    surveys: surveys.count,
    candidates: candidates.count,
    positions: positions.count,
    responsesCount: allResponses.length, // Match Filter Match
    dataR: allResponses,
    allSurveys
  };
}

export async function exportAllResponses() {
  const responses = db.prepare(`
    SELECT sr.id, s.title as survey_title, q.text as question_text, 
           sr.answer_text, c.name as candidate_name, 
           sr.gps_lat, sr.gps_lng, sr.time_taken_seconds, 
           sr.respondent_age, sr.respondent_gender, 
           sv.name as surveyor_name, sv.access_code as surveyor_code,
           sr.created_at
    FROM survey_responses sr
    LEFT JOIN surveys s ON sr.survey_id = s.id
    LEFT JOIN questions_bank q ON sr.question_id = q.id
    LEFT JOIN candidates c ON sr.selected_candidate_id = c.id
    LEFT JOIN surveyors sv ON sr.surveyor_id = sv.id
    ORDER BY sr.created_at DESC
  `).all();
  return responses;
}

// --- SURVEYORS (ENCUESTADORES) ---
export async function getSurveyors() {
  return db.prepare('SELECT * FROM surveyors ORDER BY created_at DESC').all();
}

export async function createSurveyor(name: string) {
  const id = crypto.randomUUID();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  while(true) {
    code = '';
    for(let i=0; i<6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    const exists = db.prepare('SELECT id FROM surveyors WHERE access_code = ?').get(code);
    if(!exists) break;
  }
  db.prepare('INSERT INTO surveyors (id, name, access_code) VALUES (?, ?, ?)').run(id, name, code);
  return { id, name, access_code: code, status: 'ACTIVE' };
}

export async function updateSurveyor(id: string, name: string, status: string) {
  db.prepare('UPDATE surveyors SET name = ?, status = ? WHERE id = ?').run(name, status, id);
}

export async function deleteSurveyor(id: string) {
  db.prepare('DELETE FROM surveyors WHERE id = ?').run(id);
}

export async function loginSurveyor(code: string, deviceId: string) {
  const user = db.prepare('SELECT id, name, access_code, status, device_id FROM surveyors WHERE access_code = ?').get(code.toUpperCase()) as any;
  if (!user) return null;
  if (user.status !== 'ACTIVE') return { error: 'inactive' };

  if (!user.device_id) {
     db.prepare('UPDATE surveyors SET device_id = ? WHERE id = ?').run(deviceId, user.id);
     user.device_id = deviceId;
  } else if (user.device_id !== deviceId) {
     return { error: 'device_locked' };
  }
  
  return user;
}

export async function resetSurveyorDevice(id: string) {
  db.prepare('UPDATE surveyors SET device_id = NULL WHERE id = ?').run(id);
}

export async function getCandidatesPaginated(page: number, limit: number, search: string = '') {
  const offset = (page - 1) * limit;
  let query = `
    SELECT c.*, p.name as party_name, p.color as party_color, pos.title as pos_title
    FROM candidates c
    LEFT JOIN political_parties p ON c.party_id = p.id
    LEFT JOIN positions pos ON c.position_id = pos.id
  `;
  let totalQuery = `SELECT COUNT(*) as count FROM candidates c`;
  const params: any[] = [];

  if (search) {
    query += ` WHERE c.name LIKE ?`;
    totalQuery += ` WHERE c.name LIKE ?`;
    params.push(`%${search}%`);
  }

  query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
  
  const data = db.prepare(query).all(...params, limit, offset);
  const countRes = db.prepare(totalQuery).get(...(search ? [params[0]] : [])) as any;

  const mapped = data.map((c: any) => ({
    ...c,
    political_parties: { name: c.party_name, color: c.party_color },
    positions: { title: c.pos_title }
  }));

  return { data: mapped, total: countRes.count };
}
