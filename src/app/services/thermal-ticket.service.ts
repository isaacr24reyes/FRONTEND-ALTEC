import { Injectable } from '@angular/core';

/**
 * Tickets para la impresora térmica de 80 mm (área imprimible 72 mm).
 * En la ventana ALTEC POS (Chrome con --kiosk-printing) se imprimen directo, sin diálogo.
 */
@Injectable({
  providedIn: 'root'
})
export class ThermalTicketService {
  private logo: string | null = null;

  money(v: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(v || 0);
  }

  esc(t: any): string {
    return String(t ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /** Fecha y hora en Ecuador: { fecha: dd/mm/aaaa, hora: hh:mm a. m. } */
  fechaHora(date: Date = new Date()): { fecha: string; hora: string } {
    const fecha = new Intl.DateTimeFormat('es-EC', {
      timeZone: 'America/Guayaquil', day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(date);
    const hora = new Intl.DateTimeFormat('es-EC', {
      timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit', hour12: true
    }).format(date);
    return { fecha, hora };
  }

  /** Documento completo del ticket: estilos comunes + logo + contenido. */
  async buildDocument(title: string, body: string): Promise<string> {
    const logo = await this.getLogo();
    return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>${this.esc(title)}</title>
<style>
  @page { size: 72mm 297mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body { width: 72mm; padding: 2mm 2.5mm; font-family: Arial, Helvetica, sans-serif; font-size: 11.5px; line-height: 1.3; }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .logo { display: block; width: 52mm; margin: 1mm auto 2mm; }
  .brand { font-size: 15px; font-weight: 800; letter-spacing: 0.5px; }
  .small { font-size: 10.5px; }
  .tiny { font-size: 9.5px; }
  .sep { border-top: 1px dashed #000; margin: 2mm 0; }
  .sep-strong { border-top: 2px solid #000; margin: 2mm 0; }
  .title { font-size: 14px; font-weight: 800; }
  .row { display: flex; justify-content: space-between; gap: 2mm; }
  .item { margin-bottom: 1.5mm; }
  .desc { font-weight: 700; word-break: break-word; }
  .total { font-size: 16px; font-weight: 800; }
  .mono { font-family: 'Courier New', monospace; word-break: break-all; letter-spacing: 0.3px; }
</style></head>
<body>
  ${logo ? `<img class="logo" src="${logo}" alt="ALTEC">` : ''}
  ${body}
</body></html>`;
  }

  /** Logo de la barra (letras blancas) convertido a negro y recortado, para papel térmico. */
  getLogo(): Promise<string | null> {
    if (this.logo) return Promise.resolve(this.logo);

    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = data.data;
        let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            if (px[i + 3] > 60) {
              px[i] = px[i + 1] = px[i + 2] = 0;
              px[i + 3] = 255;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            } else {
              px[i + 3] = 0;
            }
          }
        }

        if (maxX < 0) return resolve(null);
        ctx.putImageData(data, 0, 0);

        const crop = document.createElement('canvas');
        crop.width = maxX - minX + 1;
        crop.height = maxY - minY + 1;
        crop.getContext('2d')?.drawImage(canvas, minX, minY, crop.width, crop.height, 0, 0, crop.width, crop.height);
        this.logo = crop.toDataURL('image/png');
        resolve(this.logo);
      };
      img.onerror = () => resolve(null);
      img.src = 'assets/images/LOGIN.png';
    });
  }

  /** Imprime un HTML en un iframe oculto (en ALTEC POS sale directo a la impresora predeterminada). */
  print(html: string): Promise<void> {
    return new Promise(resolve => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) {
        iframe.remove();
        return resolve();
      }

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        setTimeout(() => iframe.remove(), 1000);
        resolve();
      };

      doc.open();
      doc.write(html);
      doc.close();

      const images = Array.from(doc.images);
      Promise.all(images.map(img => img.complete
        ? Promise.resolve()
        : new Promise(r => { img.onload = img.onerror = r; })))
        .then(() => {
          win.onafterprint = finish;
          win.focus();
          win.print();
          setTimeout(finish, 60000);
        });
    });
  }
}
