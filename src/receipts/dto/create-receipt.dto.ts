import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

export class Receipt {
  productId: number;
  quantity: number;
}

export class CreateReceiptDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Receipt)
  receipts: Receipt[];
}
