import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CalendarCardEvent } from '../../lib/calendar-utils';
import { isCardCompleted } from '../../lib/calendar-utils';

interface CalendarExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName?: string;
  currentDateText: string;
  totalEvents: number;
  completedCount: number;
  events?: CalendarCardEvent[];
  exportTargetId?: string;
}

export const CalendarExportModal: React.FC<CalendarExportModalProps> = ({
  isOpen,
  onClose,
  workspaceName = 'Espacio de Trabajo',
  currentDateText,
  totalEvents,
  completedCount,
  events = [],
  exportTargetId = 'lumins-calendar-export-target',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'csv'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const sanitizeFileName = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_');
  };

  const periodSlug = sanitizeFileName(currentDateText || 'calendario');
  const workspaceSlug = sanitizeFileName(workspaceName);

  // 1. Export PDF Profesional con pdf-lib (A4 Landscape, Membrete Corporativo y Grid Nítido)
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const targetEl = document.getElementById(exportTargetId);
      if (!targetEl) {
        throw new Error('No se encontró el contenedor del calendario.');
      }

      toast.info('Generando documento PDF de alta resolución...');

      const [{ toPng }, { PDFDocument, rgb, StandardFonts }] = await Promise.all([
        import('html-to-image'),
        import('pdf-lib'),
      ]);

      // Capturar nodo del calendario a 2x DPR
      const dataUrl = await toPng(targetEl, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('fixed')) {
            return false;
          }
          return true;
        },
      });

      // Crear documento PDF A4 apaisado (841.89 x 595.28 puntos)
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([841.89, 595.28]);
      const { width, height } = page.getSize();

      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Header Ejecutivo
      page.drawRectangle({
        x: 0,
        y: height - 56,
        width,
        height: 56,
        color: rgb(248 / 255, 249 / 255, 252 / 255),
      });

      // Línea decorativa Lumins Purple
      page.drawRectangle({
        x: 0,
        y: height - 58,
        width,
        height: 2,
        color: rgb(108 / 255, 93 / 255, 211 / 255),
      });

      // Textos del Header
      page.drawText(`LUMINS  |  ${workspaceName}`, {
        x: 28,
        y: height - 28,
        size: 14,
        font: fontBold,
        color: rgb(24 / 255, 27 / 255, 34 / 255),
      });

      page.drawText(`Calendario de Planificacion — ${currentDateText}`, {
        x: 28,
        y: height - 44,
        size: 10,
        font: fontRegular,
        color: rgb(113 / 255, 118 / 255, 132 / 255),
      });

      // Métricas (Derecha)
      const pct = totalEvents > 0 ? Math.round((completedCount / totalEvents) * 100) : 0;
      const metricsText = `${totalEvents} Tarjetas (${completedCount} completadas · ${pct}%)`;
      const metricsWidth = fontBold.widthOfTextAtSize(metricsText, 9.5);
      page.drawText(metricsText, {
        x: width - 28 - metricsWidth,
        y: height - 30,
        size: 9.5,
        font: fontBold,
        color: rgb(108 / 255, 93 / 255, 211 / 255),
      });

      // Insertar imagen capturada
      const pngImageBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
      const pngImage = await pdfDoc.embedPng(pngImageBytes);
      const pngDims = pngImage.scale(1);

      const maxImgWidth = width - 56;
      const maxImgHeight = height - 85;

      const scale = Math.min(maxImgWidth / pngDims.width, maxImgHeight / pngDims.height);
      const imgWidth = pngDims.width * scale;
      const imgHeight = pngDims.height * scale;
      const imgX = (width - imgWidth) / 2;
      const imgY = (height - 60 - imgHeight) / 2 + 10;

      page.drawImage(pngImage, {
        x: imgX,
        y: imgY,
        width: imgWidth,
        height: imgHeight,
      });

      // Footer
      page.drawText('Documento generado por Lumins · Plataforma de Planificacion de Equipos', {
        x: 28,
        y: 12,
        size: 8,
        font: fontRegular,
        color: rgb(160 / 255, 164 / 255, 175 / 255),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Calendario_${workspaceSlug}_${periodSlug}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Documento PDF descargado exitosamente');
      onClose();
    } catch (err: any) {
      console.error('Error generando PDF:', err);
      toast.error('No se pudo generar el PDF. Intenta nuevamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Export PNG de Alta Resolución
  const handleExportPNG = async () => {
    try {
      setIsExporting(true);
      const targetEl = document.getElementById(exportTargetId);
      if (!targetEl) {
        throw new Error('No se encontró el contenedor del calendario.');
      }

      toast.info('Capturando imagen en alta resolución...');

      const { toPng } = await import('html-to-image');

      const dataUrl = await toPng(targetEl, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `Calendario_${workspaceSlug}_${periodSlug}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Imagen PNG descargada');
      onClose();
    } catch (err: any) {
      console.error('Error generando PNG:', err);
      toast.error('No se pudo exportar la imagen.');
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Export CSV para Excel / Hojas de cálculo
  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      if (!events || events.length === 0) {
        toast.warning('No hay tarjetas en pantalla para exportar');
        setIsExporting(false);
        return;
      }

      const headers = [
        'ID',
        'Título de Tarea',
        'Tablero',
        'Lista / Columna',
        'Prioridad',
        'Fecha Inicio',
        'Fecha Vencimiento',
        'Estado',
        'Responsables',
        'Bloqueada',
        'Motivo de Bloqueo',
      ];

      const rows = events.map((ev) => {
        const props = ev.extendedProps;
        const isDone = isCardCompleted(ev);
        const assignees = props.assignees?.map((a: any) => a.name).join('; ') || 'Sin asignar';

        return [
          ev.id,
          `"${(ev.title || '').replace(/"/g, '""')}"`,
          `"${(props.boardName || '').replace(/"/g, '""')}"`,
          `"${(props.listName || '').replace(/"/g, '""')}"`,
          props.priority || 'P2',
          props.startDate ? format(new Date(props.startDate), 'yyyy-MM-dd') : '',
          props.dueDate ? format(new Date(props.dueDate), 'yyyy-MM-dd') : '',
          isDone ? 'Completada' : 'Pendiente',
          `"${assignees.replace(/"/g, '""')}"`,
          props.blocked ? 'Sí' : 'No',
          `"${(props.blockedReason || '').replace(/"/g, '""')}"`,
        ];
      });

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

      // UTF-8 BOM para que Microsoft Excel abra acentos y ñ sin problemas
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Tareas_${workspaceSlug}_${periodSlug}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Archivo CSV descargado con éxito');
      onClose();
    } catch (err: any) {
      console.error('Error generando CSV:', err);
      toast.error('Error al generar archivo CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (selectedFormat === 'pdf') {
      handleExportPDF();
    } else if (selectedFormat === 'png') {
      handleExportPNG();
    } else {
      handleExportCSV();
    }
  };

  const formats = [
    {
      id: 'pdf' as const,
      name: 'Documento PDF Ejecutivo (.pdf)',
      desc: 'Formato A4 apaisado de alta resolución con membrete corporativo, métricas y grilla completa lista para compartir.',
      icon: FileText,
      badge: 'Recomendado',
      accentColor: '#6C5DD3',
    },
    {
      id: 'png' as const,
      name: 'Imagen Retina (.png)',
      desc: 'Captura gráfica limpia a resolución 2.5x para insertar en diapositivas, Slack o presentaciones de equipo.',
      icon: ImageIcon,
      accentColor: '#3B82F6',
    },
    {
      id: 'csv' as const,
      name: 'Planilla de Datos (.csv / Excel)',
      desc: 'Exporta todas las tareas con fechas, prioridades y responsables compatible con Microsoft Excel y Google Sheets.',
      icon: FileSpreadsheet,
      accentColor: '#10B981',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isExporting ? onClose : undefined}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1C1F26] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6C5DD3]/10 text-[#6C5DD3] flex items-center justify-center border border-[#6C5DD3]/20">
                <Download size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  Exportar Calendario
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {workspaceName} · {currentDateText}
                </p>
              </div>
            </div>
            {!isExporting && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Banner de resumen */}
            <div className="bg-zinc-50 dark:bg-black/20 border border-zinc-200/80 dark:border-white/5 rounded-xl p-3.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-extrabold text-zinc-800 dark:text-zinc-200">{currentDateText}</div>
                <div className="text-zinc-500 text-[11px]">{totalEvents} tarjetas en vista</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {completedCount} completadas
                </div>
                <div className="text-[10px] text-zinc-400 font-semibold">
                  {totalEvents > 0 ? Math.round((completedCount / totalEvents) * 100) : 0}% avance
                </div>
              </div>
            </div>

            {/* Selector de Formatos */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block px-0.5">
                Selecciona el Formato de Descarga
              </label>

              {formats.map((fmt) => {
                const isSelected = selectedFormat === fmt.id;
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.id)}
                    disabled={isExporting}
                    className={`w-full p-3.5 rounded-xl border transition-all text-left flex items-start gap-3 relative ${
                      isSelected
                        ? 'border-[#6C5DD3] bg-[#6C5DD3]/5 dark:bg-[#6C5DD3]/10 shadow-xs'
                        : 'border-zinc-200/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 bg-white dark:bg-[#1C1F26]'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        backgroundColor: isSelected ? fmt.accentColor : 'rgba(113, 118, 132, 0.1)',
                        color: isSelected ? '#ffffff' : fmt.accentColor,
                      }}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                          {fmt.name}
                        </span>
                        {fmt.badge && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#6C5DD3]/15 text-[#6C5DD3] text-[9px] font-black uppercase">
                            {fmt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {fmt.desc}
                      </p>
                    </div>

                    {/* Radio check */}
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all ${
                        isSelected
                          ? 'border-[#6C5DD3] bg-[#6C5DD3]'
                          : 'border-zinc-300 dark:border-white/20 bg-transparent'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-zinc-50/80 dark:bg-black/20 border-t border-zinc-200/80 dark:border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4eb8] text-white text-xs font-extrabold shadow-md shadow-[#6C5DD3]/25 transition-all disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Procesando descarga...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Descargar Archivo</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default CalendarExportModal;
