import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateReceiptDto } from './dto/create-receipt.dto';

export interface StatisticsProduct {
  product: any; // Можно заменить на Product из @prisma/client
  quantity: number;
}

export interface StatisticsOperation {
  type: 'income' | 'outcome';
  date: Date;
  user: any; // Можно заменить на User из @prisma/client
  products: StatisticsProduct[];
}

export interface StatisticsResult {
  periodStart: Date;
  periodEnd: Date;
  data: StatisticsOperation[];
}

@Injectable()
export class ReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReceipt(userId: number, dto: CreateReceiptDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: dto.productId } });
      if (!product) {
        throw new BadRequestException('Товар не найден');
      }
      const receipt = await tx.receipt.create({
        data: {
          productId: dto.productId,
          quantity: dto.quantity,
          operatorId: userId,
        },
      });
      await tx.product.update({
        where: { id: dto.productId },
        data: { quantity: { increment: dto.quantity } },
      });
      return receipt;
    });
  }

  async getStatistics(start?: string, end?: string): Promise<StatisticsResult> {
    // Определяем период по умолчанию (последний месяц)
    let periodStart: Date, periodEnd: Date;
    const now = new Date();
    if (start) {
      periodStart = new Date(start);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    if (end) {
      periodEnd = new Date(end);
    } else {
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Получаем только активные продукты
    const [products, users, receipts, shiftReports] = await Promise.all([
      this.prisma.product.findMany({ where: { active: true } }),
      this.prisma.user.findMany(),
      this.prisma.receipt.findMany({
        where: {
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      }),
      this.prisma.shiftReport.findMany({
        where: {
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      }),
    ]);

    // Маппинг id → объект
    const productMap = new Map(products.map((p) => [p.id, p]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Приходы
    const incomes = receipts.map((r) => ({
      type: 'income' as const,
      date: r.createdAt,
      user: userMap.get(r.operatorId) || null,
      products: [
        {
          product: productMap.get(r.productId) || null,
          quantity: r.quantity,
        },
      ],
    }));

    // Расходы
    const outcomes = shiftReports.map((sr) => {
      const user = userMap.get(sr.userId) || null;
      let consumptions: { product: any; quantity: number }[] = [];
      try {
        let raw = sr.consumptions;
        if (typeof raw === 'string') {
          raw = JSON.parse(raw);
        }
        if (!Array.isArray(raw)) raw = [];
        consumptions = raw.map((c: any) => ({
          product: productMap.get(c.productId) || null,
          quantity: c.consumed,
        }));
      } catch {
        consumptions = [];
      }
      return {
        type: 'outcome' as const,
        date: sr.createdAt,
        user,
        products: consumptions,
      };
    });

    // Объединяем и сортируем по дате (новые сверху)
    const all = [...incomes, ...outcomes].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return {
      periodStart,
      periodEnd,
      data: all,
    };
  }
}
