import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PdfService, RenderedPdf } from '../services/pdf.service';

interface BatchKartelaDto {
  rollIds: string[];
}

/**
 * PDF generation controller.
 *
 * Each endpoint streams a `application/pdf` response with a clean
 * `Content-Disposition` header so the browser triggers a "Save as"
 * dialog. Rendering is synchronous — for very large batches the
 * caller can split the request (kartela labels can hit hundreds of
 * QR codes per batch).
 */
@Controller('pdf')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PdfController {
  constructor(private readonly pdf: PdfService) {}

  @Get('purchase-orders/:id')
  async purchaseOrder(@Param('id') id: string, @Res() res: Response) {
    return this.stream(res, await this.pdf.renderPurchaseOrder(id));
  }

  @Get('sales-orders/:id')
  async salesOrder(@Param('id') id: string, @Res() res: Response) {
    return this.stream(res, await this.pdf.renderSalesOrder(id));
  }

  @Get('invoices/:id')
  async invoice(@Param('id') id: string, @Res() res: Response) {
    return this.stream(res, await this.pdf.renderInvoice(id));
  }

  @Get('payments/:id')
  async payment(@Param('id') id: string, @Res() res: Response) {
    return this.stream(res, await this.pdf.renderPaymentReceipt(id));
  }

  @Get('shipments/:id')
  async shipment(@Param('id') id: string, @Res() res: Response) {
    return this.stream(res, await this.pdf.renderShipment(id));
  }

  @Get('supplier-claims/:id')
  async claim(@Param('id') id: string, @Res() res: Response) {
    return this.stream(res, await this.pdf.renderClaimReport(id));
  }

  @Get('customer-transfers/:shipmentId')
  async transfer(
    @Param('shipmentId') shipmentId: string,
    @Res() res: Response,
  ) {
    return this.stream(res, await this.pdf.renderCustomerTransfer(shipmentId));
  }

  /**
   * Kartela labels accept either a single roll (`?rollId=`) for a
   * one-off reprint, or a batch via POST body so the URL doesn't
   * blow past the 8KB limit when printing 100+ labels at once.
   */
  @Get('kartela-labels')
  async kartelaSingle(
    @Query('rollId') rollId: string | undefined,
    @Res() res: Response,
  ) {
    const ids = rollId ? [rollId] : [];
    return this.stream(res, await this.pdf.renderKartelaLabels(ids));
  }

  @Post('kartela-labels/batch')
  async kartelaBatch(@Body() dto: BatchKartelaDto, @Res() res: Response) {
    return this.stream(res, await this.pdf.renderKartelaLabels(dto.rollIds));
  }

  @Get('shipping-labels/:packingId')
  async shippingLabels(
    @Param('packingId') packingId: string,
    @Res() res: Response,
  ) {
    return this.stream(res, await this.pdf.renderShippingLabels(packingId));
  }

  private stream(res: Response, pdf: RenderedPdf) {
    res
      .status(200)
      .setHeader('Content-Type', pdf.mimeType)
      .setHeader('Content-Disposition', `inline; filename="${pdf.fileName}"`)
      .send(pdf.buffer);
  }
}
