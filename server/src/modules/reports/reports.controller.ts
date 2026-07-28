import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportFormat } from '@prisma/client';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Permissions('reports.read') @Get() catalog() {
    return { data: this.reports.catalog };
  }
  @Permissions('reports.read') @Get(':key') async view(
    @CurrentUser() user: AuthenticatedUser,
    @Param('key') key: string,
  ) {
    return { data: await this.reports.generate(user, key) };
  }
  @Permissions('reports.export')
  @Get(':key/export')
  async export(
    @CurrentUser() user: AuthenticatedUser,
    @Param('key') key: string,
    @Query('format') rawFormat: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const format = (rawFormat || 'PDF').toUpperCase() as ReportFormat;
    const allowedFormats: ReportFormat[] = [ReportFormat.PDF, ReportFormat.XLSX, ReportFormat.CSV];
    if (!allowedFormats.includes(format)) return response.status(400).json({ code: 'UNSUPPORTED_REPORT_FORMAT' });
    const exported = await this.reports.export(user, key, format, request.requestId);
    response.setHeader('Content-Type', exported.contentType);
    response.setHeader('Content-Disposition', `attachment; filename="sums-${key}-${Date.now()}.${exported.extension}"`);
    response.send(exported.buffer);
  }
}
