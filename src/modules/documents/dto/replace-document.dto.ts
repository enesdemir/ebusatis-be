import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Payload accompanying a new version upload.
 *
 * The file comes from multer; the metadata here lets the caller
 * optionally refresh the description when rolling over a version.
 */
export class ReplaceDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
