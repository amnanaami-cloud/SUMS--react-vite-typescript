import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AttendanceService } from './attendance.service';
import {
  BulkAttendanceDto,
  CreateAttendanceSessionDto,
  DecideAttendanceAdjustmentDto,
  RequestAttendanceAdjustmentDto,
} from './dto/attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}
  @Permissions('attendance.manage.assigned') @Get('sections') async sections(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.attendance.sections(user) };
  }
  @Permissions('attendance.manage.assigned') @Get('sections/:id/roster') async roster(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return { data: await this.attendance.roster(user, id) };
  }
  @Permissions('attendance.manage.assigned') @Post('sessions') async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAttendanceSessionDto,
    @Req() request: Request,
  ) {
    return { data: await this.attendance.createSession(user, dto, request.requestId) };
  }
  @Permissions('attendance.manage.assigned') @Post('sessions/:id/records') async save(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: BulkAttendanceDto,
    @Req() request: Request,
  ) {
    return { data: await this.attendance.save(user, id, dto, request.requestId) };
  }
  @Permissions('attendance.manage.assigned') @Post('adjustments') async adjustment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestAttendanceAdjustmentDto,
    @Req() request: Request,
  ) {
    return { data: await this.attendance.requestAdjustment(user, dto, request.requestId) };
  }
  @Permissions('attendance.approve.department') @Patch('adjustments/:id/decision') async decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: DecideAttendanceAdjustmentDto,
    @Req() request: Request,
  ) {
    return { data: await this.attendance.decideAdjustment(user, id, dto, request.requestId) };
  }
  @Permissions('attendance.read') @Get('summary') async summary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('studentId') studentId?: string,
  ) {
    return { data: await this.attendance.studentSummary(user, studentId) };
  }
}
