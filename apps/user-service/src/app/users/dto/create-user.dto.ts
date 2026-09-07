import { Type } from 'class-transformer';
import { IsEmail, IsString, MinLength, ValidateNested } from 'class-validator';
import { AddressDto } from './address.dto';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(7)
  phone!: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}
