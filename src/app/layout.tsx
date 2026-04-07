import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'ENCUESTION - Sistema de Encuestas en Tiempo Real',
  description: 'Plataforma avanzada de recopilación y análisis estadístico-político con capacidades offline.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
         <Toaster theme="dark" position="top-right" richColors expand={false} />
         {children}
      </body>
    </html>
  );
}
