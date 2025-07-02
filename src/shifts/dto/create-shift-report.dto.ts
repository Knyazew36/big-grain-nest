import { IsArray, ArrayMinSize, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

class ConsumptionDto {
  @IsInt()
  productId: number;

  @IsInt()
  @Min(0)
  consumed: number;
}

export class CreateShiftReportDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConsumptionDto)
  consumptions: ConsumptionDto[];
}
