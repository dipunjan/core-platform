import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AdjustStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount!: number;
}
