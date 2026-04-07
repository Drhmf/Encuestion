'use client';

import { useState, useEffect } from 'react';
import { getParties, createParty, deleteParty, updateParty, verifyAdmin } from '@/app/actions';
import { Plus, Trash2, Save, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import styles from './parties.module.css';

type Party = { id: string; name: string; acronym: string; color: string; };

export default function PartiesManager() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newParty, setNewParty] = useState({ name: '', acronym: '', color: '#3b82f6' });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Party>({ id: '', name: '', acronym: '', color: '' });

  useEffect(() => { fetchParties(); }, []);

  async function fetchParties() {
    setLoading(true);
    const data = await getParties();
    setParties(data as Party[]);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newParty.name) return;
    try {
      const created = await createParty(newParty);
      setParties([created as Party, ...parties]);
      setIsCreating(false);
      setNewParty({ name: '', acronym: '', color: '#3b82f6' });
    } catch(err) { console.error(err); }
  }

  async function handleDelete(id: string) {
    const pwd = window.prompt('Introduce la clave del administrador para eliminar:');
    if(!pwd) return;
    if(!(await verifyAdmin(pwd))) return toast.error('Clave incorrecta');

    await deleteParty(id);
    setParties(parties.filter(p => p.id !== id));
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editForm.name) return;
    
    const pwd = window.prompt('Introduce la clave del administrador para editar:');
    if(!pwd) return;
    if(!(await verifyAdmin(pwd))) return toast.error('Clave incorrecta');

    await updateParty(editingId, { name: editForm.name, acronym: editForm.acronym, color: editForm.color });
    setParties(parties.map(p => p.id === editingId ? { ...p, ...editForm } : p));
    setEditingId(null);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Partidos Políticos</h1>
          <p className={styles.subtitle}>Gestiona las agrupaciones políticas (Offline Local).</p>
        </div>
        {!isCreating && (
          <button className={`glass ${styles.btnPrimary}`} onClick={() => setIsCreating(true)}>
            <Plus size={18} /> Nuevo Partido
          </button>
        )}
      </header>

      {isCreating && (
        <form onSubmit={handleCreate} className={`glass ${styles.formCard}`}>
          <h3>Crear Nuevo Partido</h3>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>Nombre del Partido *</label>
              <input required type="text" value={newParty.name} onChange={e => setNewParty({ ...newParty, name: e.target.value })} placeholder="Ej. Partido Revolucionario..." />
            </div>
            <div className={styles.inputGroup}>
              <label>Acrónimo/Siglas</label>
              <input type="text" value={newParty.acronym} onChange={e => setNewParty({ ...newParty, acronym: e.target.value })} placeholder="Ej. PRM, PLD, FP..." />
            </div>
            <div className={styles.inputGroup}>
              <label>Color representativo</label>
              <div className={styles.colorPickerWrapper}>
                <input type="color" value={newParty.color} onChange={e => setNewParty({ ...newParty, color: e.target.value })} />
                <span className={styles.colorHex}>{newParty.color}</span>
              </div>
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.btnCancel} onClick={() => setIsCreating(false)}><X size={18} /> Cancelar</button>
            <button type="submit" className={styles.btnPrimary}><Save size={18} /> Guardar</button>
          </div>
        </form>
      )}

      <div className={styles.list}>
        {loading ? <div className={styles.loading}>Cargando partidos...</div> :
         parties.length === 0 ? <div className={styles.emptyState}>No hay partidos registrados.</div> :
         parties.map(party => (
            <div key={party.id} className={`glass ${styles.listItem}`}>
               {editingId === party.id ? (
                 <form onSubmit={handleUpdate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Nombre..." required style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} />
                    <input type="text" value={editForm.acronym} onChange={e => setEditForm({...editForm, acronym: e.target.value})} placeholder="Siglas..." style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} />
                    <input type="color" value={editForm.color} onChange={e => setEditForm({...editForm, color: e.target.value})} style={{ height: '38px', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }} />
                    
                    <button type="submit" className={styles.btnPrimary} style={{ padding: '0.5rem', height: '38px', minWidth: '40px' }}><Save size={18} /></button>
                    <button type="button" onClick={() => setEditingId(null)} className={styles.btnCancel} style={{ padding: '0.5rem', height: '38px', minWidth: '40px' }}><X size={18}/></button>
                 </form>
               ) : (
                 <>
                   <div className={styles.partyInfo}>
                     <div className={styles.colorIndicator} style={{ backgroundColor: party.color }}></div>
                     <div>
                       <h4 className={styles.partyName}>{party.name}</h4>
                       {party.acronym && <span className={styles.partyAcronym}>{party.acronym}</span>}
                     </div>
                   </div>
                   <div className={styles.listItemActions}>
                     <button className={styles.btnIcon} onClick={() => { setEditingId(party.id); setEditForm(party); }}><Edit2 size={18} /></button>
                     <button className={styles.btnIconDanger} onClick={() => handleDelete(party.id)}><Trash2 size={18} /></button>
                   </div>
                 </>
               )}
            </div>
         ))}
      </div>
    </div>
  )
}
