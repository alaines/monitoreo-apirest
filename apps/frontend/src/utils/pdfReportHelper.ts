import jsPDF from 'jspdf';
import { LOGO_MUNILIMA_COLOR } from '../assets/logoMunilimaBase64';

export interface PdfMetadataItem {
  label: string;
  value: string;
}

export interface PdfKpiItem {
  label: string;
  value: string;
  sub?: string;
  color?: [number, number, number];
}

/**
 * Paleta de Colores Institucionales para Reportes PDF
 */
export const PDF_COLORS = {
  primary: [29, 84, 109] as [number, number, number],      // #1D546D - Azul Petróleo MML
  secondary: [95, 149, 152] as [number, number, number],  // #5F9598 - Azul Verdoso
  textDark: [51, 65, 85] as [number, number, number],      // #334155 - Slate 700
  textMuted: [100, 116, 139] as [number, number, number],  // #64748B - Slate 500
  textLight: [148, 163, 184] as [number, number, number], // #94A3B8 - Slate 400
  border: [226, 232, 240] as [number, number, number],    // #E2E8F0 - Gris borde fino
  bgCard: [245, 247, 250] as [number, number, number],    // #F5F7FA - Fondo de tarjetas
  success: [16, 185, 129] as [number, number, number],    // #10B981 - Verde
  warning: [245, 158, 11] as [number, number, number],    // #F59E0B - Ámbar
  danger: [239, 68, 68] as [number, number, number],      // #EF4444 - Rojo
};

/**
 * Dibuja el encabezado institucional estandarizado en el documento PDF
 * @param doc Instancia de jsPDF
 * @param isFirstPage Si es la primera página (encabezado completo con logo) o secundaria (compacto)
 * @param subTitulo Título específico del reporte (ej. "Reporte Estadístico de Incidencias y Averías")
 * @param rightText Texto para el extremo derecho en páginas secundarias (ej. "Período: Septiembre 2026")
 * @returns Coordenada Y donde puede comenzar el contenido subsiguiente
 */
export function drawPdfHeader(
  doc: jsPDF,
  isFirstPage: boolean,
  subTitulo: string,
  rightText?: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  if (isFirstPage) {
    // 1. Barra superior decorativa institucional
    doc.setFillColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
    doc.rect(0, 0, pageWidth, 3.5, 'F');

    // 2. Bloque de títulos institucionales (Lado Izquierdo)
    doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEMA DE MONITOREO DE SEMÁFOROS', 14, 12);

    doc.setTextColor(PDF_COLORS.textDark[0], PDF_COLORS.textDark[1], PDF_COLORS.textDark[2]);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Subgerencia de Gestión y Fiscalización', 14, 17.5);

    doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('División de Monitoreo y Control', 14, 22.5);

    doc.setTextColor(PDF_COLORS.textMuted[0], PDF_COLORS.textMuted[1], PDF_COLORS.textMuted[2]);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.text(subTitulo, 14, 27);

    // 3. Logotipo Oficial Municipalidad de Lima (Lado Derecho)
    if (LOGO_MUNILIMA_COLOR) {
      try {
        // Relación de aspecto ~2.43:1 (w: 52mm, h: 21.5mm)
        const logoWidth = 52;
        const logoHeight = 21.5;
        const logoX = pageWidth - logoWidth - 14;
        doc.addImage(LOGO_MUNILIMA_COLOR, 'PNG', logoX, 6.5, logoWidth, logoHeight);
      } catch (e) {
        console.warn('No se pudo incrustar el logo en PDF:', e);
      }
    }

    // 4. Línea divisoria inferior del encabezado
    doc.setDrawColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
    doc.setLineWidth(0.6);
    doc.line(14, 30, pageWidth - 14, 30);

    return 36;
  } else {
    // Encabezado compacto para páginas secundarias
    doc.setFillColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
    doc.rect(0, 0, pageWidth, 2.5, 'F');

    doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEMA DE MONITOREO DE SEMÁFOROS', 14, 8);

    doc.setTextColor(PDF_COLORS.textMuted[0], PDF_COLORS.textMuted[1], PDF_COLORS.textMuted[2]);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Subgerencia de Gestión y Fiscalización | División de Monitoreo y Control', 14, 12);

    if (rightText) {
      doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(rightText, pageWidth - 14, 10, { align: 'right' });
    }

    doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
    doc.setLineWidth(0.3);
    doc.line(14, 14.5, pageWidth - 14, 14.5);

    return 20;
  }
}

