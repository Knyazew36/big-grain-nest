import { IsString, IsOptional, Length } from 'class-validator';

/**
 * @deprecated Используйте авторизацию через номер телефона в боте
 */
export class CreateAccessRequestDto {
  @IsString()
  @Length(1, 64)
  telegramId: string;

  @IsOptional()
  @IsString()
  @Length(0, 256)
  message?: string;
}
