import { getParties, createParty, getCandidates, createCandidate, createSurvey, createQuestion, getSurveys } from '../src/app/actions';

// Puesto que Node env es test, nuestra db.ts arranca con ':memory:'
describe('Backend Actions (SQLite In-Memory)', () => {
  it('Crea y lee un partido político correctamente', async () => {
     const newParty = await createParty({ name: 'Partido de Pruebas', acronym: 'PDP', color: '#ff0000' });
     expect(newParty.id).toBeDefined();
     expect(newParty.name).toBe('Partido de Pruebas');

     const parties = await getParties() as any[];
     expect(parties.length).toBeGreaterThan(0);
     const storedParty = parties.find(p => p.id === newParty.id);
     expect(storedParty).toBeDefined();
     expect(storedParty.name).toBe('Partido de Pruebas');
  });


  it('Crea una encuesta y relaciona correctamente multiples preguntas (N:M)', async () => {
    // 1. Crear preguntas
    const q1 = await createQuestion({ text: 'Q1 Mock', type: 'SINGLE', options: null });
    const q2 = await createQuestion({ text: 'Q2 Mock', type: 'SINGLE', options: null });

    // 2. Crear encuesta inyectando los objetos mapeados
    const mappedQs = [ { qId: q1.id, condQId: null, condAns: null }, { qId: q2.id, condQId: null, condAns: null } ];
    const survey = await createSurvey({ title: 'Test Integracion Survey', status: 'DRAFT'}, mappedQs);
    expect(survey.mapped_questions.length).toBe(2);

    // 3. Obtener encuestas
    const surveysDb = await getSurveys() as any[];
    const loaded: any = surveysDb.find((s: any) => s.id === survey.id);
    expect(loaded.mapped_questions.length).toBe(2);
    // mapped_questions are objects returned from the db query { question_id: '...', ... }
    const qIds = loaded.mapped_questions.map((q: any) => q.question_id);
    expect(qIds).toContain(q1.id);
  });

  it('Gestiona adecuadamente el emparejamiento de dispositivos de encuestadores (Device Binding)', async () => {
    // 1. Crear encuestador temporal
    const { createSurveyor, loginSurveyor } = require('../src/app/actions');
    const surveyor = await createSurveyor('Maria Lopez');
    
    expect(surveyor.access_code).toBeDefined();
    expect(surveyor.status).toBe('ACTIVE');

    // 2. Primer inicio de sesion (ata un device_id al encuestador)
    const firstLogin = await loginSurveyor(surveyor.access_code, 'device-alfa-123');
    expect(firstLogin.error).toBeUndefined();
    expect(firstLogin.device_id).toBe('device-alfa-123');

    // 3. Segundo inicio de sesion en el MISMO dispositivo debe validarse
    const secondLoginSame = await loginSurveyor(surveyor.access_code, 'device-alfa-123');
    expect(secondLoginSame.error).toBeUndefined();
    expect(secondLoginSame.device_id).toBe('device-alfa-123');

    // 4. Intento de inicio de sesion en DIFERENTE dispositivo debe ser bloqueado por seguridad
    const alienLogin = await loginSurveyor(surveyor.access_code, 'device-beta-999');
    expect(alienLogin.error).toBe('device_locked');
  });
});

