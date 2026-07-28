import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { BulkGradeEntryDto, CreateAssessmentDto, GradeAppealDto, ReturnGradeSubmissionDto } from './dto/grades.dto';
import { GradesService } from './grades.service';

@ApiTags('grades')
@ApiBearerAuth()
@Controller('grades')
export class GradesController {
  constructor(private readonly grades: GradesService) {}
  @Permissions('grades.publish.department') @Get('submissions/pending') async pending(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return { data: await this.grades.pendingDepartment(user) };
  }
  @Permissions('grades.manage.assigned') @Get('sections/:id') async section(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return { data: await this.grades.section(user, id) };
  }
  @Permissions('grades.manage.assigned') @Post('assessments') async assessment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAssessmentDto,
    @Req() request: Request,
  ) {
    return { data: await this.grades.createAssessment(user, dto, request.requestId) };
  }
  @Permissions('grades.manage.assigned') @Post('assessments/:id/scores') async scores(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: BulkGradeEntryDto,
    @Req() request: Request,
  ) {
    return { data: await this.grades.saveAssessmentGrades(user, id, dto, request.requestId) };
  }
  @Permissions('grades.manage.assigned') @Post('sections/:id/submit') async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: Request,
  ) {
    return { data: await this.grades.submit(user, id, request.requestId) };
  }
  @Permissions('grades.publish.department') @Post('sections/:id/publish') async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: Request,
  ) {
    return { data: await this.grades.publish(user, id, request.requestId) };
  }
  @Permissions('grades.publish.department') @Post('sections/:id/return') async returnSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ReturnGradeSubmissionDto,
    @Req() request: Request,
  ) {
    return { data: await this.grades.returnSubmission(user, id, dto.reason, request.requestId) };
  }
  @Permissions('transcript.read') @Get('transcript') async transcript(
    @CurrentUser() user: AuthenticatedUser,
    @Query('studentId') studentId?: string,
  ) {
    return { data: await this.grades.transcript(user, studentId) };
  }
  @Permissions('grades.appeal.own') @Post('appeals') async appeal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GradeAppealDto,
    @Req() request: Request,
  ) {
    return { data: await this.grades.appeal(user, dto, request.requestId) };
  }
}
