import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEmail,
  Min,
} from 'class-validator';
import { PartnerType, RiskScore } from '../entities/partner.entity';

export class CreatePartnerDto {
  @IsString() name: string;
  @IsOptional() @IsString() code?: string;
  @IsArray() @IsEnum(PartnerType, { each: true }) types: PartnerType[];
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() defaultCurrencyId?: string;
  @IsOptional() @IsNumber() @Min(0) creditLimit?: number;
  @IsOptional() @IsEnum(RiskScore) riskScore?: RiskScore;
  @IsOptional() @IsString() note?: string;
}

export class UpdatePartnerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional()
  @IsArray()
  @IsEnum(PartnerType, { each: true })
  types?: PartnerType[];
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() defaultCurrencyId?: string;
  @IsOptional() @IsNumber() @Min(0) creditLimit?: number;
  @IsOptional() @IsEnum(RiskScore) riskScore?: RiskScore;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() note?: string;
}

export class CreateCounterpartyDto {
  @IsString() partnerId: string;
  @IsString() legalName: string;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsString() taxOffice?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class CreateAddressDto {
  @IsString() partnerId: string;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() addressLine1?: string;
  @IsOptional() @IsString() addressLine2?: string;
  @IsOptional() @IsString() countryId?: string;
  @IsOptional() @IsString() countryName?: string;
  @IsOptional() @IsString() stateId?: string;
  @IsOptional() @IsString() stateName?: string;
  @IsOptional() @IsString() cityId?: string;
  @IsOptional() @IsString() cityName?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class CreateContactDto {
  @IsString() partnerId: string;
  @IsString() fullName: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
  @IsOptional() @IsString() note?: string;
}

export class CreateInteractionDto {
  @IsString() partnerId: string;
  @IsString() type: string;
  @IsString() summary: string;
  @IsOptional() @IsString() details?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() nextActionDate?: string;
  @IsOptional() @IsString() nextActionNote?: string;
}
