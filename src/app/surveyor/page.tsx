'use client';

import { useState, useEffect } from 'react';
import { getActiveSurveys, submitSurveyResponses, loginSurveyor } from '@/app/actions';
import { ChevronRight, MapPin, AlertCircle, KeyRound, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import styles from './surveyor.module.css';

type Survey = { id: string; title: string; status: string; };

export default function SurveyorHome() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpsReady, setGpsReady] = useState<boolean | null>(null);
  
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const [session, setSession] = useState<{ id: string, name: string, access_code: string } | null>(null);
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    let dId = localStorage.getItem('encuestion_device_id');
    if (!dId) {
       dId = crypto.randomUUID();
       localStorage.setItem('encuestion_device_id', dId);
    }
    setDeviceId(dId);

    const saved = localStorage.getItem('encuestion_surveyor_session');
    if (saved) {
       setSession(JSON.parse(saved));
       fetchActiveSurveys();
       requestGPS();
       checkOffline();
    } else {
       setLoading(false);
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    if (!loginCode || !deviceId) return;
    try {
       const user = (await loginSurveyor(loginCode, deviceId)) as any;
       if (user?.error === 'device_locked') {
          return setLoginError('Este código ya está vinculado a OTRO celular. Pide al administrador que resetee tu dispositivo.');
       }
       if (user?.error === 'inactive') {
          return setLoginError('Tu usuario de encuestador está inactivo o suspendido.');
       }

       if (user && user.id) {
          setSession(user);
          localStorage.setItem('encuestion_surveyor_session', JSON.stringify(user));
          fetchActiveSurveys();
          requestGPS();
          checkOffline();
       } else {
          setLoginError('Código inválido. Revisa mayúsculas/minúsculas o contacta al administrador.');
       }
    } catch(err) {
       setLoginError('Error de red al intentar ingresar.');
    }
  }

  function handleLogout() {
    localStorage.removeItem('encuestion_surveyor_session');
    setSession(null);
    setSurveys([]);
  }

  function checkOffline() {
    const queue = localStorage.getItem('offline_surveys');
    if (queue) {
       const parsed = JSON.parse(queue);
       setOfflineCount(parsed.length);
    }
  }

  async function forceSync() {
    setIsSyncing(true);
    try {
      const queue = JSON.parse(localStorage.getItem('offline_surveys') || '[]');
      if (queue.length > 0) {
        await submitSurveyResponses(queue);
        localStorage.removeItem('offline_surveys');
        setOfflineCount(0);
        alert('Sincronización Completada con Éxito!');
      }
    } catch(e) {
      alert('Error de sincronización. Asegurate tener red al servidor.');
    }
    setIsSyncing(false);
  }

  async function fetchActiveSurveys() {
    setLoading(true);
    const data = await getActiveSurveys();
    setSurveys(data as Survey[]);
    setLoading(false);
  }

  function requestGPS() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setGpsReady(true),
        (error) => setGpsReady(false),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGpsReady(false);
    }
  }

  if (!session) {
     return (
        <div style={{ display: 'flex', minHeight: '100vh', padding: '2rem', alignItems: 'center', justifyContent: 'center' }}>
           <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '400px', background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '1rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}><KeyRound size={40} color="#38bdf8" /></div>
              <h2 style={{ marginBottom: '0.5rem', color: 'white' }}>Acceso Operativo</h2>
              <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '0.9rem' }}>Ingresa tu código alfanumérico de 6 dígitos asignado por tu coordinador.</p>
              
              <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value.toUpperCase())} placeholder="EJ. X9K2P4" maxLength={6} style={{ width: '100%', padding: '1rem', marginBottom: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1.5rem', letterSpacing: '4px', textAlign: 'center', textTransform: 'uppercase' }} required />
              
              {loginError && <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.85rem' }}>{loginError}</p>}
              
              <button type="submit" style={{ width: '100%', padding: '1rem', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', fontSize: '1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>Identificarse</button>
           </form>
        </div>
     );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#38bdf8', padding: '0.5rem', borderRadius: '50%' }}><User size={20} color="#0f172a" /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{session.name}</h2>
              <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>ID: {session.access_code}</span>
            </div>
         </div>
         <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}><LogOut size={16} /> Salir</button>
      </div>

      <h1 className={styles.title}>Estudios Activos</h1>
      <p className={styles.subtitle} style={{ marginBottom: '2rem' }}>Selecciona una encuesta de campo para comenzar.</p>

      {offlineCount > 0 && (
         <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
           <h3 style={{ color: '#facc15', margin: '0 0 0.5rem 0' }}>Sincronización Pendiente</h3>
           <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Tienes respuestas guardadas fuera de línea que no han subido al dashboard.</p>
           <button onClick={forceSync} disabled={isSyncing} className={`${styles.navBtn} ${styles.navBtnPrimary}`} style={{ width: '100%', padding: '0.75rem' }}>
             {isSyncing ? 'Subiendo datos, espera...' : `Subir ${offlineCount} registros Ahora`}
           </button>
         </div>
      )}

      {gpsReady === false && (
        <div className={styles.gpsWarning} style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={24} style={{flexShrink:0}} />
          <div><strong>GPS Requerido</strong><br/>No pudimos obtener tu ubicación. Debes permitir el acceso a la ubicación de tu dispositivo para auditar esta encuesta.</div>
        </div>
      )}

      {gpsReady === true && (
        <div style={{ color: 'var(--secondary-color)', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={16} /> GPS Audit Activo y calibrado.
        </div>
      )}

      <div className={styles.surveyList}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Buscando estudios...</div>
        ) : surveys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No hay encuestas asignadas en este momento.</div>
        ) : surveys.map(s => (
          <Link href={`/surveyor/${s.id}`} key={s.id} className={styles.surveyCard}>
            <h3 className={styles.surveyTitle}>{s.title}</h3>
            <div className={styles.surveyMeta}>
               Toca para iniciar cuestionario <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
