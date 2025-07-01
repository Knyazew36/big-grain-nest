import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
@Injectable()
export class SharedService {
  constructor(private readonly prisma: PrismaService) {}
}
