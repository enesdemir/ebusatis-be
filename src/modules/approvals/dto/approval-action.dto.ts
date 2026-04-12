import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Payload for approve / reject / delegate actions.
 *
 * `comment` is required for rejections (enforced in the service);
 * `delegateUserId` is required for delegation. We don't enforce
 * those at the DTO level so the service can return rich error codes
 * with i18n keys instead of generic class-validator messages.
 */
export class ApprovalActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsUUID()
  delegateUserId?: string;
}
