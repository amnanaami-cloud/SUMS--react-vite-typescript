import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { DropEnrollmentDto, RegistrationDecisionDto, SubmitRegistrationDto } from './dto/registrations.dto';
import { RegistrationsService } from './registrations.service';

@ApiTags('registrations')
@ApiBearerAuth()
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrations: RegistrationsService) {}
  @Permissions('registrations.own.read') @Get('mine') async mine(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.registrations.mine(user) };
  }
  @Permissions('registrations.review') @Get('pending') async pending(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.registrations.pending(user) };
  }
  @Permissions('registrations.own.submit') @Post() async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitRegistrationDto,
    @Req() request: Request,
  ) {
    return { data: await this.registrations.submit(user, dto, request.requestId) };
  }
  @Permissions('registrations.review') @Patch(':id/decision') async decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: RegistrationDecisionDto,
    @Req() request: Request,
  ) {
    return { data: await this.registrations.decide(user, id, dto, request.requestId) };
  }
  @Permissions('registrations.finalize') @Post(':id/finalize') async finalize(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: Request,
  ) {
    return { data: await this.registrations.finalize(user, id, request.requestId) };
  }
  @Permissions('registrations.own.submit') @Post('enrollments/:id/drop') async drop(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: DropEnrollmentDto,
    @Req() request: Request,
  ) {
    return { data: await this.registrations.drop(user, id, dto, request.requestId) };
  }
}
