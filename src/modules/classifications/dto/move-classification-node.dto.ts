import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Payload for moving a classification node to a new parent.
 */
export class MoveNodeDto {
  @IsString()
  @IsNotEmpty()
  newParentId!: string;
}
