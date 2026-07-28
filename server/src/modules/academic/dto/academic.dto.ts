import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseType, GradingModel, TermStatus, TermType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty() @IsString() @MaxLength(20) code!: string;
  @ApiProperty() @IsUUID() departmentId!: string;
  @ApiProperty() @IsString() @MaxLength(200) nameEn!: string;
  @ApiProperty() @IsString() @MaxLength(200) nameAr!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) descriptionEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) descriptionAr?: string;
  @ApiProperty() @IsInt() @Min(1) @Max(12) credits!: number;
  @ApiProperty() @IsInt() @Min(1) @Max(12) level!: number;
  @ApiProperty({ enum: CourseType }) @IsEnum(CourseType) type!: CourseType;
}

export class CreateTermDto {
  @ApiProperty() @IsUUID() academicYearId!: string;
  @ApiProperty() @Matches(/^\d{4}-(1|2|S)$/) @MaxLength(8) code!: string;
  @ApiProperty({ enum: TermType }) @IsEnum(TermType) type!: TermType;
  @ApiProperty() @IsString() @MaxLength(100) nameEn!: string;
  @ApiProperty() @IsString() @MaxLength(100) nameAr!: string;
  @ApiProperty({ enum: TermStatus }) @IsEnum(TermStatus) status!: TermStatus;
  @ApiProperty() @IsDateString() startsOn!: string;
  @ApiProperty() @IsDateString() endsOn!: string;
  @ApiProperty() @IsDateString() registrationStartsAt!: string;
  @ApiProperty() @IsDateString() registrationEndsAt!: string;
  @ApiProperty() @IsDateString() addDropEndsAt!: string;
  @ApiProperty() @IsDateString() withdrawalEndsAt!: string;
}

export class CreateSectionDto {
  @ApiProperty() @IsUUID() courseId!: string;
  @ApiProperty() @IsUUID() termId!: string;
  @ApiProperty() @IsString() @MaxLength(10) sectionNo!: string;
  @ApiProperty() @IsInt() @Min(1) @Max(1000) capacity!: number;
  @ApiProperty({ enum: GradingModel }) @IsEnum(GradingModel) gradingModel!: GradingModel;
}
