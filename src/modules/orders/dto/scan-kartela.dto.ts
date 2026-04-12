import { IsString, IsNotEmpty } from 'class-validator';

export class ScanKartelaDto {
  @IsString()
  @IsNotEmpty()
  barcode!: string;
}
