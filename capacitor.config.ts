import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pollysync.encuestion',
  appName: 'ENCUESTION',
  webDir: 'public',
  server: {
    // Apunta al dominio donde estará alojado NextJS + SQLite.
    // Ej: url: 'https://midominio.com',
    // Si estás probando localmente con un emulador en tu misma red:
    url: 'http://10.0.2.2:3000', 
    cleartext: true
  }
};

export default config;
