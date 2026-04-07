'use client';

import { useState, useEffect } from 'react';
import { getSurveyQuestionsContext, submitSurveyResponses, getCandidates } from '@/app/actions';
import { ChevronRight, ChevronLeft, MapPin, CheckCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../surveyor.module.css';

type Question = {
  id: string; text: string; type: string; options: string[] | null;
  candidates?: any[];
  condition_q_id?: string | null;
  condition_ans?: string | null;
  position_id?: string | null;
};
type Answer = { question_id: string; selected_candidate_id: string | null; answer_text: string | null; };

export default function SurveyRunner() {
  const { id } = useParams();
  const router = useRouter();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  
  const [hasStarted, setHasStarted] = useState(false);
  const [demographics, setDemographics] = useState({ age: '', gender: '' });

  const [showConfirm, setShowConfirm] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchQuestions();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Sin GPS', err),
        { enableHighAccuracy: true }
      );
    }
  }, [id]);

  // -- DRAFT RECOVERY --
  useEffect(() => {
    if (questions.length > 0 && !draftLoaded) {
       const draft = localStorage.getItem('draft_survey_' + id);
       if (draft) {
          try {
             const parsed = JSON.parse(draft);
             setAnswers(parsed.answers || {});
             setHistory(parsed.history || []);
             setCurrentIdx(parsed.currentIdx || 0);
             if (parsed.startTime) setStartTime(parsed.startTime);
          } catch(e) {}
       }
       setDraftLoaded(true);
    }
  }, [questions, draftLoaded, id]);

  // -- AUTO SAVE (DRAFT) --
  useEffect(() => {
    if (draftLoaded) {
       localStorage.setItem('draft_survey_' + id, JSON.stringify({
          answers, history, currentIdx, startTime
       }));
    }
  }, [answers, history, currentIdx, startTime, draftLoaded, id]);

  async function fetchQuestions() {
    setLoading(true);
    // Extraemos única y exclusivamente las preguntas inyectadas para ESTE ID de encuesta
    const qData = await getSurveyQuestionsContext(id as string);
    const cData = await getCandidates() as any[];
    const mapped = qData.map((q: any) => ({
      ...q,
      candidates: q.type === 'CANDIDATE' ? cData.filter(c => c.position_id === q.position_id) : undefined
    }));

    setQuestions(mapped as Question[]);
    setLoading(false);
  }

  const currentQ = questions[currentIdx];

  function setAnswer(ans: Answer) {
    setAnswers({ ...answers, [currentQ.id]: ans });
    if (currentQ.type !== 'MULTIPLE' && currentQ.type !== 'OPEN') {
      setTimeout(() => handleNext(), 300);
    }
  }

  function handleNext() {
    setHistory([...history, currentIdx]);
    
    let nextIdx = currentIdx + 1;
    while(nextIdx < questions.length) {
       const q = questions[nextIdx];
       if (!q.condition_q_id || !q.condition_ans) break;
       
       const priorAns = answers[q.condition_q_id];
       if (priorAns && priorAns.answer_text === q.condition_ans) break;
       
       nextIdx++;
    }

    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
    } else {
      setShowConfirm(true);
    }
  }

  function handlePrev() {
    if (history.length > 0) {
      const newHistory = [...history];
      const prevIdx = newHistory.pop()!;
      setHistory(newHistory);
      setCurrentIdx(prevIdx);
    }
  }

  async function finishSurvey() {
    setIsFinished(true);
    setIsSyncing(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    let surveyor_id = null;
    try {
      const session = localStorage.getItem('encuestion_surveyor_session');
      if (session) surveyor_id = JSON.parse(session).id;
    } catch(e) {}

    const payload = Object.values(answers).map((ans: any) => ({
      survey_id: id as string,
      question_id: ans.question_id,
      selected_candidate_id: ans.selected_candidate_id || null,
      answer_text: ans.answer_text || null,
      gps_lat: location?.lat || null,
      gps_lng: location?.lng || null,
      time_taken_seconds: timeTaken,
      respondent_age: demographics.age ? parseInt(demographics.age) : null,
      respondent_gender: demographics.gender || null,
      surveyor_id
    }));

     try {
       // Since the backend is completely local (Server Action SQLite DB), 
       // navigator.onLine isn't strictly necessary as the network is loopback.
       // We still simulate offline UX
       if (navigator.onLine) {
         await submitSurveyResponses(payload);
       } else {
         saveOffline(payload);
         const offlineMsg = document.getElementById('offline-indicator');
         if (offlineMsg) offlineMsg.style.display = 'block';
       }
     } catch (e) {
       saveOffline(payload);
     }
    
    setIsSyncing(false);
  }

  function saveOffline(payload: any[]) {
    const existing = localStorage.getItem('offline_surveys');
    const parsed = existing ? JSON.parse(existing) : [];
    localStorage.setItem('offline_surveys', JSON.stringify([...parsed, ...payload]));
  }

  if (loading) return <div className={styles.title}>Cargando preguntas seguras...</div>;
  if (!currentQ && !isFinished) return <div className={styles.title}>No hay preguntas configuradas.</div>;

  if (isFinished) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
        <h2 className={styles.title}>¡Encuesta Completada!</h2>
        <p className={styles.subtitle}>{isSyncing ? 'Sincronizando...' : 'Los datos han sido guardados exitosamente.'}</p>
        {!isSyncing && (
           <button onClick={() => {
              window.location.href = '/surveyor';
           }} className={styles.navBtn} style={{ background: 'var(--primary-color)', color: 'white', marginTop: '2rem' }}>
             Realizar Nueva Encuesta
           </button>
        )}
      </div>
    );
  }

  if (!hasStarted) {
     return (
        <div className={styles.questionEngine}>
           <h2 className={styles.questionText}>Perfil del Encuestado</h2>
           <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Por favor, registra los datos demográficos antes de iniciar el cuestionario.</p>
           
           <div className={styles.optionsGrid}>
             <label style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>Edad Aproximada</label>
             <select style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.1rem', marginBottom: '1rem' }} value={demographics.age} onChange={e => setDemographics({...demographics, age: e.target.value})}>
                <option value="">Seleccione...</option>
                <option value="18">18 - 25 años</option>
                <option value="26">26 - 35 años</option>
                <option value="36">36 - 50 años</option>
                <option value="51">Más de 50 años</option>
             </select>

             <label style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>Género Percibido</label>
             <select style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.1rem' }} value={demographics.gender} onChange={e => setDemographics({...demographics, gender: e.target.value})}>
                <option value="">Seleccione...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
             </select>
           </div>
           
           <div className={styles.navButtons}>
             <button disabled={!demographics.age || !demographics.gender} onClick={() => setHasStarted(true)} className={`${styles.navBtn} ${styles.navBtnPrimary}`} style={{ opacity: (!demographics.age || !demographics.gender) ? 0.5 : 1 }}>
               Comenzar Encuesta
             </button>
           </div>
        </div>
     );
  }

  if (showConfirm && !isFinished) {
    return (
      <div className={styles.questionEngine}>
        <h2 className={styles.questionText}>Resumen de Respuestas</h2>
        <div style={{ textAlign: 'left', marginBottom: '2rem', maxHeight: '50vh', overflowY: 'auto' }}>
           {questions.map((q, idx) => {
             const ans = answers[q.id];
             return (
               <div key={q.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', marginBottom: '0.5rem', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PREGUNTA {idx + 1}</div>
                  <div style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>{q.text}</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{ans?.answer_text || "Omitida"}</div>
               </div>
             )
           })}
        </div>
        <div className={styles.navButtons}>
          <button className={`${styles.navBtn} ${styles.navBtnSecondary}`} onClick={() => setShowConfirm(false)}>Volver a Editar</button>
          <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={finishSurvey} disabled={isSyncing}>
            {isSyncing ? 'Guardando...' : 'Confirmar y Enviar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.questionEngine}>
      <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${(currentIdx / questions.length) * 100}%`, transition: 'width 0.5s ease-out' }}></div></div>
      
      <AnimatePresence mode="wait">
         <motion.div key={currentIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            <h2 className={styles.questionText}>{currentQ.text}</h2>

            <div className={styles.optionsGrid}>
              {currentQ.type === 'SINGLE' && currentQ.options?.map((opt, i) => (
                <button key={i} className={`${styles.optionBtn} ${answers[currentQ.id]?.answer_text === opt ? styles.optionBtnSelected : ''}`} onClick={() => setAnswer({ question_id: currentQ.id, answer_text: opt, selected_candidate_id: null })}>{opt}</button>
              ))}

              {currentQ.type === 'CANDIDATE' && currentQ.candidates?.map((cand) => (
                <button key={cand.id} className={`${styles.optionBtn} ${answers[currentQ.id]?.selected_candidate_id === cand.id ? styles.optionBtnSelected : ''}`} onClick={() => setAnswer({ question_id: currentQ.id, answer_text: cand.name, selected_candidate_id: cand.id })} style={ answers[currentQ.id]?.selected_candidate_id === cand.id ? { borderColor: cand.political_parties?.color, transform: 'scale(1.02)' } : {} }>
                  <div className={styles.candidateOption}>
                    {cand.photo_url ? <img src={cand.photo_url} alt="Candidato" className={styles.candidatePhoto} /> : <div className={styles.candidatePhoto} style={{ background: cand.political_parties?.color || '#374151' }}></div>}
                    <div><div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{cand.name}</div><div style={{ fontSize: '0.85rem', color: cand.political_parties?.color || 'var(--text-secondary)' }}>{cand.political_parties?.name}</div></div>
                  </div>
                </button>
              ))}
              
              {currentQ.type === 'RATING' && (
                 <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                   {[1,2,3,4,5,6,7,8,9,10].map(num => (
                     <button key={num} className={`${styles.optionBtn} ${answers[currentQ.id]?.answer_text === num.toString() ? styles.optionBtnSelected : ''}`} style={{ padding: '1rem', width: '48px', justifyContent: 'center' }} onClick={() => setAnswer({ question_id: currentQ.id, answer_text: num.toString(), selected_candidate_id: null })}>{num}</button>
                   ))}
                 </div>
              )}
            </div>
         </motion.div>
      </AnimatePresence>

      <div className={styles.navButtons}>
        {history.length > 0 && <button className={`${styles.navBtn} ${styles.navBtnSecondary}`} onClick={handlePrev} style={{ flex: 0.3 }}><ChevronLeft /></button>}
        <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={handleNext} disabled={!answers[currentQ.id]} style={{ opacity: !answers[currentQ.id] ? 0.5 : 1 }}>Siguiente</button>
      </div>
      
      {location && (
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
          Audit GPS: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </div>
      )}
    </div>
  )
}
