import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { parseWhere } from '../../common/utils/query.util';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() query: ListQueryDto) {
    return this.users.list({
      sort: query.sort,
      limit: query.limit,
      offset: query.offset,
      where: parseWhere(query.where),
      includeInactive: query.include_inactive,
    });
  }

  @Post('invite')
  invite(@CurrentUser() inviter: AuthenticatedUser, @Body() dto: InviteUserDto) {
    return this.users.invite(inviter, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
