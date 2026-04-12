import { IsBooleanString, IsOptional, IsString } from 'class-validator';

/**
 * Filter query for the per-entity document list.
 *
 * By default only current (non-superseded) documents are returned;
 * `includeHistory=true` brings along replaced rows so the UI can show
 * a version timeline.
 */
export class ListDocumentsQueryDto {
  @IsString()
  entityType!: string;

  @IsString()
  entityId!: string;

  @IsOptional()
  @IsBooleanString()
  includeHistory?: string;
}
