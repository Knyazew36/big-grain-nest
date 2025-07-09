import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UserService } from './user.service';
import { TelegramAuthGuard } from 'src/auth/guards/telegram-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Get()
  @Roles('ADMIN', 'OWNER', 'IT')
  findAll(@Query() query: GetUsersDto) {
    return this.usersService.findAll(query);
  }
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Get('employees')
  @Roles('ADMIN', 'OWNER', 'OPERATOR')
  getEmployees() {
    return this.usersService.getEmployees();
  }

  @Get('role/:role')
  @Roles('ADMIN', 'OWNER', 'IT')
  getUsersByRole(@Param('role') role: Role) {
    return this.usersService.getUsersByRole(role);
  }

  @Get(':telegramId/role')
  getUserRole(@Param('telegramId') telegramId: string) {
    return this.usersService.getUserRole(telegramId);
  }
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Get(':id')
  @Roles('ADMIN', 'OWNER', 'IT')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Post('/update/:id')
  @Roles('ADMIN', 'OWNER', 'IT')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Post('/remove/:id')
  @Roles('ADMIN', 'OWNER', 'IT')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Post('/hard-remove/:id')
  @Roles('OWNER', 'IT')
  hardRemove(@Param('id') id: string) {
    return this.usersService.hardRemove(+id);
  }
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Post('/restore/:id')
  @Roles('ADMIN', 'OWNER', 'IT')
  restore(@Param('id') id: string) {
    return this.usersService.restore(+id);
  }
  @UseGuards(TelegramAuthGuard, RolesGuard)
  @Get('deleted/list')
  @Roles('ADMIN', 'OWNER', 'IT')
  getDeletedUsers() {
    return this.usersService.getDeletedUsers();
  }
}
