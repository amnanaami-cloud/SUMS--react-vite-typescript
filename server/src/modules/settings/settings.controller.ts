import { Body, Controller, Get, Param, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { UpdateAcademicPolicyDto, UpdateSettingDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}
  @Permissions('settings.read') @Get('settings') async list() {
    return { data: await this.settings.list() };
  }
  @Permissions('policies.read') @Get('academic-policies') async policies() {
    return { data: await this.settings.policies() };
  }
  @Permissions('settings.manage') @Put('settings/:key') async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @Req() request: Request,
  ) {
    return { data: await this.settings.update(user, key, dto, request.requestId) };
  }
  @Permissions('policies.manage') @Put('academic-policies/:key') async updatePolicy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('key') key: string,
    @Body() dto: UpdateAcademicPolicyDto,
    @Req() request: Request,
  ) {
    return { data: await this.settings.updatePolicy(user, key, dto, request.requestId) };
  }
}
