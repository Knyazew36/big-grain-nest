import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'nestjs-prisma';
import { SharedService } from './shared.service';

@Global()
@Module({
  providers: [PrismaService, SharedService],
  imports: [ConfigModule.forRoot()],
  exports: [ConfigModule, PrismaService, SharedService],
})
export class SharedModule {}
