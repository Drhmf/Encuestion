'use client';

import { useState, useEffect } from 'react';
import { getSurveys, createSurvey, deleteSurvey, updateSurvey, getQuestions, verifyAdmin } from '@/app/actions';
import { Plus, Trash2, Save, X, FileText, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import styles from '../parties/parties.module.css';

type Survey = { id: string; title: string; status: string; mapped_questions: {question_id: string, condition_q_id: string|null, condition_ans: string|null}[]; };

export default function SurveysManager() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newSurvey, setNewSurvey] = useState({ title: '', status: 'DRAFT' });
  const [selectedQs, setSelectedQs] = useState<{qId: string, condQId: string|null, condAns: string|null}[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', status: '' });
  const [editQs, setEditQs] = useState<{qId: string, condQId: string|null, condAns: string|null}[]>([]);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [sData, qData] = await Promise.all([getSurveys(), getQuestions()]);
    setSurveys(sData as Survey[]);
    setAllQuestions(qData as any[]);
    setLoading(false);
  }

  function toggleQuestion(id: string) {
    const exists = selectedQs.find(q => q.qId === id);
    if (exists) setSelectedQs(selectedQs.filter(q => q.qId !== id));
    else setSelectedQs([...selectedQs, {qId: id, condQId: null, condAns: null}]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newSurvey.title || selectedQs.length === 0) return toast.error('Debes agregar un título y seleccionar al menos una pregunta.');
    const created = await createSurvey(newSurvey, selectedQs);
    const mappedToSurveyFormat = selectedQs.map(q => ({question_id: q.qId, condition_q_id: q.condQId, condition_ans: q.condAns}));
    setSurveys([{ id: created.id, title: created.title, status: created.status, mapped_questions: mappedToSurveyFormat }, ...surveys]);
    setIsCreating(false);
    setNewSurvey({ title: '', status: 'DRAFT' });
    setSelectedQs([]);
  }

  function toggleEditQuestion(id: string) {
    const exists = editQs.find(q => q.qId === id);
    if (exists) setEditQs(editQs.filter(q => q.qId !== id));
    else setEditQs([...editQs, {qId: id, condQId: null, condAns: null}]);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editForm.title || editQs.length === 0) return toast.error('Debes agregar un título y seleccionar al menos una pregunta.');
    
    const pwd = window.prompt('Introduce la clave del administrador para editar:');
    if(!pwd) return;
    if(!(await verifyAdmin(pwd))) return toast.error('Clave incorrecta');

    await updateSurvey(editingId, editForm.title, editForm.status, editQs);
    
    setSurveys(surveys.map(s => s.id === editingId ? { ...s, title: editForm.title, status: editForm.status, mapped_questions: editQs.map(q => ({question_id: q.qId, condition_q_id: q.condQId, condition_ans: q.condAns})) } : s));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if(window.confirm('¿Eliminar permanente esta encuesta?')) {
      const pwd = window.prompt('Introduce la clave del administrador para eliminar:');
      if(!pwd) return;
      if(!(await verifyAdmin(pwd))) return toast.error('Clave incorrecta');

      await deleteSurvey(id);
      setSurveys(surveys.filter(s => s.id !== id));
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div><h1 className={styles.title}>Gestor de Estudios</h1><p className={styles.subtitle}>Agrupa las preguntas en encuestas para mandarlas a campo.</p></div>
        {!isCreating && <button className={`glass ${styles.btnPrimary}`} onClick={() => setIsCreating(true)}><Plus size={18} /> Nueva Encuesta</button>}
      </header>

      {isCreating && (
        <form onSubmit={handleCreate} className={`glass ${styles.formCard}`}>
          <h3>Crear Estudio / Encuesta</h3>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}><label>Título o Nombre del Estudio *</label><input required type="text" value={newSurvey.title} onChange={e => setNewSurvey({ ...newSurvey, title: e.target.value })} /></div>
            <div className={styles.inputGroup}><label>Estado *</label><select className={styles.inputSelect} value={newSurvey.status} onChange={e => setNewSurvey({ ...newSurvey, status: e.target.value })}><option value="DRAFT">Borrador</option><option value="ACTIVE">Activa (Visible en app)</option><option value="CLOSED">Cerrada</option></select></div>
          </div>
          
          <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', padding:'1rem', borderRadius: '0.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>Seleccionar Preguntas del Banco</h4>
            {allQuestions.length === 0 && <p style={{fontSize: '0.85rem', color: 'gray'}}>No hay preguntas creadas. Ve al banco primero.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {allQuestions.map(q => {
                const mapped = selectedQs.find(sq => sq.qId === q.id);
                return (
                <div key={q.id} style={{ padding: '0.5rem', background: mapped ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', borderRadius: '0.25rem', border: mapped ? '1px solid #3b82f6' : '1px solid transparent' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!mapped} onChange={() => toggleQuestion(q.id)} />
                    {q.text}
                  </label>
                  {mapped && (
                    <div style={{marginTop:'0.5rem', paddingLeft:'1.5rem', display:'flex', gap:'0.5rem', flexWrap: 'wrap'}}>
                      <span style={{color:'var(--text-secondary)', fontSize: '0.8rem'}}>Mostrar solo si:</span>
                      <select style={{fontSize:'0.75rem', background:'rgba(0,0,0,0.5)', color:'white', border:'none', borderRadius:'4px', padding:'0.2rem'}} value={mapped.condQId || ''} onChange={e => {
                         const v = e.target.value;
                         setSelectedQs(selectedQs.map(sq => sq.qId === q.id ? {...sq, condQId: v || null, condAns: null} : sq));
                      }}>
                         <option value="">(Siempre visible)</option>
                         {selectedQs.filter(sq => sq.qId !== q.id).map(sq => {
                             const priorQ = allQuestions.find(qq => qq.id === sq.qId);
                             if (!priorQ || !['SINGLE', 'MULTIPLE'].includes(priorQ.type)) return null;
                             return <option key={sq.qId} value={sq.qId}>{priorQ.text.substring(0, 30)}...</option>
                         })}
                      </select>
                      {mapped.condQId && (
                         <select style={{fontSize:'0.75rem', background:'rgba(0,0,0,0.5)', color:'white', border:'none', borderRadius:'4px', padding:'0.2rem'}} value={mapped.condAns || ''} onChange={e => {
                             setSelectedQs(selectedQs.map(sq => sq.qId === q.id ? {...sq, condAns: e.target.value || null} : sq));
                         }}>
                            <option value="">Selecciona respuesta...</option>
                            {allQuestions.find(qq => qq.id === mapped.condQId)?.options?.map((opt:string) => (
                               <option key={opt} value={opt}>{opt}</option>
                            ))}
                         </select>
                      )}
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>
          
          <div className={styles.formActions} style={{ marginTop: '1.5rem' }}>
            <button type="button" className={styles.btnCancel} onClick={() => setIsCreating(false)}><X size={18} /> Cancelar</button>
            <button type="submit" className={styles.btnPrimary}><Save size={18} /> Guardar Estudio</button>
          </div>
        </form>
      )}

      <div className={styles.list}>
        {loading ? <div className={styles.loading}>Cargando encuestas...</div> : surveys.length === 0 ? <div className={styles.emptyState}>No hay encuestas configuradas.</div> : (
        surveys.map(s => (
            <div key={s.id} className={`glass ${styles.listItem}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
               {editingId === s.id ? (
                 <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 2 }}><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Título</label><input required type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} style={{width:'100%', padding:'0.5rem', borderRadius:'0.5rem', background:'rgba(255,255,255,0.1)', color:'white', border:'1px solid rgba(255,255,255,0.2)'}} /></div>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Estado</label><select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} required style={{width:'100%', padding:'0.5rem', borderRadius:'0.5rem', background:'rgba(0,0,0,0.5)', color:'white', border:'1px solid rgba(255,255,255,0.2)'}}>
                         <option value="DRAFT">Borrador</option><option value="ACTIVE">Activa (Visible en app)</option><option value="CLOSED">Cerrada</option>
                      </select></div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                       <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Preguntas Asignadas</label>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                          {allQuestions.map(q => {
                            const mapped = editQs.find(sq => sq.qId === q.id);
                            return (
                            <div key={q.id} style={{ padding: '0.5rem', background: mapped ? 'rgba(59, 130, 246, 0.2)' : 'transparent', borderRadius: '0.25rem', border: mapped ? '1px solid #3b82f6' : '1px solid transparent' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input type="checkbox" checked={!!mapped} onChange={() => toggleEditQuestion(q.id)} />
                                {q.text}
                              </label>
                              {mapped && (
                                <div style={{marginTop:'0.5rem', paddingLeft:'1.5rem', display:'flex', gap:'0.5rem', flexWrap: 'wrap'}}>
                                  <span style={{color:'var(--text-secondary)', fontSize: '0.8rem'}}>Logica Salto:</span>
                                  <select style={{fontSize:'0.75rem', background:'rgba(0,0,0,0.5)', color:'white', border:'none', borderRadius:'4px', padding:'0.2rem'}} value={mapped.condQId || ''} onChange={e => {
                                     const v = e.target.value;
                                     setEditQs(editQs.map(sq => sq.qId === q.id ? {...sq, condQId: v || null, condAns: null} : sq));
                                  }}>
                                     <option value="">(Siempre visible)</option>
                                     {editQs.filter(sq => sq.qId !== q.id).map(sq => {
                                         const priorQ = allQuestions.find(qq => qq.id === sq.qId);
                                         if (!priorQ || !['SINGLE', 'MULTIPLE'].includes(priorQ.type)) return null;
                                         return <option key={sq.qId} value={sq.qId}>{priorQ.text.substring(0, 30)}...</option>
                                     })}
                                  </select>
                                  {mapped.condQId && (
                                     <select style={{fontSize:'0.75rem', background:'rgba(0,0,0,0.5)', color:'white', border:'none', borderRadius:'4px', padding:'0.2rem'}} value={mapped.condAns || ''} onChange={e => {
                                         setEditQs(editQs.map(sq => sq.qId === q.id ? {...sq, condAns: e.target.value || null} : sq));
                                     }}>
                                        <option value="">Selecciona respuesta...</option>
                                        {allQuestions.find(qq => qq.id === mapped.condQId)?.options?.map((opt:string) => (
                                           <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                     </select>
                                  )}
                                </div>
                              )}
                            </div>
                          )})}
                       </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                       <button type="button" onClick={() => setEditingId(null)} className={styles.btnCancel}><X size={18} /> Cancelar</button>
                       <button type="submit" className={styles.btnPrimary}><Save size={18} /> Guardar</button>
                    </div>
                 </form>
               ) : (
                <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className={styles.partyInfo}>
                    <div className={styles.colorIndicator} style={{ backgroundColor: s.status === 'ACTIVE' ? '#10b981' : '#64748b', display: 'flex', alignItems: 'center', justifyContent:'center' }}><FileText size={20} color="white" /></div>
                    <div><h4 className={styles.partyName}>{s.title}</h4><span className={styles.partyAcronym}>Estado: {s.status} • {s.mapped_questions?.length || 0} Preguntas seleccionadas</span></div>
                  </div>
                  <div className={styles.listItemActions}>
                     <button className={styles.btnIcon} onClick={() => { 
                         setEditingId(s.id); 
                         setEditForm({title: s.title, status: s.status}); 
                         setEditQs((s.mapped_questions || []).map((mq:any) => ({qId: mq.question_id, condQId: mq.condition_q_id, condAns: mq.condition_ans}))); 
                     }}><Edit2 size={18} /></button>
                     <button className={styles.btnIconDanger} onClick={() => handleDelete(s.id)}><Trash2 size={18} /></button>
                  </div>
                </div>
               )}
            </div>
         ))
        )}
      </div>
    </div>
  )
}
