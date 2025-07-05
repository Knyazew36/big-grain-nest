import { Body, Controller, Post, UseGuards, Get } from '@nestjs/common';
import { CreateShiftReportDto } from './dto/create-shift-report.dto';
import { ShiftsService } from './shifts.service';
import { TelegramAuthGuard } from 'src/auth/guards/telegram-auth.guard';
import { User } from 'src/auth/decorators/get-user.decorator';
import { User as UserType } from '@prisma/client';
@UseGuards(TelegramAuthGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  async create(@Body() dto: CreateShiftReportDto, @User() user: UserType) {
    const shift = await this.shiftsService.createShiftReport(user.id, dto.consumptions);
    return { data: shift };
  }

  @Get()
  async findAll() {
    return { data: await this.shiftsService.findAll() };
  }
}
