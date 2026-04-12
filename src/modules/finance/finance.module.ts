import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { DocumentLink } from './entities/document-link.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLine } from './entities/invoice-line.entity';
import { Payment } from './entities/payment.entity';
import { PaymentInvoiceMatch } from './entities/payment-invoice-match.entity';

import { InvoiceService } from './services/invoice.service';
import { PaymentService } from './services/payment.service';
import { CurrentAccountAgingService } from './services/current-account-aging.service';
import { ReconciliationService } from './services/reconciliation.service';
import { InvoiceController } from './controllers/invoice.controller';
import { PaymentController } from './controllers/payment.controller';
import { AccountStatementController } from './controllers/account-statement.controller';

import { AuthModule } from '../auth/auth.module';

/**
 * Finance module.
 *
 * Stage 0.B note: shipment ownership moved out of this module — the
 * unified `Shipment` and `ShipmentLine` entities now live in the
 * logistics module, regardless of direction. This module is now
 * focused on invoices, payments and reconciliation only.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      DocumentLink,
      Invoice,
      InvoiceLine,
      Payment,
      PaymentInvoiceMatch,
    ]),
    AuthModule,
  ],
  controllers: [
    InvoiceController,
    PaymentController,
    AccountStatementController,
  ],
  providers: [
    InvoiceService,
    PaymentService,
    CurrentAccountAgingService,
    ReconciliationService,
  ],
  exports: [
    MikroOrmModule,
    InvoiceService,
    PaymentService,
    CurrentAccountAgingService,
    ReconciliationService,
  ],
})
export class FinanceModule {}
