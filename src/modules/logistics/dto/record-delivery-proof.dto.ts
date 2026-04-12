import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class RecordDeliveryProofDto {
  @IsString()
  @IsNotEmpty()
  recipientName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32, {
    message: 'errors.logistics.delivery_proof_signature_required',
  })
  signatureBase64!: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
