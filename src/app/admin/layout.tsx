'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Database, Users, Flag, Building2, PanelLeftClose, PanelLeft, LogOut, FileText, UserCheck, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { verifyAdmin } from '@/app/actions';
import styles from './adminLayout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('admin_auth') === 'true') {
      setAuth(true);
    }
    setMounted(true);
  }, []);

  const menuItems = [
    { label: 'Dashboard', icon: <BarChart3 size={20} />, href: '/admin' },
    { label: 'Auditoría Equipo', icon: <UserCheck size={20} />, href: '/admin/surveyors' },
    { label: 'Encuestas', icon: <FileText size={20} />, href: '/admin/surveys' },
    { label: 'Banco de Preguntas', icon: <Database size={20} />, href: '/admin/questions' },
    { label: 'Partidos', icon: <Flag size={20} />, href: '/admin/parties' },
    { label: 'Cargos', icon: <Building2 size={20} />, href: '/admin/positions' },
    { label: 'Candidatos', icon: <Users size={20} />, href: '/admin/candidates' },
    { label: 'Configuración', icon: <Settings size={20} />, href: '/admin/settings' },
  ];

  if (!mounted) return null;

  if (!auth) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="glass" style={{ padding: '2.5rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>Acceso Restringido</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Ingresa la clave maestra para administrar encuestas.</p>
          <input 
            type="password" 
            placeholder="Clave de administrador..." 
            value={pass} 
            onChange={e => setPass(e.target.value)} 
            style={{ width: '100%', padding: '1rem', margin: '0 0 1rem 0', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem' }} 
            onKeyDown={async e => {
               if(e.key === 'Enter') {
                   const isValid = await verifyAdmin(pass);
                   if(isValid) { localStorage.setItem('admin_auth', 'true'); setAuth(true); } else alert('Clave incorrecta');
               }
            }}
          />
          <button 
            onClick={async () => { const isValid = await verifyAdmin(pass); if(isValid) { localStorage.setItem('admin_auth', 'true'); setAuth(true); } else alert('Clave incorrecta'); }} 
            style={{ width: '100%', padding: '1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
            Ingresar al Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''} glass`}>
        <div className={styles.sidebarHeader}>
          {!collapsed && <h2 className={styles.logo}>ENCUESTION<span className="gradient-text">Admin</span></h2>}
          <button onClick={() => setCollapsed(!collapsed)} className={styles.collapseBtn}>
            {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        <nav className={styles.navMenu}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
                <span className={styles.navIcon}>{item.icon}</span>
                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
           <Link href="/" className={styles.navItem} onClick={() => localStorage.removeItem('admin_auth')}>
              <span className={styles.navIcon}><LogOut size={20} /></span>
              {!collapsed && <span className={styles.navLabel}>Salir</span>}
           </Link>
        </div>
      </aside>
      
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}
