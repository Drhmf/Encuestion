'use client';
import { FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export default function ExportButtons({ getExportData }: { getExportData: () => Promise<any[]> }) {
  async function handleExportExcel() {
    try {
      const data = await getExportData();
      if (data.length === 0) return toast.error('No hay datos suficientes para generar un reporte.');
      
      const worksheet = XLSX.utils.json_to_sheet(data.map(r => ({
        "ID Respuesta": r.id,
        "Estudio (Encuesta)": r.survey_title || '',
        "Pregunta Evaluada": r.question_text || '',
        "Respuesta": r.answer_text || '',
        "Candidato Elegido": r.candidate_name || '',
        "Género": r.respondent_gender || 'No Indica',
        "Edad": r.respondent_age || '',
        "Latitud": r.gps_lat || '',
        "Longitud": r.gps_lng || '',
        "Segundos Demorados": r.time_taken_seconds || 0,
        "Encuestador": r.surveyor_name || 'Desconocido',
        "Código Supervisor": r.surveyor_code || '',
        "Fecha Captura": new Date(r.created_at).toLocaleString()
      })));
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Big Data Consolidada");
      XLSX.writeFile(workbook, `BD_ENCUESTION_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch(err) {
      console.error(err);
      toast.error('Error procesando el archivo Excel.');
    }
  }

  async function handleExportPDF() {
    const el = document.getElementById('dashboard-snapshot-area');
    if(!el) return;
    try {
       const canvas = await html2canvas(el, { backgroundColor: '#0f172a', scale: 2 });
       const imgData = canvas.toDataURL('image/jpeg', 1.0);
       const pdf = new jsPDF('p', 'mm', 'a4');
       const pdfWidth = pdf.internal.pageSize.getWidth();
       const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
       pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
       pdf.save(`Briefing_Directorio_${Date.now()}.pdf`);
    } catch(e) { toast.error('Error generando Reporte Ejecutivo PDF'); }
  }

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <button onClick={handleExportPDF} style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
         <FileText size={18} color="#ef4444" /> Exportar Briefing PDF
      </button>
      <button onClick={handleExportExcel} style={{ background: '#10b981', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
         <Download size={18} /> Excel Estructurado (.xlsx)
      </button>
    </div>
  );
}
