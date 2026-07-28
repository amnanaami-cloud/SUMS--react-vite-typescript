import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentType } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssessmentDto {
  @ApiProperty() @IsUUID() sectionId!: string;
  @ApiProperty() @IsString() @MaxLength(200) nameEn!: string;
  @ApiProperty() @IsString() @MaxLength(200) nameAr!: string;
  @ApiProperty({ enum: AssessmentType }) @IsEnum(AssessmentType) type!: AssessmentType;
  @ApiProperty() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(100) weight!: number;
  @ApiProperty() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) maxScore!: number;
}

export class GradeEntryDto {
  @ApiProperty() @IsUUID() enrollmentId!: string;
  @ApiProperty() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) score!: number;
}

export class BulkGradeEntryDto {
  @ApiProperty({ type: [GradeEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => GradeEntryDto)
  grades!: GradeEntryDto[];
}

export class GradeAppealDto {
  @ApiProperty() @IsUUID() finalGradeId!: string;
  @ApiProperty() @IsString() @MaxLength(1500) reason!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) attachmentRef?: string;
}

export class ReturnGradeSubmissionDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
