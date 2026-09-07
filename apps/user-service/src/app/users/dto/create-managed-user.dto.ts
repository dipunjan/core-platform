import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AddressDto } from './address.dto';

export class CreateManagedUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(['customer', 'admin'])
  role!: 'customer' | 'admin';

  @IsString()
  @MinLength(7)
  phone!: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}
