'use client';

import { motion, Variants } from 'framer-motion';
import { BarChart3, Database, ShieldCheck, Smartphone } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <main className={styles.main}>
      {/* Background ambient light */}
      <div className={styles.ambientBlue}></div>
      <div className={styles.ambientEmerald}></div>

      <motion.div 
        className={styles.heroContainer}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div 
          className={`glass ${styles.pillBadge}`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          SISTEMA DE ENCUESTAS EN TIEMPO REAL
        </motion.div>
        
        <h1 className={styles.title}>
          ENCUES<span className="gradient-text">TION</span>
        </h1>
        
        <p className={styles.description}>
          Plataforma avanzada de recopilación y análisis estadístico-político con capacidades offline, geolocalización y medición en tiempo real.
        </p>

        <motion.div 
          className={styles.actionsGroup}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants}>
            <Link href="/admin" className={`glass ${styles.actionBtn} ${styles.btnBlue}`}>
              <BarChart3 size={20} className={styles.iconBlue} />
              <span>Entrar al Dashboard</span>
            </Link>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Link href="/surveyor" className={`glass ${styles.actionBtn} ${styles.btnEmerald}`}>
              <Smartphone size={20} className={styles.iconEmerald} />
              <span>App de Encuestador</span>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Features showcase */}
      <motion.div 
        className={styles.featuresGrid}
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
      >
        <FeatureCard 
          icon={<ShieldCheck className={styles.iconAmber} size={28} />}
          title="Seguridad y Auditoría"
          desc="GPS obligatorio y validación de tiempos de respuesta."
        />
        <FeatureCard 
          icon={<Database className={styles.iconPurple} size={28} />}
          title="Supabase Realtime"
          desc="Datos sincronizados instantáneamente en el panel de control."
        />
        <FeatureCard 
          icon={<Smartphone className={styles.iconEmerald} size={28} />}
          title="Mobile Offline First"
          desc="Continúa encuestando incluso sin cobertura celular."
        />
      </motion.div>

    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div className={`glass ${styles.featureCard}`} variants={{
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0 }
    }}>
      <div className={styles.featureIconWrapper}>
        {icon}
      </div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>
        {desc}
      </p>
    </motion.div>
  );
}
