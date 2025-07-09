import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AllowedPhoneService } from './allowed-phone.service';
import { AddPhoneDto } from './dto/add-phone.dto';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';

@Controller('allowed-phones')
export class AllowedPhoneController {
  constructor(private readonly allowedPhoneService: AllowedPhoneService) {}

  /**
   * Добавить разрешенный номер телефона (только для админа)
   */
  @Post('add')
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER', 'IT')
  async addPhone(@Body() dto: AddPhoneDto) {
    const existingPhone = await this.allowedPhoneService.isPhoneAllowed(dto.phone);

    if (existingPhone) {
      // Если телефон уже существует, обновляем комментарий если он передан
      if (dto.comment) {
        const updatedPhone = await this.allowedPhoneService.addPhone(dto.phone, dto.comment);
        return {
          ...updatedPhone,
          message: 'Телефон уже был в списке разрешенных. Комментарий обновлен.',
          wasExisting: true,
        };
      }

      return {
        ...existingPhone,
        message: 'Телефон уже находится в списке разрешенных.',
        wasExisting: true,
      };
    }

    // Если телефона нет, добавляем новый
    const newPhone = await this.allowedPhoneService.addPhone(dto.phone, dto.comment);
    return {
      ...newPhone,
      message: 'Телефон успешно добавлен в список разрешенных.',
      wasExisting: false,
    };
  }

  /**
   * Получить список всех разрешенных номеров телефонов (только для админа)
   */
  @Post('list')
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER', 'IT')
  async getAllPhones() {
    return this.allowedPhoneService.getAll();
  }

  /**
   * Проверить, разрешен ли номер телефона
   */
  @Post('check')
  async checkPhone(@Body('phone') phone: string) {
    const allowedPhone = await this.allowedPhoneService.isPhoneAllowed(phone);
    return {
      phone,
      isAllowed: !!allowedPhone,
      isUsed: !!allowedPhone?.usedById,
      comment: allowedPhone?.comment,
    };
  }
}
