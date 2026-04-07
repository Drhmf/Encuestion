'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

export default function MapWrapper({ markers }: { markers: any[] }) {
   useEffect(() => {
     // Fix typical Leaflet icon issue in Webpack/Next.js
     delete (L.Icon.Default.prototype as any)._getIconUrl;
     L.Icon.Default.mergeOptions({
       iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
       iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
       shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
     });
   }, []);

   if(markers.length === 0) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>Sin datos GPS filtrados</div>;
   
   // Calcular centro basado en los puntos
   const centerLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
   const centerLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;
   const center = [centerLat, centerLng] as [number, number];

   return (
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}>
         <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
            attribution="&copy; <a href='https://carto.com/'>CARTO</a>" 
         />
         {markers.map((m, i) => (
            <Marker key={i} position={[m.lat, m.lng]}>
               <Popup>
                 <div style={{ color: '#0f172a' }}>
                    <b style={{ color: '#3b82f6' }}>{m.Res}</b><br/>
                    <small>Encuestador: {m.surveyor || 'N/A'}</small><br/>
                    <small style={{ color: '#64748b' }}>{m.time}</small>
                 </div>
               </Popup>
            </Marker>
         ))}
      </MapContainer>
   )
}
