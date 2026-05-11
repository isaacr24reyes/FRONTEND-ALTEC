import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

export interface TicketData {
  codigoUnico: string;
  nombre:      string;
  campeon:     string;
  subcampeon:  string;
  tercerLugar: string;
  cuartoLugar: string;
  fecha:       string;
}

// ── Paleta oficial FIFA World Cup 2026 ────────────────────────────────────
type RGB = [number, number, number];
const P = {
  navy:   [0,   39, 93]  as RGB,   // azul oficial FIFA 2026
  green:  [0,  103, 71]  as RGB,   // verde México
  red:    [232, 17, 45]  as RGB,   // rojo Canadá
  gold:   [212,165, 30]  as RGB,   // dorado ALTEC
  white:  [255,255,255]  as RGB,
  offW:   [245,247,252]  as RGB,   // blanco cálido (fondo ticket)
  gray:   [100,110,130]  as RGB,
  lgray:  [180,188,205]  as RGB,
  dark:   [18,  28, 50]  as RGB,
};

@Injectable({ providedIn: 'root' })
export class MundialPdfService {

  // ═══════════════════════════════════════════════════════════════════════
  // 6 TICKETS BLANCOS
  // ═══════════════════════════════════════════════════════════════════════
  generateBlankTickets(): void {
    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const cols = 2;
    const rows = 4;          // 2×4 = 8 tickets
    const mX   = 7;
    const mY   = 7;
    const gapX = 5;
    const gapY = 4;
    const tw   = (210 - mX * 2 - gapX) / cols;          // ≈ 93 mm
    const th   = (297 - mY * 2 - gapY * (rows - 1)) / rows; // ≈ 62 mm

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = mX + c * (tw + gapX);
        const y = mY + r * (th + gapY);
        this.drawBlankTicket(doc, x, y, tw, th);
      }
    }

    doc.save('Tickets_Polla_Mundial_2026.pdf');
  }

  private drawBlankTicket(doc: jsPDF, x: number, y: number, w: number, h: number): void {

    // ── Fondo blanco ──────────────────────────────────────────────────────
    doc.setFillColor(...P.offW);
    doc.roundedRect(x, y, w, h, 2.5, 2.5, 'F');

    // Borde de recorte punteado
    doc.setDrawColor(...P.lgray);
    doc.setLineWidth(0.25);
    doc.setLineDashPattern([1.6, 1.2], 0);
    doc.roundedRect(x, y, w, h, 2.5, 2.5, 'S');
    doc.setLineDashPattern([], 0);

    // ── Franja tricolor top ───────────────────────────────────────────────
    const barH = 2.5;
    const bw   = w / 3;
    doc.setFillColor(...P.green); doc.rect(x,        y, bw,   barH, 'F');
    doc.setFillColor(...P.white); doc.rect(x + bw,   y, bw,   barH, 'F');
    doc.setFillColor(...P.red);   doc.rect(x + bw*2, y, bw,   barH, 'F');

    // ── Header navy ───────────────────────────────────────────────────────
    const hdrH = 10;
    doc.setFillColor(...P.navy);
    doc.rect(x, y + barH, w, hdrH, 'F');

    // Título centrado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...P.white);
    doc.text('POLLA MUNDIAL 2026', x + w / 2, y + barH + 4.5, { align: 'center' });

    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...P.lgray);
    doc.text('FIFA World Cup 2026  •  ALTEC', x + w / 2, y + barH + 8.2, { align: 'center' });

    // Badge $2.00
    const bX = x + w - 12.5;
    const bY = y + barH + 1.8;
    doc.setFillColor(...P.gold);
    doc.roundedRect(bX, bY, 11, 6.5, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...P.navy);
    doc.text('$2.00', bX + 5.5, bY + 4.5, { align: 'center' });

    // ── Campos ────────────────────────────────────────────────────────────
    const lx = x + 4;
    const lw = w - 8;
    let cy   = y + barH + hdrH + 3.5;

    // Espaciado ajustado para encajar en ~62mm de altura
    const rowH = 7.5;   // espacio por campo

    const drawField = (fx: number, fw: number, label: string, yy: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.8);
      doc.setTextColor(...P.navy);
      doc.text(label, fx, yy);
      doc.setDrawColor(...P.lgray);
      doc.setLineWidth(0.25);
      doc.line(fx, yy + 3.2, fx + fw - 0.5, yy + 3.2);
    };

    // Fila 1: Código único (completo)
    drawField(lx, lw, 'CODIGO UNICO', cy);       cy += rowH;
    // Fila 2: Nombre (completo)
    drawField(lx, lw, 'NOMBRE COMPLETO', cy);    cy += rowH;

    // Separador
    doc.setDrawColor(...P.lgray);
    doc.setLineWidth(0.18);
    doc.line(lx, cy, lx + lw, cy);
    cy += 2.5;

    // Fila 3: 1° y 2° en dos columnas
    const hw = lw / 2 - 2;
    drawField(lx,          hw, '1° CAMPEON',    cy);
    drawField(lx + hw + 4, hw, '2° SUBCAMPEON', cy);
    cy += rowH;

    // Fila 4: 3° y 4° en dos columnas
    drawField(lx,          hw, '3° LUGAR', cy);
    drawField(lx + hw + 4, hw, '4° LUGAR', cy);

    // ── Footer navy ───────────────────────────────────────────────────────
    const fy = y + h - 7;
    doc.setFillColor(...P.navy);
    doc.rect(x, fy, w, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.2);
    doc.setTextColor(...P.gold);
    doc.text('Plazo maximo: 8 de julio de 2026', x + w / 2, fy + 3, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(...P.lgray);
    doc.text('altecmec.com  •  Organizado por ALTEC', x + w / 2, fy + 5.8, { align: 'center' });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PDF DE CONFIRMACIÓN (auto tras registrar)
  // ═══════════════════════════════════════════════════════════════════════
  generateConfirmationPDF(data: TicketData): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw  = 210;
    const bw  = pw / 3;

    // ── Fondo blanco ──────────────────────────────────────────────────────
    doc.setFillColor(...P.offW);
    doc.rect(0, 0, pw, 297, 'F');

    // ── Franja top tricolor ────────────────────────────────────────────────
    doc.setFillColor(...P.green); doc.rect(0,    0, bw,   5, 'F');
    doc.setFillColor(...P.white); doc.rect(bw,   0, bw,   5, 'F');
    doc.setFillColor(...P.red);   doc.rect(bw*2, 0, bw,   5, 'F');

    // ── Header navy ───────────────────────────────────────────────────────
    doc.setFillColor(...P.navy);
    doc.rect(0, 5, pw, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...P.white);
    doc.text('PRONOSTICO REGISTRADO', pw / 2, 18, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...P.lgray);
    doc.text('Polla FIFA World Cup 2026  •  Organizado por ALTEC', pw / 2, 26, { align: 'center' });

    // Sello VALIDO (esquina)
    doc.setFillColor(...P.green);
    doc.roundedRect(pw - 38, 8, 30, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...P.white);
    doc.text('REGISTRADO', pw - 23, 14.5, { align: 'center' });

    // ── Card participante ─────────────────────────────────────────────────
    const cX = 15;
    const cW = pw - 30;
    let cy   = 42;

    doc.setFillColor(...P.white);
    doc.setDrawColor(...P.navy);
    doc.setLineWidth(0.5);
    doc.roundedRect(cX, cy, cW, 24, 3, 3, 'FD');

    // Acento verde izquierdo
    doc.setFillColor(...P.navy);
    doc.roundedRect(cX, cy, 4, 24, 3, 3, 'F');
    doc.rect(cX + 1, cy, 3, 24, 'F');

    cy += 6;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...P.gray);
    doc.text('CODIGO UNICO', cX + 10, cy);
    doc.text('PARTICIPANTE', cX + cW / 2 + 5, cy);

    cy += 5;
    doc.setFontSize(15);
    doc.setTextColor(...P.navy);
    doc.setFont('helvetica', 'bold');
    doc.text(data.codigoUnico, cX + 10, cy);

    doc.setFontSize(12);
    doc.setTextColor(...P.dark);
    doc.text(data.nombre, cX + cW / 2 + 5, cy);

    cy += 5;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...P.lgray);
    doc.text('Registrado el ' + data.fecha + '   |   Costo: $2.00', cX + 10, cy);

    // ── Clasificación ─────────────────────────────────────────────────────
    cy += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...P.navy);
    doc.text('CLASIFICACION FINAL', cX, cy);

    doc.setDrawColor(...P.navy);
    doc.setLineWidth(0.5);
    doc.line(cX, cy + 1.5, cX + 55, cy + 1.5);

    cy += 6;
    const positions: { label: string; value: string; accent: RGB }[] = [
      { label: '1° CAMPEON',    value: data.campeon,    accent: P.gold  },
      { label: '2° SUBCAMPEON', value: data.subcampeon, accent: P.lgray },
      { label: '3° LUGAR',      value: data.tercerLugar,accent: [180, 100, 40] as RGB },
      { label: '4° LUGAR',      value: data.cuartoLugar,accent: P.lgray },
    ];

    const posW = (cW - 6) / 2;
    positions.forEach((p, i) => {
      const px = cX + (i % 2) * (posW + 6);
      const py = cy + Math.floor(i / 2) * 20;

      doc.setFillColor(...P.white);
      doc.setDrawColor(...P.lgray);
      doc.setLineWidth(0.3);
      doc.roundedRect(px, py, posW, 16, 2, 2, 'FD');

      // Acento de color en el borde izquierdo
      doc.setFillColor(...p.accent);
      doc.roundedRect(px, py, 3, 16, 2, 2, 'F');
      doc.rect(px + 1, py, 2, 16, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...P.gray);
      doc.text(p.label, px + 6, py + 6);

      doc.setFontSize(9.5);
      doc.setTextColor(...P.dark);
      doc.text(p.value, px + 6, py + 12.5);
    });

    // ── Aviso de validez ──────────────────────────────────────────────────
    cy += 48;
    doc.setFillColor(...P.green);
    doc.roundedRect(cX, cy, cW, 14, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...P.white);
    doc.text('Pronostico valido y guardado en el sistema', pw / 2, cy + 6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(200, 235, 215);
    doc.text('Si tu pronostico no aparece en el aplicativo no contara como ganador.', pw / 2, cy + 11, { align: 'center' });

    // ── Reglamento ────────────────────────────────────────────────────────
    cy += 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...P.navy);
    doc.text('REGLAMENTO', cX, cy);
    doc.setDrawColor(...P.navy);
    doc.setLineWidth(0.4);
    doc.line(cX, cy + 1.5, cX + 38, cy + 1.5);

    cy += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...P.gray);
    [
      '1. Si su pronostico no aparece en el aplicativo no contara como ganador.',
      '2. Solo puede entregar su pronostico hasta el 8 de julio de 2026.',
      '3. Los premios seran: bicicleta, balones y camisetas.',
    ].forEach(r => { doc.text(r, cX, cy); cy += 5; });

    // ── Franja bottom tricolor ────────────────────────────────────────────
    doc.setFillColor(...P.red);   doc.rect(0,    292, bw,   5, 'F');
    doc.setFillColor(...P.white); doc.rect(bw,   292, bw,   5, 'F');
    doc.setFillColor(...P.green); doc.rect(bw*2, 292, bw,   5, 'F');

    doc.save(`Pronostico_${data.codigoUnico}_Mundial2026.pdf`);
  }
}
