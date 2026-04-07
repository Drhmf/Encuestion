'use client';

import { useState, useEffect } from 'react';
import { getCandidatesPaginated, createCandidate, deleteCandidate, updateCandidate, getParties, getPositions, verifyAdmin } from '@/app/actions';
import { Plus, Trash2, Save, X, User, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import styles from '../parties/parties.module.css';

type Candidate = { id: string; name: string; photo_url: string; party_id: string; position_id: string; political_parties?: { name: string, color: string }; positions?: { title: string }; };

export default function CandidatesManager() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', photo_url: '', party_id: '', position_id: '' });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({ id: '', name: '', photo_url: '', party_id: '', position_id: '' });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  useEffect(() => { fetchData(); }, [page, search]);

  async function fetchData() {
    setLoading(true);
    const [cRes, pResRaw, posResRaw] = await Promise.all([ getCandidatesPaginated(page, LIMIT, search), getParties(), getPositions() ]);
    const pRes = pResRaw as any[];
    const posRes = posResRaw as any[];
    
    setCandidates((cRes as any).data as Candidate[]);
    setTotal((cRes as any).total);
    setParties(pRes);
    setPositions(posRes);
    
    if(pRes.length > 0) setNewCandidate(c => ({...c, party_id: pRes[0].id}));
    if(posRes.length > 0) setNewCandidate(c => ({...c, position_id: posRes[0].id}));
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.party_id || !newCandidate.position_id) return;
    const created = await createCandidate(newCandidate);
    setCandidates([created as Candidate, ...candidates]);
    setIsCreating(false);
    setNewCandidate({ name: '', photo_url: '', party_id: parties[0]?.id || '', position_id: positions[0]?.id || '' });
  }

  async function handleDelete(id: string) {
    const pwd = window.prompt('Introduce la clave del administrador para eliminar:');
    if(!pwd) return;
    if(!(await verifyAdmin(pwd))) return toast.error('Clave incorrecta');

    await deleteCandidate(id);
    setCandidates(candidates.filter(c => c.id !== id));
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editForm.name || !editForm.party_id || !editForm.position_id) return;
    
    const pwd = window.prompt('Introduce la clave del administrador para editar:');
    if(!pwd) return;
    if(!(await verifyAdmin(pwd))) return toast.error('Clave incorrecta');

    await updateCandidate(editingId, editForm);
    
    const updatedCandidate = {
      ...candidates.find(c => c.id === editingId),
      ...editForm,
      political_parties: parties.find(p => p.id === editForm.party_id) || { name: '...', color: '#334' },
      positions: positions.find(p => p.id === editForm.position_id) || { title: '...' }
    };
    
    setCandidates(candidates.map(c => c.id === editingId ? updatedCandidate as Candidate : c));
    setEditingId(null);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div><h1 className={styles.title}>Candidatos</h1><p className={styles.subtitle}>Gestiona los políticos (SQLite Local).</p></div>
        {!isCreating && <button className={`glass ${styles.btnPrimary}`} onClick={() => setIsCreating(true)}><Plus size={18} /> Nuevo Candidato</button>}
      </header>

      {isCreating && (
        <form onSubmit={handleCreate} className={`glass ${styles.formCard}`}>
          <h3>Crear Nuevo Candidato</h3>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}><label>Nombre Completo *</label><input required type="text" value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} /></div>
            <div className={styles.inputGroup}><label>Partido Político *</label><select className={styles.inputSelect} value={newCandidate.party_id} onChange={e => setNewCandidate({ ...newCandidate, party_id: e.target.value })} required><option value="">Seleccione...</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div className={styles.inputGroup}><label>Aspiración (Cargo) *</label><select className={styles.inputSelect} value={newCandidate.position_id} onChange={e => setNewCandidate({ ...newCandidate, position_id: e.target.value })} required><option value="">Seleccione...</option>{positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
            <div className={styles.inputGroup}>
               <label>Foto (Visible en la calle)</label>
               <input type="file" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if(file) {
                     if(file.size > 2 * 1024 * 1024) return toast.error("La imagen debe pesar menos de 2MB");
                     const reader = new FileReader();
                     reader.onload = () => setNewCandidate({...newCandidate, photo_url: reader.result as string});
                     reader.readAsDataURL(file);
                  }
               }} style={{ padding: '0.45rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', color: 'white', width: '100%', cursor: 'pointer' }} />
               {newCandidate.photo_url && <img src={newCandidate.photo_url} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '30px', marginTop: '0.75rem', border: '2px solid rgba(255,255,255,0.2)', objectFit: 'cover' }} />}
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.btnCancel} onClick={() => setIsCreating(false)}><X size={18} /> Cancelar</button>
            <button type="submit" className={styles.btnPrimary}><Save size={18} /> Guardar</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
         <input type="text" placeholder="🔍 Buscar candidato por nombre..." value={search} onChange={e => {setSearch(e.target.value); setPage(1);}} style={{ padding: '0.85rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', flex: 1, fontSize: '0.95rem' }} />
      </div>

      <div className={styles.list}>
        {loading ? <div className={styles.loading}>Cargando candidatos...</div> : candidates.length === 0 ? <div className={styles.emptyState}>No hay candidatos que coincidan con la búsqueda.</div> : candidates.map(candidate => (
            <div key={candidate.id} className={`glass ${styles.listItem}`}>
               {editingId === candidate.id ? (
                 <form onSubmit={handleUpdate} style={{ display: 'grid', width: '100%', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nombre Completo</label><input required type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{width:'100%', padding:'0.5rem', borderRadius:'0.5rem', background:'rgba(255,255,255,0.1)', color:'white', border:'1px solid rgba(255,255,255,0.2)'}} /></div>
                      <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Partido</label><select value={editForm.party_id} onChange={e => setEditForm({...editForm, party_id: e.target.value})} required style={{width:'100%', padding:'0.5rem', borderRadius:'0.5rem', background:'rgba(0,0,0,0.5)', color:'white', border:'1px solid rgba(255,255,255,0.2)'}}>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                      <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cargo</label><select value={editForm.position_id} onChange={e => setEditForm({...editForm, position_id: e.target.value})} required style={{width:'100%', padding:'0.5rem', borderRadius:'0.5rem', background:'rgba(0,0,0,0.5)', color:'white', border:'1px solid rgba(255,255,255,0.2)'}}>{positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
                      <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cambiar Foto (Opcional)</label>
                         <input type="file" accept="image/*" onChange={e => {
                            const file = e.target.files?.[0];
                            if(file) {
                               const reader = new FileReader();
                               reader.onload = () => setEditForm({...editForm, photo_url: reader.result as string});
                               reader.readAsDataURL(file);
                            }
                         }} style={{width:'100%', padding:'0.45rem', borderRadius:'0.5rem', background:'rgba(255,255,255,0.1)', color:'white', border:'1px solid rgba(255,255,255,0.2)'}} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                       <button type="button" onClick={() => setEditingId(null)} className={styles.btnCancel}><X size={18} /> Cancelar</button>
                       <button type="submit" className={styles.btnPrimary}><Save size={18} /> Guardar</button>
                    </div>
                 </form>
               ) : (
                 <>
                   <div className={styles.partyInfo}>
                     <div className={styles.colorIndicator} style={{ backgroundColor: candidate.political_parties?.color || '#334155', display: 'flex', alignItems: 'center', justifyContent:'center', overflow: 'hidden' }}>
                         {candidate.photo_url ? <img src={candidate.photo_url} alt="Foto" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <User size={20} color="white" />}
                     </div>
                     <div><h4 className={styles.partyName}>{candidate.name}</h4><span className={styles.partyAcronym}>{candidate.political_parties?.name} • {candidate.positions?.title}</span></div>
                   </div>
                   <div className={styles.listItemActions}>
                     <button className={styles.btnIcon} onClick={() => { setEditingId(candidate.id); setEditForm(candidate); }}><Edit2 size={18} /></button>
                     <button className={styles.btnIconDanger} onClick={() => handleDelete(candidate.id)}><Trash2 size={18} /></button>
                   </div>
                 </>
               )}
            </div>
         ))}
      </div>

      {total > LIMIT && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem' }}>
           <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={styles.btnCancel} style={{ opacity: page === 1 ? 0.3 : 1 }}>Siguiente ⭠</button>
           <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Página {page} de {Math.ceil(total / LIMIT)}</span>
           <button onClick={() => setPage(p => Math.min(Math.ceil(total / LIMIT), p + 1))} disabled={page >= Math.ceil(total / LIMIT)} className={styles.btnCancel} style={{ opacity: page >= Math.ceil(total / LIMIT) ? 0.3 : 1 }}>⭢ Siguiente</button>
        </div>
      )}
    </div>
  )
}
