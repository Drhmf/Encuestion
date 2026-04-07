'use client';
import { Smartphone, LogOut } from 'lucide-react';
import Link from 'next/link';
import styles from './surveyor.module.css';

export default function SurveyorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.mobileContainer}>
      <header className={styles.topBar}>
        <div className={styles.logo}>
            <Smartphone size={20} className="text-emerald-400" />
            ENCUESTION <span style={{ fontWeight: 400, marginLeft: 4, color: 'var(--text-secondary)' }}>Mobile</span>
        </div>
        <Link href="/" className={styles.logoutBtn} onClick={() => {
           if(typeof window !== 'undefined') localStorage.removeItem('encuestion_surveyor_session');
        }}>
          <LogOut size={20} />
        </Link>
      </header>
      
      <main className={styles.mobileContent}>
        {children}
      </main>

      <div className={styles.offlineWarning} id="offline-indicator" style={{ display: 'none' }}>
        Estás trabajando sin conexión
      </div>
    </div>
  )
}
