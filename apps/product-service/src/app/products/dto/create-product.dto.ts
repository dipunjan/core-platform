import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  @MinLength(1)
  sku!: string;
}
