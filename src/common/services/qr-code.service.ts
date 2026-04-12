import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

/**
 * QR code generation utility.
 *
 * Shared across modules that embed QR codes into PDFs or JSON
 * responses (purchase orders, kartela labels, shipments, etc.).
 *
 * The generator produces a PNG data-URL (`data:image/png;base64,...`)
 * that the frontend can render directly into an `<img src>` without a
 * second round trip, and that pdfmake can embed as an image in a
 * generated document.
 */
@Injectable()
export class QrCodeService {
  /**
   * Encode an arbitrary string into a PNG data-URL.
   *
   * @param payload — text to encode (e.g. a tracking URL).
   * @param size    — pixel width/height of the output PNG. Defaults
   *                  to 256 which is enough for on-screen display and
   *                  for a 3cm square on a printed PDF.
   */
  async generate(payload: string, size = 256): Promise<string> {
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size,
    });
  }
}
