import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateReceiptDto } from './dto/create-receipt.dto';

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
}
