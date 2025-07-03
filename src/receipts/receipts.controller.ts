import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { TelegramAuthGuard } from 'src/auth/guards/telegram-auth.guard';
import { User } from 'src/auth/decorators/get-user.decorator';
import { User as UserType } from '@prisma/client';

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post()
  @UseGuards(TelegramAuthGuard)
  async create(@Body() dto: CreateReceiptDto, @User() user: UserType) {
    const receipt = await this.receiptsService.createReceipt(user.id, dto);
    return { data: receipt };
  }
}
