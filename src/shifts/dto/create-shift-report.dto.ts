import { IsArray, ArrayMinSize, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ConsumptionDto {
  @IsInt()
  productId: number;

  @IsInt()
  consumed: number;
}

export class CreateShiftReportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumptionDto)
  consumptions: ConsumptionDto[];
}
