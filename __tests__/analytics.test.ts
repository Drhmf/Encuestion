import { createSurvey, createQuestion, submitSurveyResponses, getDashboardStats, createCandidate, createParty } from '../src/app/actions';

describe('Analytics y Survey Responses', () => {
  it('Debe registrar respuestas exitosamente en lote y reflejarlas en el dashboard estadístico', async () => {
    // 1. Configuramos base (Encuesta, Pregunta, Candidato)
    const party = await createParty({ name: 'Partido Test', acronym: 'PTS', color: '#000' });
    const candidate = await createCandidate({ name: 'Juan Perez', photo_url: null, party_id: party.id, position_id: null });
    
    const q1 = await createQuestion({ text: '¿Votaría por este candidato?', type: 'SINGLE', options: null });
    const survey = await createSurvey({ title: 'Encuesta Nacional Pruebas', status: 'ACTIVE' }, [ { qId: q1.id, condQId: null, condAns: null } ]);

    // 2. Preparamos un payload en lote emulando respuestas fuera de linea o masivas
    const responsesPayload = [
      {
        survey_id: survey.id,
        question_id: q1.id,
        selected_candidate_id: candidate.id,
        answer_text: null,
        gps_lat: 10.123,
        gps_lng: -66.123,
        time_taken_seconds: 120,
        respondent_age: 35,
        respondent_gender: 'M',
        surveyor_id: 'surveyor-mock-id'
      },
      {
        survey_id: survey.id,
        question_id: q1.id,
        selected_candidate_id: candidate.id,
        answer_text: null,
        gps_lat: 10.124,
        gps_lng: -66.122,
        time_taken_seconds: 90,
        respondent_age: 28,
        respondent_gender: 'F',
        surveyor_id: 'surveyor-mock-id'
      }
    ];

    // 3. Ejecutar la acción
    const submission = await submitSurveyResponses(responsesPayload);
    expect(submission.success).toBe(true);

    // 4. Validar el Dashboard Stats
    const dashboard = await getDashboardStats();
    
    // El sistema crea encuestas en action.test.ts y este archivo, por tanto la suma total no es estrictamente 1,
    // Pero podemos validar que `responsesCount` total haya subido, o filtrado por survey_id:
    const specificDashboardStats = await getDashboardStats({ survey_id: survey.id });
    expect(specificDashboardStats.responsesCount).toBe(2);

    // Validamos también un filtro que deba arrojar 1 (Solo mujeres)
    const filteredStats = await getDashboardStats({ survey_id: survey.id, gender: 'F' });
    expect(filteredStats.responsesCount).toBe(1);
    expect(filteredStats.dataR[0].respondent_age).toBe(28);
  });
});
