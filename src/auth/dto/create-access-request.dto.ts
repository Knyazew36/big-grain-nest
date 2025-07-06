import { IsString, IsOptional, Length } from 'class-validator';

export class CreateAccessRequestDto {
  @IsString()
  @Length(1, 64)
  telegramId: string;

  @IsOptional()
  @IsString()
  @Length(0, 256)
  message?: string;
}
