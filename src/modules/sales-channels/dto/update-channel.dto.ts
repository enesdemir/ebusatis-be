import { PartialType } from '@nestjs/mapped-types';
import { CreateChannelDto } from './create-channel.dto';

/**
 * Payload for updating a sales channel. All fields optional.
 */
export class UpdateChannelDto extends PartialType(CreateChannelDto) {}
