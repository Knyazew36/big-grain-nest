import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class AllowedPhoneService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Проверить, разрешён ли номер телефона
   */
  async isPhoneAllowed(phone: string) {
    return this.prisma.allowedPhone.findUnique({ where: { phone } });
  }

  /**
   * Добавить номер телефона (для админки)
   */
  async addPhone(phone: string, comment?: string) {
    return this.prisma.allowedPhone.create({ data: { phone, comment } });
  }

  /**
   * Привязать номер к пользователю
   */
  async bindPhoneToUser(phone: string, userId: number) {
    return this.prisma.allowedPhone.update({
      where: { phone },
      data: { usedById: userId },
    });
  }

  /**
   * Получить все разрешённые номера
   */
  async getAll() {
    return this.prisma.allowedPhone.findMany();
  }
}
