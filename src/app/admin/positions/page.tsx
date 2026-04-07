'use client';

import { useState, useEffect } from 'react';
import { getPositions, createPosition, deletePosition, updatePosition, verifyAdmin } from '@/app/actions';
import { Plus, Trash2, Save, X, Building2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import styles from '../parties/parties.module.css';

type Position = { id: string; title: string; level: string; };

export default function PositionsManager() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPosition, setNewPosition] = useState({ title: '', level: 'Nacional' });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Position>({ id: '', title: '', level: '' });

  useEffect(() => { fetchPositions(); }, []);

  async function fetchPositions() {
    setLoading(true);
    const data = await getPositions();
    setPositions(data as Position[]);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newPosition.title) return;
    const created = await createPosition(newPosition);
    setPositions([created as Position, ...positions]);
    setIsCreating(false);
    setNewPosition({ title: '', level: 'Nacional' });
  }

  async function handleDelete(id: string) {
    const pwd = window.prompt('Introduce la clave del administrador para eliminar:');
    if(!pwd) return;
    if(!(await verifyAdmin(pwd))) return toast.error('Clave incorrecta');

    await deletePosition(id);
    setPositions(positions.filter(p => p.id !== id));
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editForm.title) return;
    
    const pwd = window.prompt('Introduce la clave del administrador para editar:');
    if(!pwd) return;
    if(!(await verifyAdmin(pwd))) return toast.error('Clave incorrecta');

    await updatePosition(editingId, editForm.title);
    setPositions(positions.map(p => p.id === editingId ? { ...p, title: editForm.title } : p));
    setEditingId(null);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Cargos Electorales</h1>
          <p className={styles.subtitle}>Define las posiciones políticas (SQLite Local).</p>
        </div>
        {!isCreating && (
          <button className={`glass ${styles.btnPrimary}`} onClick={() => setIsCreating(true)}>
            <Plus size={18} /> Nuevo Cargo
          </button>
        )}
      </header>

      {isCreating && (
        <form onSubmit={handleCreate} className={`glass ${styles.formCard}`}>
          <h3>Crear Nuevo Cargo</h3>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>Título del Cargo *</label>
              <input required type="text" value={newPosition.title} onChange={e => setNewPosition({ ...newPosition, title: e.target.value })} placeholder="Ej. Presidente" />
            </div>
            <div className={styles.inputGroup}>
              <label>Nivel *</label>
              <select className={styles.inputSelect} value={newPosition.level} onChange={e => setNewPosition({ ...newPosition, level: e.target.value })}>
                <option value="Nacional">Nacional</option>
                <option value="Regional">Regional / Provincial</option>
                <option value="Municipal">Municipal / Local</option>
              </select>
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.btnCancel} onClick={() => setIsCreating(false)}><X size={18} /> Cancelar</button>
            <button type="submit" className={styles.btnPrimary}><Save size={18} /> Guardar</button>
          </div>
        </form>
      )}

      <div className={styles.list}>
        {loading ? <div className={styles.loading}>Cargando cargos...</div> :
         positions.length === 0 ? <div className={styles.emptyState}>No hay cargos registrados.</div> :
         positions.map(position => (
            <div key={position.id} className={`glass ${styles.listItem}`}>
               {editingId === position.id ? (
                 <form onSubmit={handleUpdate} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                    <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="Cargo..." required style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} />
                    <button type="submit" className={styles.btnPrimary} style={{ padding: '0.5rem', height: '38px', minWidth: '40px' }}><Save size={18} /></button>
                    <button type="button" onClick={() => setEditingId(null)} className={styles.btnCancel} style={{ padding: '0.5rem', height: '38px', minWidth: '40px' }}><X size={18}/></button>
                 </form>
               ) : (
                <>
                  <div className={styles.partyInfo}>
                    <div className={styles.colorIndicator} style={{ backgroundColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent:'center' }}>
                        <Building2 size={20} color="white" />
                    </div>
                    <div>
                      <h4 className={styles.partyName}>{position.title}</h4>
                      <span className={styles.partyAcronym}>Nivel: {position.level || 'General'}</span>
                    </div>
                  </div>
                  <div className={styles.listItemActions}>
                    <button className={styles.btnIcon} onClick={() => { setEditingId(position.id); setEditForm(position); }}><Edit2 size={18} /></button>
                    <button className={styles.btnIconDanger} onClick={() => handleDelete(position.id)}><Trash2 size={18} /></button>
                  </div>
                </>
               )}
            </div>
         ))}
      </div>
    </div>
  )
}
