import { db } from './src/lib/db';
import crypto from 'crypto';

const payload = [{
  survey_id: '123',
  question_id: 'q1',
  selected_candidate_id: null,
  answer_text: 'Aprueba',
  gps_lat: null,
  gps_lng: null,
  time_taken_seconds: 5
}];

try {
  const stmt = db.prepare('INSERT INTO survey_responses (id, survey_id, question_id, selected_candidate_id, answer_text, gps_lat, gps_lng, time_taken_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  const insertMany = db.transaction((rows: any[]) => {
    for (const row of rows) {
      stmt.run(crypto.randomUUID(), row.survey_id, row.question_id, row.selected_candidate_id, row.answer_text, row.gps_lat, row.gps_lng, row.time_taken_seconds);
    }
  });

  insertMany(payload);
  console.log('SUCCESS INSERT');
} catch (e) {
  console.error('ERROR INSERT:', e);
}
