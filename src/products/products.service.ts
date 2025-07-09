import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'nestjs-prisma';
import { Product } from '@prisma/client';
import { BotService } from '../bot/bot.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly botService: BotService,
  ) {
    console.log('🟢 ProductsService создан', new Date().toISOString());
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async findAll(onlyActive = true): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: onlyActive ? { active: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }

  // @Cron(CronExpression.EVERY_HOUR)
  //FIXME: не забыть
  // @Cron(CronExpression.EVERY_MINUTE)
  async checkLowStockAndNotify() {
    console.log('🔍 checkLowStockAndNotify');
    // Prisma не поддерживает сравнение с другим полем напрямую, поэтому фильтруем вручную
    const allProducts = await this.prisma.product.findMany();
    const lowStock = allProducts.filter((p) => p.quantity < p.minThreshold);
    if (lowStock.length > 0) {
      // await this.botService.notifyLowStock(lowStock);
    }
  }
}
