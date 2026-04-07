'use client';

import { useState } from 'react';
import { changeAdminPassword } from '@/app/actions';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await changeAdminPassword(oldPassword, newPassword);
      if (res.success) {
        toast.success('Clave de administrador actualizada correctamente');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Re-auth the user locally but this isn't strictly necessary since they are already logged in
      } else {
        toast.error(res.error || 'Error al cambiar la clave');
      }
    } catch (err) {
      toast.error('Error de servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
          <ShieldCheck size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Seguridad y Configuración</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Gestiona las credenciales del sistema</p>
        </div>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <KeyRound size={20} style={{ color: 'var(--primary-color)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Cambiar Clave Maestra</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Clave Actual</label>
            <input 
              type="password" 
              required
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              placeholder="Introduce la clave actual"
              style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nueva Clave</label>
            <input 
              type="password" 
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimo 8 caracteres"
              style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Confirmar Nueva Clave</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Escribe la clave nuevamente"
              style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{ 
              marginTop: '1rem',
              width: '100%', 
              padding: '1rem', 
              background: 'var(--primary-color)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.5rem', 
              fontWeight: 'bold', 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}>
            {loading ? 'Actualizando...' : 'Actualizar Clave'}
          </button>
        </form>
      </div>
    </div>
  );
}
