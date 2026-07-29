import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/announcements.dto';

@ApiTags('announcements')
@ApiBearerAuth()
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}
  @Permissions('notifications.read')
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.announcements.list(user) };
  }
  @Permissions('announcements.publish') @Post() async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAnnouncementDto,
    @Req() request: Request,
  ) {
    return { data: await this.announcements.create(user, dto, request.requestId) };
  }
}
