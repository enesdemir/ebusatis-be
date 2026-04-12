import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DocumentType } from '../entities/document.entity';

/**
 * Payload for registering a user-uploaded document.
 *
 * The file itself is delivered via `@UploadedFile()` (multer); this
 * DTO carries the accompanying metadata that the service needs to
 * create the `Document` row and attach it to a business entity.
 */
export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  entityType!: string;

  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
