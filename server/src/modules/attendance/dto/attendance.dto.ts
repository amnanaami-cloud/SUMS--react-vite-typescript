import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalOutcome, AttendanceStatus } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttendanceSessionDto {
  @ApiProperty() @IsUUID() sectionId!: string;
  @ApiProperty() @IsDateString() sessionDate!: string;
  @ApiProperty({ example: '09:00:00' }) @Matches(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/) startsAt!: string;
}

export class AttendanceRecordDto {
  @ApiProperty() @IsUUID() enrollmentId!: string;
  @ApiProperty({ enum: AttendanceStatus }) @IsEnum(AttendanceStatus) status!: AttendanceStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) evidenceRef?: string;
}

export class BulkAttendanceDto {
  @ApiProperty({ type: [AttendanceRecordDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records!: AttendanceRecordDto[];
}

export class RequestAttendanceAdjustmentDto {
  @ApiProperty() @IsUUID() recordId!: string;
  @ApiProperty({ enum: AttendanceStatus }) @IsEnum(AttendanceStatus) toStatus!: AttendanceStatus;
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(500) reason!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) evidenceRef?: string;
}

export class DecideAttendanceAdjustmentDto {
  @ApiProperty({ enum: [ApprovalOutcome.APPROVED, ApprovalOutcome.REJECTED] })
  @IsEnum(ApprovalOutcome)
  outcome!: ApprovalOutcome;
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}
