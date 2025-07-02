import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создаёт ShiftReport и уменьшает остатки для каждого продукта
   */
  async createShiftReport(userId: number, consumptions: { productId: number; consumed: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      // 1) Проверяем, что не было отчёта с точно таким же userId+createdAt (при необходимости)
      //    (для MVP пропустим дубли)

      // 2) Создаём отчёт
      const shift = await tx.shiftReport.create({
        data: { userId, consumptions },
      });

      // 3) Обновляем остатки товаров
      for (const { productId, consumed } of consumptions) {
        const prod = await tx.product.findUnique({ where: { id: productId } });
        if (!prod) {
          throw new BadRequestException(`Продукт ${productId} не найден`);
        }
        if (consumed > prod.quantity) {
          throw new BadRequestException(
            `Нельзя израсходовать ${consumed}, на складе только ${prod.quantity}`,
          );
        }
        await tx.product.update({
          where: { id: productId },
          data: { quantity: { decrement: consumed } },
        });
      }

      return shift;
    });
  }
}
