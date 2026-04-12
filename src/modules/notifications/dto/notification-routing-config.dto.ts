import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { NotificationChannel } from '../entities/notification-routing-config.entity';

export class CreateNotificationRoutingConfigDto {
  @IsString()
  @IsNotEmpty()
  eventCode!: string;

  @IsOptional()
  @IsUUID()
  recipientGroupId?: string;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels!: NotificationChannel[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateNotificationRoutingConfigDto {
  @IsOptional()
  @IsUUID()
  recipientGroupId?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
