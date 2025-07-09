import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';

export class GetUsersDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  onlyEmployees?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDeleted?: boolean;
}
