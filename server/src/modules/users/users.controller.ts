import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import {
  CreateStudentDto,
  CreateUserDto,
  ReplaceRolesDto,
  UpdateAccountStatusDto,
  UpdateProfileDto,
} from './dto/users.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Permissions('users.read')
  @Get('users')
  async list(@Query() page: PaginationDto, @Query('search') search?: string) {
    return { data: await this.users.list(page.page, page.pageSize, search) };
  }

  @Permissions('users.manage')
  @Post('users')
  async create(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateUserDto, @Req() request: Request) {
    return { data: await this.users.create(actor, dto, request.requestId) };
  }

  @Permissions('users.manage')
  @Patch('users/:id/status')
  async status(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateAccountStatusDto,
    @Req() request: Request,
  ) {
    return { data: await this.users.updateStatus(actor, id, dto, request.requestId) };
  }

  @Permissions('roles.manage')
  @Put('users/:id/roles')
  async roles(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ReplaceRolesDto,
    @Req() request: Request,
  ) {
    return { data: await this.users.replaceRoles(actor, id, dto, request.requestId) };
  }

  @Permissions('profile.update')
  @Patch('profile')
  async profile(@CurrentUser() actor: AuthenticatedUser, @Body() dto: UpdateProfileDto, @Req() request: Request) {
    return { data: await this.users.updateOwnProfile(actor, dto, request.requestId) };
  }

  @Permissions('students.read')
  @Get('students')
  async students(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() page: PaginationDto,
    @Query('search') search?: string,
  ) {
    return { data: await this.users.listStudents(actor, page.page, page.pageSize, search) };
  }

  @Permissions('students.manage')
  @Post('students')
  async createStudent(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateStudentDto, @Req() request: Request) {
    return { data: await this.users.createStudent(actor, dto, request.requestId) };
  }
}
