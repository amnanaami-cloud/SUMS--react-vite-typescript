import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AcademicService } from './academic.service';
import { CreateCourseDto, CreateSectionDto, CreateTermDto } from './dto/academic.dto';

@ApiTags('academic')
@ApiBearerAuth()
@Controller()
export class AcademicController {
  constructor(private readonly academic: AcademicService) {}

  @Permissions('dashboard.read')
  @Get('dashboard')
  async dashboard(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.academic.dashboard(user) };
  }
  @Permissions('courses.read')
  @Get('courses')
  async courses(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string,
    @Query('termId') termId?: string,
  ) {
    return { data: await this.academic.courses(user, search, termId) };
  }
  @Permissions('courses.read')
  @Get('courses/mine')
  async mine(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.academic.myCourses(user) };
  }
  @Permissions('courses.manage')
  @Post('courses')
  async createCourse(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCourseDto, @Req() request: Request) {
    return { data: await this.academic.createCourse(user, dto, request.requestId) };
  }
  @Permissions('terms.read')
  @Get('terms')
  async terms() {
    return { data: await this.academic.terms() };
  }
  @Permissions('terms.manage')
  @Post('terms')
  async createTerm(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTermDto, @Req() request: Request) {
    return { data: await this.academic.createTerm(user, dto, request.requestId) };
  }
  @Permissions('sections.manage')
  @Post('sections')
  async createSection(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSectionDto, @Req() request: Request) {
    return { data: await this.academic.createSection(user, dto, request.requestId) };
  }
  @Permissions('courses.read')
  @Get('schedule')
  async schedule(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.academic.schedule(user) };
  }
  @Permissions('curriculum.read')
  @Get('curriculum')
  async curriculum(@CurrentUser() user: AuthenticatedUser, @Query('programId') programId?: string) {
    return { data: await this.academic.curriculum(user, programId) };
  }
  @Permissions('progress.read')
  @Get('degree-progress')
  async progress(@CurrentUser() user: AuthenticatedUser, @Query('studentId') studentId?: string) {
    return { data: await this.academic.degreeProgress(user, studentId) };
  }
  @Permissions('staff.read')
  @Get('staff')
  async staff(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.academic.staff(user) };
  }
  @Permissions('reports.read')
  @Get('analytics')
  async analytics(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.academic.analytics(user) };
  }
}
