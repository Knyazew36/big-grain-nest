import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { User, Role } from '@prisma/client';
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {
    console.log('🟢 UsersService создан', new Date().toISOString());
  }

  async findAll(query: GetUsersDto = {}): Promise<User[]> {
    const { role, onlyEmployees, includeDeleted } = query;

    let whereClause: any = {};

    // Если запрошены только сотрудники, фильтруем по ролям OPERATOR и ADMIN
    if (onlyEmployees) {
      whereClause.role = {
        not: [Role.GUEST, Role.BLOCKED],
      };
    }

    // Если указана конкретная роль, добавляем её в фильтр
    if (role) {
      whereClause.role = role;
    }

    // По умолчанию показываем только активных пользователей
    if (!includeDeleted) {
      whereClause.active = true;
    }

    return this.prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { telegramId } });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number): Promise<User> {
    const user = await this.findOne(id);

    // Проверяем, не пытаемся ли удалить владельца системы
    if (user.role === Role.OWNER) {
      throw new BadRequestException('Нельзя удалить владельца системы');
    }

    // Начинаем транзакцию для атомарного удаления
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Отвязываем номер телефона от пользователя
      await prisma.allowedPhone.updateMany({
        where: { usedById: id },
        data: { usedById: null },
      });

      // 2. Отменяем все активные заявки на доступ пользователя
      await prisma.accessRequest.updateMany({
        where: {
          userId: id,
          status: 'PENDING',
        },
        data: {
          status: 'DECLINED',
          adminNote: 'Отменено при удалении пользователя',
          processedAt: new Date(),
        },
      });

      // 3. Отключаем все напоминания пользователя
      await prisma.reminder.updateMany({
        where: { userId: id },
        data: { enabled: false },
      });

      // 4. Удаляем настройки уведомлений
      await prisma.notificationSetting.deleteMany({
        where: { userId: id },
      });

      // 5. Мягкое удаление пользователя - помечаем как неактивного и блокируем
      const deletedUser = await prisma.user.update({
        where: { id },
        data: {
          active: false,
          role: Role.BLOCKED,
          telegramId: `deleted_${user.telegramId}_${Date.now()}`, // Уникальный ID для удаленного пользователя
        },
      });

      return deletedUser;
    });
  }

  /**
   * Полное удаление пользователя (жесткое удаление)
   * Удаляет все связанные данные и самого пользователя
   */
  async hardRemove(id: number): Promise<void> {
    const user = await this.findOne(id);

    // Проверяем, не пытаемся ли удалить владельца системы
    if (user.role === Role.OWNER) {
      throw new BadRequestException('Нельзя удалить владельца системы');
    }

    // Начинаем транзакцию для атомарного удаления
    await this.prisma.$transaction(async (prisma) => {
      // 1. Удаляем все связанные данные пользователя
      await prisma.notificationLog.deleteMany({ where: { userId: id } });
      await prisma.reminder.deleteMany({ where: { userId: id } });
      await prisma.accessRequest.deleteMany({ where: { userId: id } });
      await prisma.accessRequest.deleteMany({ where: { processedById: id } });
      await prisma.shiftReport.deleteMany({ where: { userId: id } });
      await prisma.receipt.deleteMany({ where: { operatorId: id } });

      // 2. Отвязываем номера телефонов
      await prisma.allowedPhone.updateMany({
        where: { usedById: id },
        data: { usedById: null },
      });

      // 3. Удаляем настройки уведомлений
      await prisma.notificationSetting.deleteMany({ where: { userId: id } });

      // 4. Удаляем самого пользователя
      await prisma.user.delete({ where: { id } });
    });
  }

  /**
   * Восстановить удаленного пользователя
   */
  async restore(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (user.active) {
      throw new BadRequestException('Пользователь уже активен');
    }

    // Восстанавливаем пользователя
    return this.prisma.user.update({
      where: { id },
      data: {
        active: true,
        role: Role.GUEST, // Восстанавливаем с базовой ролью
        telegramId: user.telegramId.replace(/^deleted_.*_/, ''), // Восстанавливаем оригинальный telegramId
      },
    });
  }

  /**
   * Получить список удаленных пользователей
   */
  async getDeletedUsers(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { active: false },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getEmployees(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        role: {
          in: [Role.OPERATOR, Role.ADMIN, Role.OWNER],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUsersByRole(role: Role): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserRole(telegramId: string): Promise<{ role: Role }> {
    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      throw new NotFoundException(`User #${telegramId} not found`);
    }
    return { role: user.role };
  }
}
