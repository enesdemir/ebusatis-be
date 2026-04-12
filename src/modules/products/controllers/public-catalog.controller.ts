import { Controller, Get, Param } from '@nestjs/common';
import { DigitalCatalogService } from '../services/digital-catalog.service';

/**
 * Public digital-catalog viewer. No auth — the token in the URL is
 * the only credential. View counter is incremented on every hit.
 */
@Controller('public/catalogs')
export class PublicCatalogController {
  constructor(private readonly service: DigitalCatalogService) {}

  @Get(':token')
  view(@Param('token') token: string) {
    return this.service.findByPublicToken(token);
  }
}
