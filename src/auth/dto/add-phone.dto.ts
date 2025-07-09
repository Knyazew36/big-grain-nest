import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class AddPhoneDto {
  @IsString()
  @Matches(/^\+7\d{10}$/, { message: 'Phone number must be in format +7XXXXXXXXXX' })
  phone: string;

  @IsOptional()
  @IsString()
  @Length(0, 256)
  comment?: string;
}
