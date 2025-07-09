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
    try {
      return await this.prisma.allowedPhone.create({ data: { phone, comment } });
    } catch (error) {
      // Если телефон уже существует, обновляем комментарий если он передан
      if (error.code === 'P2002' && comment) {
        return await this.prisma.allowedPhone.update({
          where: { phone },
          data: { comment },
        });
      }
      // Если телефон уже существует и комментарий не передан, возвращаем существующую запись
      if (error.code === 'P2002') {
        return await this.prisma.allowedPhone.findUnique({ where: { phone } });
      }
      throw error;
    }
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
