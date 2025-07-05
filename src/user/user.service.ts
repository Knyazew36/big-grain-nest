import { Injectable, NotFoundException } from '@nestjs/common';
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
    const { role, onlyEmployees } = query;

    let whereClause: any = {};

    // Если запрошены только сотрудники, фильтруем по ролям OPERATOR и ADMIN
    if (onlyEmployees) {
      whereClause.role = {
        in: [Role.OPERATOR, Role.ADMIN],
      };
    }

    // Если указана конкретная роль, добавляем её в фильтр
    if (role) {
      whereClause.role = role;
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
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }

  async getEmployees(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        role: {
          in: [Role.OPERATOR, Role.ADMIN],
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
}
