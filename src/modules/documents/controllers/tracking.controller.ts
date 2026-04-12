import { Controller, Get, Param } from '@nestjs/common';
import { TrackingService } from '../services/tracking.service';

/**
 * Public tracking controller.
 *
 * Endpoint: `GET /track/:uuid` — intentionally unauthenticated so a
 * supplier can scan the QR code printed on a PDF and see a minimal
 * status summary without creating an account.
 *
 * The service takes care of only exposing non-sensitive fields.
 */
@Controller('track')
export class TrackingController {
  constructor(private readonly service: TrackingService) {}

  @Get(':uuid')
  resolve(@Param('uuid') uuid: string) {
    return this.service.resolve(uuid);
  }
}
