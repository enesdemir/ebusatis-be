import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { AttributeType } from '../entities/attribute.entity';

export class CreateAttributeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(AttributeType)
  type: AttributeType;
}
