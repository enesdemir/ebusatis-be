import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateLeadSourceDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be UPPER_SNAKE_CASE',
  })
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