/**
 * Aplica el pie de página institucional a todas las páginas del documento
 * @param doc Instancia de jsPDF
 */
export function applyPdfFooters(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  const fechaHoy = new Date().toLocaleDateString('es-PE');

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Línea divisoria superior del pie de página
    doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    // Textos del pie de página
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_COLORS.textLight[0], PDF_COLORS.textLight[1], PDF_COLORS.textLight[2]);

    doc.text('Municipalidad Metropolitana de Lima', 14, pageHeight - 7);
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
    doc.text(fechaHoy, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
}

/**
 * Dibuja una lista de metadatos estructurados en 1 o 2 columnas
 */
export function drawPdfMetadata(
  doc: jsPDF,
  startY: number,
  items: PdfMetadataItem[]
): number {
  let y = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const isTwoCol = items.length > 2 && pageWidth >= 200;

  if (isTwoCol) {
    const col2X = Math.round(pageWidth / 2) + 5;
    for (let i = 0; i < items.length; i += 2) {
      const item1 = items[i];
      const item2 = items[i + 1];

      doc.setTextColor(33, 37, 41);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item1.label}: `, 14, y);
      const w1 = doc.getTextWidth(`${item1.label}: `);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(item1.value || 'N/A', 14 + w1, y);

      if (item2) {
        doc.setTextColor(33, 37, 41);
        doc.setFont('helvetica', 'bold');
        doc.text(`${item2.label}: `, col2X, y);
        const w2 = doc.getTextWidth(`${item2.label}: `);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(item2.value || 'N/A', col2X + w2, y);
      }
      y += 5;
    }
  } else {
    items.forEach(item => {
      doc.setTextColor(33, 37, 41);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.label}: `, 14, y);
      const w = doc.getTextWidth(`${item.label}: `);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(item.value || 'N/A', 14 + w, y);
      y += 5;
    });
  }

  return y + 2;
}

/**
 * Dibuja tarjetas de KPIs con estilo institucional estándar
 */
export function drawPdfKpiCards(
  doc: jsPDF,
  startY: number,
  kpis: PdfKpiItem[]
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 3;
  const count = kpis.length;
  const totalWidth = pageWidth - (margin * 2);
  const cardWidth = (totalWidth - (count - 1) * gap) / count;
  const cardHeight = 16;

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (cardWidth + gap);
    const color = kpi.color || PDF_COLORS.primary;

    // Fondo redondeado de tarjeta
    doc.setFillColor(PDF_COLORS.bgCard[0], PDF_COLORS.bgCard[1], PDF_COLORS.bgCard[2]);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'D');

    // Línea superior decorativa
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x, startY, cardWidth, 1.2, 'F');

    // Etiqueta KPI
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_COLORS.textMuted[0], PDF_COLORS.textMuted[1], PDF_COLORS.textMuted[2]);
    doc.text(kpi.label, x + cardWidth / 2, startY + 5.2, { align: 'center' });

    // Valor KPI
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(kpi.value, x + cardWidth / 2, startY + 11.2, { align: 'center' });

    // Subtexto opcional
    if (kpi.sub) {
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.textLight[0], PDF_COLORS.textLight[1], PDF_COLORS.textLight[2]);
      doc.text(kpi.sub, x + cardWidth / 2, startY + 14.2, { align: 'center' });
    }
  });

  return startY + cardHeight + 6;
}

/**
 * Configuración estándar para tablas AutoTable con estilo institucional
 */
export function getPdfTableStyles() {
  return {
    theme: 'grid' as const,
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold' as const,
      fontSize: 8.5,
      halign: 'center' as const,
      valign: 'middle' as const,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] as [number, number, number],
    },
    styles: {
      font: 'helvetica' as const,
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.2,
      textColor: [33, 37, 41] as [number, number, number],
    },
    margin: { left: 14, right: 14 },
  };
}
