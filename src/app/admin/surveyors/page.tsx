'use client';

import { useState, useEffect } from 'react';
import { getSurveyors, createSurveyor, updateSurveyor, deleteSurveyor, verifyAdmin, resetSurveyorDevice } from '@/app/actions';
import { Plus, Trash2, Save, X, UserCheck, Edit2, SmartphoneNfc } from 'lucide-react';
import { toast } from 'sonner';
import styles from '../parties/parties.module.css';

export default function SurveyorsManager() {
  const [surveyors, setSurveyors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newSurveyor, setNewSurveyor] = useState({ name: '' });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', status: '' });

  useEffect(() => { fetchSurveyors(); }, []);

  async function fetchSurveyors() {
    setLoading(true);
    const data = await getSurveyors();
    setSurveyors(data as any[]);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newSurveyor.name) return;
    const created = await createSurveyor(newSurveyor.name);
    setSurveyors([created, ...surveyors]);
    setIsCreating(false);
    setNewSurveyor({ name: '' });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editForm.name) return;
    const pwd = window.prompt('Introduce la clave del administrador para editar:');
    if(!pwd) return;
    if(!(await verifyAdmin(pwd))) return toast.error('Clave incorrecta');

    await updateSurveyor(editingId, editForm.name, editForm.status);
    setSurveyors(surveyors.map(s => s.id === editingId ? { ...s, name: editForm.name, status: editForm.status } : s));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    const pwd = window.prompt('Introduce la clave del administrador para ELIMINAR al encuestador definitivamente:');
    if(!pwd) return;
    if(!(await verifyAdmin(pwd))) return toast.error('Clave incorrecta');

    await deleteSurveyor(id);
    setSurveyors(surveyors.filter(s => s.id !== id));
  }

  async function handleResetDevice(id: string) {
    const pwd = window.prompt('Introduce la clave o da Aceptar para desvincular el celular de este encuestador y permitirle loguearse en otro nuevo:');
    if(pwd === null) return;
    await resetSurveyorDevice(id);
    toast.success('Dispositivo reseteado. El encuestador ya puede ingresar con su código en un teléfono nuevo.');
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Encuestadores de Campo</h1>
          <p className={styles.subtitle}>Supervisa los usuarios y sus códigos de acceso.</p>
        </div>
        {!isCreating && (
          <button className={`glass ${styles.btnPrimary}`} onClick={() => setIsCreating(true)}>
            <Plus size={18} /> Nuevo Encuestador
          </button>
        )}
      </header>

      {isCreating && (
        <form onSubmit={handleCreate} className={`glass ${styles.formCard}`}>
          <h3>Registrar Encuestador</h3>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>Nombre del Operador *</label>
              <input required type="text" value={newSurveyor.name} onChange={e => setNewSurveyor({ name: e.target.value })} placeholder="Ej. Juan Pérez" />
            </div>
          </div>
          <div className={styles.formActions} style={{ marginTop: '1rem' }}>
            <button type="button" className={styles.btnCancel} onClick={() => setIsCreating(false)}><X size={18} /> Cancelar</button>
            <button type="submit" className={styles.btnPrimary}><Save size={18} /> Generar Código</button>
          </div>
        </form>
      )}

      <div className={styles.list}>
        {loading ? <div className={styles.loading}>Cargando encuestadores...</div> : surveyors.length === 0 ? <div className={styles.emptyState}>No hay encuestadores registrados.</div> : surveyors.map(s => (
            <div key={s.id} className={`glass ${styles.listItem}`}>
               {editingId === s.id ? (
                 <form onSubmit={handleUpdate} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} />
                    <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo (Suspendido)</option>
                    </select>
                    <button type="submit" className={styles.btnPrimary} style={{ padding: '0.5rem', height: '38px', minWidth: '40px' }}><Save size={18} /></button>
                    <button type="button" onClick={() => setEditingId(null)} className={styles.btnCancel} style={{ padding: '0.5rem', height: '38px', minWidth: '40px' }}><X size={18}/></button>
                 </form>
               ) : (
                 <>
                   <div className={styles.partyInfo}>
                     <div className={styles.colorIndicator} style={{ backgroundColor: s.status === 'ACTIVE' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent:'center' }}>
                         <UserCheck size={20} color="white" />
                     </div>
                     <div>
                       <h4 className={styles.partyName}>{s.name}</h4>
                       <span className={styles.partyAcronym}>
                          Código: <strong style={{ color: 'var(--primary-color)', letterSpacing: '2px', fontSize: '1rem', fontFamily: 'monospace' }}>{s.access_code}</strong> • Estado: {s.status}
                       </span>
                       {s.last_active_at && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Última Actividad: {new Date(s.last_active_at).toLocaleString()}</div>}
                     </div>
                   </div>
                   <div className={styles.listItemActions}>
                     <button className={styles.btnIcon} onClick={() => handleResetDevice(s.id)} title="Desvincular Celular"><SmartphoneNfc size={18} /></button>
                     <button className={styles.btnIcon} onClick={() => { setEditingId(s.id); setEditForm({name: s.name, status: s.status}); }}><Edit2 size={18} /></button>
                     <button className={styles.btnIconDanger} onClick={() => handleDelete(s.id)}><Trash2 size={18} /></button>
                   </div>
                 </>
               )}
            </div>
         ))}
      </div>
    </div>
  )
}
