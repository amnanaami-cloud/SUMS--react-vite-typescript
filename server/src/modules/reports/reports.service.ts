import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, ReportFormat, RoleKey } from '@prisma/client';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuditService } from '../audit/audit.service';

export type ReportKey =
  | 'enrollment'
  | 'academic-standing'
  | 'registration-summary'
  | 'holds'
  | 'graduation-readiness'
  | 'advisee-progress';

export interface ReportData {
  title: string;
  columns: string[];
  rows: Array<Record<string, string | number | null>>;
}

@Injectable()
export class ReportsService {
  readonly catalog = [
    { key: 'enrollment', titleEn: 'Enrollment Report', titleAr: 'تقرير التسجيل' },
    { key: 'academic-standing', titleEn: 'Academic Standing', titleAr: 'الوضع الأكاديمي' },
    { key: 'registration-summary', titleEn: 'Registration Summary', titleAr: 'ملخص التسجيل' },
    { key: 'holds', titleEn: 'Holds Report', titleAr: 'تقرير القيود' },
    { key: 'graduation-readiness', titleEn: 'Graduation Readiness', titleAr: 'جاهزية التخرج' },
    { key: 'advisee-progress', titleEn: 'Advisee Progress', titleAr: 'تقدم الطلبة' },
  ] as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async generate(user: AuthenticatedUser, key: string): Promise<ReportData> {
    if (!this.catalog.some((item) => item.key === key)) throw new BadRequestException('UNKNOWN_REPORT');
    const studentWhere: Prisma.StudentProfileWhereInput = {};
    if (user.activeRole === RoleKey.student) studentWhere.id = user.studentProfileId ?? '__none__';
    if (user.activeRole === RoleKey.advisor)
      studentWhere.advisorAssignments = { some: { advisorId: user.employeeProfileId ?? '__none__', active: true } };
    if (user.activeRole === RoleKey.depthead && user.scopeType === 'DEPARTMENT' && user.scopeId)
      studentWhere.program = { departmentId: user.scopeId };
    if (user.activeRole === RoleKey.coordinator && user.scopeType === 'PROGRAM' && user.scopeId)
      studentWhere.programId = user.scopeId;
    if (user.activeRole === RoleKey.dean && user.scopeType === 'FACULTY' && user.scopeId)
      studentWhere.program = { department: { facultyId: user.scopeId } };
    if (key === 'enrollment') {
      const rows = await this.prisma.enrollment.findMany({
        where: { student: studentWhere },
        include: { student: true, section: { include: { course: true, term: true } } },
        orderBy: { registeredAt: 'desc' },
        take: 5000,
      });
      return {
        title: 'Enrollment Report',
        columns: ['universityId', 'courseCode', 'term', 'status', 'registeredAt'],
        rows: rows.map((row) => ({
          universityId: row.student.universityId,
          courseCode: row.section.course.code,
          term: row.section.term.code,
          status: row.status,
          registeredAt: row.registeredAt.toISOString(),
        })),
      };
    }
    if (key === 'academic-standing' || key === 'advisee-progress' || key === 'graduation-readiness') {
      const rows = await this.prisma.studentProfile.findMany({
        where: studentWhere,
        include: { program: true },
        orderBy: { universityId: 'asc' },
        take: 5000,
      });
      return {
        title:
          key === 'academic-standing'
            ? 'Academic Standing'
            : key === 'advisee-progress'
              ? 'Advisee Progress'
              : 'Graduation Readiness',
        columns: ['universityId', 'program', 'earnedCredits', 'requiredCredits', 'cumulativeGpa', 'standing'],
        rows: rows.map((row) => ({
          universityId: row.universityId,
          program: row.program.code,
          earnedCredits: row.earnedCredits,
          requiredCredits: row.program.requiredCredits,
          cumulativeGpa: row.cumulativeGpa?.toFixed(2) ?? null,
          standing: row.standing,
        })),
      };
    }
    if (key === 'holds') {
      const rows = await this.prisma.registrationHold.findMany({
        where: { student: studentWhere, active: true },
        include: { student: true },
        orderBy: { startsAt: 'desc' },
        take: 5000,
      });
      return {
        title: 'Holds Report',
        columns: ['universityId', 'type', 'reason', 'startsAt', 'endsAt'],
        rows: rows.map((row) => ({
          universityId: row.student.universityId,
          type: row.type,
          reason: row.reason,
          startsAt: row.startsAt.toISOString(),
          endsAt: row.endsAt?.toISOString() ?? null,
        })),
      };
    }
    const rows = await this.prisma.registrationRequest.groupBy({
      by: ['status'],
      where: { student: studentWhere },
      _count: true,
      orderBy: { status: 'asc' },
    });
    return {
      title: 'Registration Summary',
      columns: ['status', 'count'],
      rows: rows.map((row) => ({ status: row.status, count: row._count })),
    };
  }

  async export(user: AuthenticatedUser, key: string, format: ReportFormat, requestId?: string) {
    const report = await this.generate(user, key);
    const scope = {
      activeRole: user.activeRole,
      scopeType: user.scopeType,
      scopeId: user.scopeId,
      departmentId: user.departmentId,
      programId: user.programId,
      ownStudentId: user.activeRole === RoleKey.student ? user.studentProfileId : null,
    };
    const record = await this.prisma.reportExport.create({
      data: {
        requestedBy: user.id,
        reportKey: key,
        format,
        filters: {},
        scope,
        rowCount: report.rows.length,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      actorRole: user.activeRole,
      action: 'REPORT_EXPORTED',
      entityType: 'ReportExport',
      entityId: record.id,
      requestId,
      metadata: { reportKey: key, format, rowCount: report.rows.length },
    });
    if (format === ReportFormat.PDF)
      return { buffer: await this.pdf(report, user), contentType: 'application/pdf', extension: 'pdf' };
    if (format === ReportFormat.XLSX)
      return {
        buffer: await this.xlsx(report),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
      };
    return { buffer: Buffer.from(this.csv(report), 'utf8'), contentType: 'text/csv; charset=utf-8', extension: 'csv' };
  }

  private csv(report: ReportData) {
    const quote = (value: string | number | null) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    return `\uFEFF${report.columns.map(quote).join(',')}\n${report.rows.map((row) => report.columns.map((column) => quote(row[column] ?? null)).join(',')).join('\n')}`;
  }

  private async xlsx(report: ReportData) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SUMS';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet(report.title.slice(0, 31));
    sheet.columns = report.columns.map((column) => ({
      header: column,
      key: column,
      width: Math.max(14, column.length + 2),
    }));
    sheet.addRows(report.rows);
    sheet.getRow(1).font = { bold: true };
    sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + Math.min(26, report.columns.length))}1` };
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private pdf(report: ReportData, user: AuthenticatedUser) {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: report.title, Author: 'SUMS' } });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(18).text('Smart University Management System', { align: 'center' });
      doc.fontSize(14).text(report.title, { align: 'center' });
      doc
        .moveDown()
        .fontSize(9)
        .text(`Issued: ${new Date().toISOString()} | Issuer: ${user.id} | Official status: Unofficial`);
      doc.moveDown();
      for (const row of report.rows.slice(0, 500)) {
        doc.fontSize(8).text(report.columns.map((column) => `${column}: ${String(row[column] ?? '')}`).join(' | '));
        if (doc.y > 760) doc.addPage();
      }
      doc.end();
    });
  }
}
