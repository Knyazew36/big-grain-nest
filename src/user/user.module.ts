import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from 'nestjs-prisma';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
