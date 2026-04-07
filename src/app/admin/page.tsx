'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats, exportAllResponses, getSurveyors } from '@/app/actions';
import { BarChart3, Users, Building2, Database, MapPin, Download, Filter, UserCheck, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import styles from './adminDashboard.module.css';

const MapWrapper = dynamic(() => import('@/components/MapWrapper'), { ssr: false });
const ExportButtons = dynamic(() => import('@/components/ExportButtons'), { ssr: false });

export default function AdminDashboard() {
  const [stats, setStats] = useState({ surveys: 0, candidates: 0, positions: 0, responses: 0 });
  
  const [filters, setFilters] = useState({ survey_id: '', gender: '', age: '' });
  const [allSurveys, setAllSurveys] = useState<any[]>([]);
  const [surveyors, setSurveyors] = useState<any[]>([]);
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [genderData, setGenderData] = useState<any[]>([]);
  const [ageData, setAgeData] = useState<any[]>([]);
  const [recentResponses, setRecentResponses] = useState<any[]>([]);
  
  useEffect(() => {
    fetchInitialData();
  }, [filters]);

  useEffect(() => {
    const interval = setInterval(() => fetchInitialData(), 3000);
    return () => clearInterval(interval);
  }, [filters]);

  async function fetchInitialData() {
    try {
      const pFilters = {
         survey_id: filters.survey_id || undefined,
         gender: filters.gender || undefined,
         age: filters.age ? parseInt(filters.age) : undefined
      };
      const [data, svs] = await Promise.all([getDashboardStats(pFilters), getSurveyors()]);
      setSurveyors(svs as any[]);

      setStats({
        surveys: data.surveys,
        candidates: data.candidates,
        positions: data.positions,
        responses: data.responsesCount
      });
      
      if (data.allSurveys) setAllSurveys(data.allSurveys);

      if (data.dataR) {
        setRecentResponses(data.dataR.slice(0, 15));
        
        const counts: Record<string, number> = {};
        const genderC: Record<string, number> = {};
        const ageC: Record<string, number> = {};

        data.dataR.forEach((r: any) => {
          if (r.answer_text) counts[r.answer_text] = (counts[r.answer_text] || 0) + 1;
          
          const g = r.respondent_gender || 'No Indica';
          genderC[g] = (genderC[g] || 0) + 1;
          
          let aL = 'No Indica';
          if(r.respondent_age === 18) aL = '18-25';
          else if(r.respondent_age === 26) aL = '26-35';
          else if(r.respondent_age === 36) aL = '36-50';
          else if(r.respondent_age === 51) aL = '50+';
          ageC[aL] = (ageC[aL] || 0) + 1;
        });

        const chart = Object.keys(counts).map((key, i) => ({
          name: key.length > 15 ? key.substring(0,15)+'...' : key,
          votos: counts[key],
          fill: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][i % 5]
        }));
        setChartData(chart.sort((a,b) => b.votos - a.votos));
        
        const gColors: any = { 'M': '#3b82f6', 'F': '#ec4899', 'No Indica': '#475569' };
        setGenderData(Object.keys(genderC).map(k => ({
          name: k === 'M' ? 'Hombres' : k === 'F' ? 'Mujeres' : k,
          value: genderC[k],
          fill: gColors[k] || '#475569'
        })));

        setAgeData(Object.keys(ageC).map((k, i) => ({
           name: k, votos: ageC[k], fill: ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#475569'][i%5]
        })).sort((a,b) => a.name.localeCompare(b.name)));
      }
    } catch(err) {
       console.error(err);
    }
  }
  async function handleExportData() {
    return (await exportAllResponses()) as any[];
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className={styles.title}>Power Analytics Hub</h1>
            <p className={styles.subtitle}>Visión general del estado con filtros dinámicos (DAX In-Memory).</p>
          </div>
          <ExportButtons getExportData={handleExportData} />
        </div>
        
        {/* Barra de Filtros PowerBI */}
        <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Filter size={18}/> Filtros:</div>
           
           <select style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} value={filters.survey_id} onChange={e => setFilters({...filters, survey_id: e.target.value})}>
              <option value="">Todas las Encuestas</option>
              {allSurveys.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
           </select>

           <select style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} value={filters.gender} onChange={e => setFilters({...filters, gender: e.target.value})}>
              <option value="">Todos los Géneros</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
           </select>

           <select style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} value={filters.age} onChange={e => setFilters({...filters, age: e.target.value})}>
              <option value="">Todas las Edades</option>
              <option value="18">18 - 25 años</option>
              <option value="26">26 - 35 años</option>
              <option value="36">36 - 50 años</option>
              <option value="51">Más de 50 años</option>
           </select>

           { (filters.survey_id || filters.gender || filters.age) && (
              <button onClick={() => setFilters({survey_id:'', gender:'', age:''})} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.9rem', marginLeft: 'auto', fontWeight: 600 }}>Limpiar Filtros</button>
           )}
        </div>
      </header>
      
      <div id="dashboard-snapshot-area" style={{ padding: '0.5rem' }}>
        <div className={styles.statsGrid}>
          <StatCard delay={0.1} icon={<Database size={24} />} title="Encuestas Activas" value={stats.surveys} color="var(--primary-color)" />
          <StatCard delay={0.2} icon={<Users size={24} />} title="Candidatos Registrados" value={stats.candidates} color="var(--secondary-color)" />
          <StatCard delay={0.3} icon={<Building2 size={24} />} title="Cargos Electorales" value={stats.positions} color="#8b5cf6" />
          <StatCard delay={0.4} icon={<BarChart3 size={24} />} title="Total Filtrado" value={stats.responses} color="#10b981" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Gráfico de barras Votos */}
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
          <h3><span className={styles.liveIndicator}></span> Tendencias de Intención Absoluta</h3>
          {chartData.length > 0 ? (
            <div style={{ flex: 1, width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{borderRadius: '8px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)'}} />
                  <Bar dataKey="votos" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : ( <div className={styles.emptyState} style={{ height: '300px' }}>No hay suficientes datos registrados.</div> )}
        </div>

        {/* Gráfico Pastel Género */}
        <div className={styles.chartCard}>
          <h3>Composición de Género</h3>
          {genderData.length > 0 ? (
            <div style={{ flex: 1, width: '100%', height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)'}} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <div className={styles.emptyState} style={{ height: '250px' }}>Sin datos</div>}
        </div>

        {/* Gráfico Barras Edad */}
        <div className={styles.chartCard}>
          <h3>Rango de Edades</h3>
          {ageData.length > 0 ? (
            <div style={{ flex: 1, width: '100%', height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={ageData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{borderRadius: '8px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)'}} />
                    <Bar dataKey="votos" radius={[0, 4, 4, 0]}>
                      {ageData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className={styles.emptyState} style={{ height: '250px' }}>Sin datos</div>}
        </div>

        {/* Auditoría y Feed GPS */}
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
           <h3 style={{ display: 'flex' }}>Auditoría Territorial GPS <MapPin size={18} style={{ color: 'var(--secondary-color)', marginLeft: 'auto' }} /></h3>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
             <div style={{ height: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <MapWrapper markers={recentResponses.filter((r: any) => r.gps_lat && r.gps_lng).map((r: any) => ({ 
                   lat: r.gps_lat, 
                   lng: r.gps_lng, 
                   Res: r.answer_text,
                   surveyor: r.surveyor_name || 'Desconocido',
                   time: new Date(r.created_at).toLocaleTimeString()
                }))} />
             </div>

             <div className={styles.responsesList} style={{ maxHeight: '300px' }}>
               {recentResponses.length === 0 && <p style={{color:'var(--text-secondary)'}}>Esperando actividad de encuestadores...</p>}
               {recentResponses.map((res: any, i) => (
                  <div key={i} className={styles.responseItem}>
                    <div style={{ fontWeight: 600 }}>{res.answer_text}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      <span>{new Date(res.created_at).toLocaleTimeString()}</span>
                      <span>GPS: {res.gps_lat ? `${res.gps_lat.toFixed(4)}, ${res.gps_lng.toFixed(4)}` : 'Local/Ninguno'}</span>
                    </div>
                  </div>
               ))}
             </div>
           </div>
        </div>

        {/* Auditoría de Encuestadores */}
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
           <h3><UserCheck size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom', color: 'var(--primary-color)' }}/> Auditoría de Equipo de Campo</h3>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              {surveyors.map(s => {
                 const isActiveNow = s.last_active_at && (Date.now() - new Date(s.last_active_at).getTime() < 3600000 * 4); // 4 horas
                 return (
                   <div key={s.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', border: `1px solid ${isActiveNow ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.05)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'white' }}>{s.name}</div>
                         <div style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', background: isActiveNow ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)', color: isActiveNow ? '#10b981' : '#cbd5e1', fontWeight: 700, border: `1px solid ${isActiveNow ? '#10b981' : '#64748b'}` }}>
                            {isActiveNow ? 'EN TERRENO' : 'INACTIVO'}
                         </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Código Operativo: <span style={{ color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '1px', fontWeight: 'bold', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{s.access_code}</span></div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                         <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActiveNow ? '#10b981' : '#64748b' }}></div>
                         Último Check: {s.last_active_at ? new Date(s.last_active_at).toLocaleString() : 'Sin registros de actividad'}
                      </div>
                   </div>
                 )
              })}
              {surveyors.length === 0 && <div style={{ color: 'var(--text-secondary)', padding: '1rem' }}>No hay encuestadores activos en el sistema. Puedes registrarlos en el menú lateral.</div>}
           </div>
        </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color, delay = 0 }: { icon: React.ReactNode, title: string, value: string | number, color: string, delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, type: 'spring' }} className={`glass ${styles.statCard}`}>
      <div className={styles.statIcon} style={{ backgroundColor: `${color}20`, color: color, borderColor: `${color}40` }}>{icon}</div>
      <div className={styles.statInfo}><h3 className={styles.statTitle}>{title}</h3><p className={styles.statValue}>{value}</p></div>
    </motion.div>
  );
}
