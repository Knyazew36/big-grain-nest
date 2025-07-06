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
@UseGuards(TelegramAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get()
  @Roles('ADMIN', 'OWNER', 'IT')
  findAll(@Query() query: GetUsersDto) {
    return this.usersService.findAll(query);
  }

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

  @Get(':id')
  @Roles('ADMIN', 'OWNER', 'IT')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Post('/update/:id')
  @Roles('ADMIN', 'OWNER', 'IT')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Post('/remove/:id')
  @Roles('ADMIN', 'OWNER', 'IT')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
