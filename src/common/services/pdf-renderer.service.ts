import { Injectable, Logger } from '@nestjs/common';
import type { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';

/**
 * Server-side runtime entry-point of pdfmake.
 *
 * The npm package's published `@types/pdfmake` only types the browser
 * (`createPdf`) helper; the Node-side printer class lives at the
 * package root and is exported as a constructor at runtime. We type
 * it manually here so the rest of the service stays type-safe.
 */
interface PdfPrinterCtor {
  new (fonts: TFontDictionary): {
    createPdfKitDocument: (def: TDocumentDefinitions) => NodeJS.ReadableStream;
  };
}
// pdfmake's published types only describe the browser API; the
// server-side default export is the printer constructor we cast to.
import PdfPrinterImport from 'pdfmake';
const PdfPrinter = PdfPrinterImport as unknown as PdfPrinterCtor;

/**
 * PDF rendering utility built on top of pdfmake.
 *
 * Templates live next to the entity that owns them
 * (`modules/.../pdf-templates/*.template.ts`) and just return a
 * `TDocumentDefinitions`. This service takes care of the printer +
 * font setup once and turns a definition into a Buffer that callers
 * can stream to the client or hand off to `DocumentService` for
 * archival.
 *
 * Fonts: pdfmake bundles Roboto via build assets when run in the
 * browser, but on the server we register the standard 14 PDF fonts
 * (Helvetica / Courier) which ship with every PDF reader and need
 * no font files on disk.
 */
@Injectable()
export class PdfRendererService {
  private readonly logger = new Logger(PdfRendererService.name);
  private readonly printer: InstanceType<PdfPrinterCtor>;

  constructor() {
    const fonts: TFontDictionary = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
      Courier: {
        normal: 'Courier',
        bold: 'Courier-Bold',
        italics: 'Courier-Oblique',
        bolditalics: 'Courier-BoldOblique',
      },
    };
    this.printer = new PdfPrinter(fonts);
  }

  /**
   * Render a definition into a single Buffer.
   *
   * Resolves once pdfmake emits its `'end'` event, rejects on `'error'`
   * so callers get a clean async surface. Default font is Helvetica.
   */
  async render(definition: TDocumentDefinitions): Promise<Buffer> {
    const docDefinition: TDocumentDefinitions = {
      defaultStyle: { font: 'Helvetica', fontSize: 10 },
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      ...definition,
    };

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const stream = this.printer.createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (err: Error) => {
          this.logger.error(`pdf render failed: ${err.message}`);
          reject(err);
        });
        if (
          'end' in stream &&
          typeof (stream as { end?: unknown }).end === 'function'
        ) {
          (stream as unknown as { end: () => void }).end();
        }
      } catch (err) {
        this.logger.error(`pdf render threw synchronously: ${String(err)}`);
        reject(err as Error);
      }
    });
  }
}
