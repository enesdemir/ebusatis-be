import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { TrackingService } from '../services/tracking.service';
import { PdfService } from '../services/pdf.service';

/**
 * Public tracking controller.
 *
 * Endpoints:
 *  - `GET /track/:uuid`              — supplier-facing PO status,
 *                                      reached via QR code on a PDF
 *  - `GET /verify/payment/:id`       — customer-facing receipt verify
 *                                      reached via QR on the receipt
 *
 * Both routes are intentionally unauthenticated; the underlying
 * services scrub their payloads to non-sensitive fields only.
 */
@Controller()
export class TrackingController {
  constructor(
    private readonly tracking: TrackingService,
    private readonly pdfService: PdfService,
  ) {}

  @Get('track/:uuid')
  resolve(@Param('uuid') uuid: string) {
    return this.tracking.resolve(uuid);
  }

  @Get('verify/payment/:id')
  async verifyPayment(@Param('id') id: string) {
    const result = await this.pdfService.resolvePaymentForVerify(id);
    if (!result) {
      throw new NotFoundException({
        errorCode: 'PAYMENT_NOT_FOUND',
        i18nKey: 'errors.payment.notFound',
      });
    }
    return result;
  }
}
