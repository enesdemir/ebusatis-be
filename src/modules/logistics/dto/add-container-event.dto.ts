import {
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { ContainerEventType } from '../entities/container-event.entity';

/**
 * Payload for appending a container event to a shipment timeline.
 *
 * The `eventDate` is required because timelines need to remain
 * deterministic; if the caller does not know the exact time it should
 * pass `new Date().toISOString()` rather than rely on a server default.
 */
export class AddContainerEventDto {
  @IsEnum(ContainerEventType)
  eventType!: ContainerEventType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsDateString()
  @IsNotEmpty()
  eventDate!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
