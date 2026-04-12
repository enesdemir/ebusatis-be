import { PartialType } from '@nestjs/mapped-types';
import { CreateCarrierPaymentDto } from './create-carrier-payment.dto';

/**
 * Payload for updating a carrier payment installment.
 * All fields from `CreateCarrierPaymentDto` become optional.
 */
export class UpdateCarrierPaymentDto extends PartialType(CreateCarrierPaymentDto) {}
