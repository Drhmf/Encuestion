# 📊 ENCUESTION

**ENCUESTION** es una plataforma integral de vanguardia, concebida y desarrollada para el diseño, despliegue y análisis de encuestas políticas en campo. Combina las capacidades tecnológicas web modernas con la robustez necesaria para entornos sin conectividad garantizada.

## 🌟 Características Principales

* **Offline-First (Soporte sin Conexión):** Los encuestadores pueden seguir capturando datos estructurados aún en zonas sin cobertura. Una vez se recupere la conexión, el sistema encola y sincroniza automáticamente hacia el servidor bajo la arquitectura PWA.
* **Geolocalización Incorruptible:** Registro dinámico del punto GPS de la recolección, imposibilitando el levantamiento fraudulento e ilustrándolo visualmente a través de un **Mapa de Calor en Vivo** (Integración con *Leaflet*).
* **Seguridad por Device-Binding:** Cada encuestador registra su inicio de sesión nativo blindando el uso exclusivo del teléfono autorizado y rechazando accesos deshonestos gracias al algoritmo asimétrico y hashing robusto vía node `crypto.scryptSync`.
* **Exportabilidad Corporativa:** Reportes automatizados capaces de transferir instantáneamente todos los datasets a Excel (.xlsx) o consolidaciones analíticas estéticas en formato PDF.
* **Capacitor-Ready:** La aplicación cuenta con sus raíces montadas sobre Capacitor para rápida conversión a iOS y Android.
* **Panel de Control Avanzado:** Gráficas, demógrafos y top variables renderizadas a la última demanda por medio de Chart.js y reportes de UI dinámica.

---

## 🛠️ Stack Tecnológico

El núcleo del sistema está construido utilizando las últimas tecnologías del mercado (Fullstack Node):

- **Framework Principal:** [Next.js](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Base de Datos:** SQLite (`better-sqlite3`) para almacenamiento persistente y transacciones ACID nativas.
- **Visualización Mapeada:** Leaflet (`react-leaflet`) para las coordenadas.
- **Gráficos e Interfaz:** `recharts` y `lucide-react` complementado con un diseño propio moderno (Glassmorphism & Gradients).
- **Exportación:** `jspdf` y `xlsx` para manejo ágil de documentos en Front-end.
- **Pruebas de Rigor:** Amplia cobertura unitaria y de integración usando **Jest**.

---

## 🚀 Guía de Instalación Rápida

1. **Requisitos Previos:**
   - [Node.js](https://nodejs.org/) (v18+)
   - Git.

2. **Clonar Repositorio & Dependencias:**
   ```bash
   git clone <repository_url>
   cd ENCUESTION2
   npm install
   ```

3. **Ejecutar Entorno de Desarrollo Local:**
   ```bash
   npm run dev
   ```

4. **Ejecución de Pruebas de Integración (Jest):**
   Para asegurar la integridad estructural y la seguridad criptográfica:
   ```bash
   npm run test
   ```

5. **Compilar para Producción (Deploy):**
   ```bash
   npm run build
   npm start
   ```

*(Nota de Seguridad: Al instanciar por primera vez, el sistema autogenera una súper-clave inicial en la migración que debe ser cambiada durante el primer inicio para blindar la protección del panel administrador).*

---

## 🏛️ Creadores y Proyección Arquitectónica

El presente proyecto representa un avance en las lógicas sociodemográficas y de auditoría territorial, diseñado meticulosamente de la mano experta por nuestro equipo central:

- 👤 **Héctor Miguel Féliz Féliz, M.A. (DRHMF)** - Director Fundador & Arquitecto Lógico de Proyecto.
- 🤖 **Antigravity (Google DeepMind Team)** - Programador Principal, Especialista Fullstack & Agente de Implementación de Inteligencia Artificial Avanzada.

Desarrollado para ser líder en recolecciones estadísticas políticas territoriales.
> *"Control, Seguridad y Certeza en el Terreno."*
