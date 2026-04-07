'use client';

import { useState, useEffect } from 'react';
import { getQuestions, createQuestion, deleteQuestion, updateQuestion, verifyAdmin, getPositions } from '@/app/actions';
import { Plus, Trash2, Save, X, Database, ListMinus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import styles from '../parties/parties.module.css';

type Question = { id: string; text: string; type: string; options: string[] | null; position_id?: string | null; };

export default function QuestionsManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ text: '', type: 'SINGLE', position_id: '' });
  const [options, setOptions] = useState<string[]>(['Opción 1', 'Opción 2']);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({ text: '', type: 'SINGLE', options: [], position_id: '' });

  useEffect(() => { fetchQuestions(); }, []);

  async function fetchQuestions() {
    setLoading(true);
    const [qData, pData] = await Promise.all([getQuestions(), getPositions()]);
    setQuestions(qData as Question[]);
    setPositions(pData as any[]);
    setLoading(false);
  }

  const needsOptions = ['SINGLE', 'MULTIPLE'].includes(newQuestion.type);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.text) return;
    if (newQuestion.type === 'CANDIDATE' && !newQuestion.position_id) return toast.error('Debes seleccionar un cargo para este bloque de candidatos.');
    const finalOptions = needsOptions ? options.filter(o => o.trim() !== '') : null;
    const created = await createQuestion({ ...newQuestion, options: finalOptions });
    setQuestions([created as Question, ...questions]);
    setIsCreating(false);
    setNewQuestion({ text: '', type: 'SINGLE', position_id: '' });
    setOptions(['Opción 1', 'Opción 2']);
  }

  async function handleDelete(id: string) {
    const pwd = window.prompt('Introduce la clave del administrador para eliminar:');
    if(!pwd) return;
    if(!(await verifyAdmin(pwd))) return toast.error('Clave incorrecta');

    await deleteQuestion(id);
    setQuestions(questions.filter(q => q.id !== id));
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editForm.text) return;

    const pwd = window.prompt('Introduce la clave del administrador para editar:');
    if(!pwd) return;
    if(!(await verifyAdmin(pwd))) return toast.error('Clave incorrecta');

    const isOpts = ['SINGLE', 'MULTIPLE'].includes(editForm.type);
    const finalOpts = isOpts ? editForm.options.filter((o:any) => o.trim() !== '') : null;
    
    await updateQuestion(editingId, { ...editForm, options: finalOpts });
    setQuestions(questions.map(q => q.id === editingId ? { ...q, text: editForm.text, type: editForm.type, options: finalOpts } : q));
    setEditingId(null);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div><h1 className={styles.title}>Banco de Preguntas</h1><p className={styles.subtitle}>Diseña las preguntas (SQLite Local).</p></div>
        {!isCreating && <button className={`glass ${styles.btnPrimary}`} onClick={() => setIsCreating(true)}><Plus size={18} /> Nueva Pregunta</button>}
      </header>

      {isCreating && (
        <form onSubmit={handleCreate} className={`glass ${styles.formCard}`}>
          <h3>Definir Pregunta</h3>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}><label>Redacción de la Pregunta *</label><input required type="text" value={newQuestion.text} onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })} /></div>
            <div className={styles.inputGroup}><label>Tipo de Pregunta *</label>
              <select className={styles.inputSelect} value={newQuestion.type} onChange={e => setNewQuestion({ ...newQuestion, type: e.target.value })}>
                <option value="SINGLE">Selección Única</option><option value="MULTIPLE">Selección Múltiple</option><option value="CANDIDATE">Elegir Candidato (Dinámico)</option><option value="RATING">Escala (1 al 10)</option><option value="OPEN">Texto Libre</option>
              </select>
            </div>
            {newQuestion.type === 'CANDIDATE' && (
               <div className={styles.inputGroup}><label>Seleccionar Cargo Electoral *</label>
                  <select required className={styles.inputSelect} value={newQuestion.position_id} onChange={e => setNewQuestion({ ...newQuestion, position_id: e.target.value })}>
                     <option value="">-- Elige Cargo --</option>
                     {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
               </div>
            )}
          </div>
          {needsOptions && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ListMinus size={18} /> Opciones de Respuesta</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {options.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" value={opt} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                      {options.length > 2 && <button type="button" onClick={() => setOptions(options.filter((_, idx)=>idx!==i))} className={styles.btnIconDanger}><Trash2 size={16} /></button>}
                    </div>
                  ))}
                  <button type="button" onClick={() => setOptions([...options, `Opción ${options.length + 1}`])} style={{ alignSelf: 'flex-start', background: 'transparent', color: '#60a5fa', border: 'none', cursor: 'pointer', marginTop: '0.5rem', fontWeight: 600 }}>+ Añadir Opción</button>
              </div>
            </div>
          )}
          <div className={styles.formActions} style={{ marginTop: '1.5rem' }}>
            <button type="button" className={styles.btnCancel} onClick={() => setIsCreating(false)}><X size={18} /> Cancelar</button>
            <button type="submit" className={styles.btnPrimary}><Save size={18} /> Guardar</button>
          </div>
        </form>
      )}

      <div className={styles.list}>
        {loading ? <div className={styles.loading}>Cargando banco...</div> : questions.length === 0 ? <div className={styles.emptyState}>No hay preguntas aún.</div> : questions.map(q => (
            <div key={q.id} className={`glass ${styles.listItem}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
               {editingId === q.id ? (
                 <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 2 }}><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pregunta</label><input required type="text" value={editForm.text} onChange={e => setEditForm({...editForm, text: e.target.value})} style={{width:'100%', padding:'0.5rem', borderRadius:'0.5rem', background:'rgba(255,255,255,0.1)', color:'white', border:'1px solid rgba(255,255,255,0.2)'}} /></div>
                      <div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tipo</label><select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} required style={{width:'100%', padding:'0.5rem', borderRadius:'0.5rem', background:'rgba(0,0,0,0.5)', color:'white', border:'1px solid rgba(255,255,255,0.2)'}}>
                         <option value="SINGLE">Selección Única</option><option value="MULTIPLE">Selección Múltiple</option><option value="CANDIDATE">Candidatos</option><option value="RATING">Escala</option><option value="OPEN">Texto Libre</option>
                      </select></div>
                    </div>
                    {editForm.type === 'CANDIDATE' && (
                        <div>
                         <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cargo Electoral</label>
                         <select required value={editForm.position_id || ''} onChange={e => setEditForm({...editForm, position_id: e.target.value})} style={{width:'100%', padding:'0.5rem', borderRadius:'0.5rem', background:'rgba(255,255,255,0.1)', color:'white', border:'1px solid rgba(255,255,255,0.2)'}}>
                           <option value="">-- Elige Cargo --</option>
                           {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                         </select>
                        </div>
                    )}
                    {['SINGLE', 'MULTIPLE'].includes(editForm.type) && (
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                         <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Opciones</label>
                         {editForm.options.map((opt: string, i: number) => (
                           <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                             <input type="text" value={opt} onChange={e => { const n = [...editForm.options]; n[i] = e.target.value; setEditForm({...editForm, options: n}); }} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }} />
                             {editForm.options.length > 2 && <button type="button" onClick={() => setEditForm({...editForm, options: editForm.options.filter((_: any, idx: number)=>idx!==i)})} className={styles.btnIconDanger}><Trash2 size={16} /></button>}
                           </div>
                         ))}
                         <button type="button" onClick={() => setEditForm({...editForm, options: [...editForm.options, 'Nueva Opción']})} style={{ alignSelf: 'flex-start', background: 'transparent', color: '#60a5fa', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Añadir Opción</button>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                       <button type="button" onClick={() => setEditingId(null)} className={styles.btnCancel}><X size={18} /> Cancelar</button>
                       <button type="submit" className={styles.btnPrimary}><Save size={18} /> Guardar</button>
                    </div>
                 </form>
               ) : (
                 <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                   <div className={styles.partyInfo}>
                     <div className={styles.colorIndicator} style={{ backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent:'center', minWidth: '40px' }}><Database size={20} color="white" /></div>
                     <div><h4 className={styles.partyName}>{q.text}</h4><span className={styles.partyAcronym}>Tipo: {q.type} {q.options ? `• ${q.options.length} opciones` : ''} {q.type === 'CANDIDATE' ? `• Cargo Estricto` : ''}</span></div>
                   </div>
                   <div className={styles.listItemActions}>
                     <button className={styles.btnIcon} onClick={() => { setEditingId(q.id); setEditForm({...q, options: q.options || ['Opción 1'], position_id: q.position_id || ''}); }}><Edit2 size={18} /></button>
                     <button className={styles.btnIconDanger} onClick={() => handleDelete(q.id)}><Trash2 size={18} /></button>
                   </div>
                 </div>
               )}
            </div>
         ))}
      </div>
    </div>
  )
}
