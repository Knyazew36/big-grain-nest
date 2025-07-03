import { IsString, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsInt()
  @Min(0)
  minThreshold: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
