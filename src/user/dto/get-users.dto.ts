import { IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class GetUsersDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  onlyEmployees?: boolean;
}
