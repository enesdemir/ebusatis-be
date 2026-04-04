import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { DocumentLink } from './entities/document-link.entity';
import { Shipment } from './entities/shipment.entity';
import { ShipmentLine } from './entities/shipment-line.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLine } from './entities/invoice-line.entity';
import { Payment } from './entities/payment.entity';
import { PaymentInvoiceMatch } from './entities/payment-invoice-match.entity';

import { InvoiceService } from './services/invoice.service';
import { PaymentService } from './services/payment.service';
import { InvoiceController } from './controllers/invoice.controller';
import { PaymentController } from './controllers/payment.controller';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      DocumentLink,
      Shipment,
      ShipmentLine,
      Invoice,
      InvoiceLine,
      Payment,
      PaymentInvoiceMatch,
    ]),
    AuthModule,
  ],
  controllers: [InvoiceController, PaymentController],
  providers: [InvoiceService, PaymentService],
  exports: [MikroOrmModule, InvoiceService, PaymentService],
})
export class FinanceModule {}
