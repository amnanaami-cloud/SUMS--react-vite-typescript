import { ApiProperty } from '@nestjs/swagger';
import { ApprovalOutcome } from '@prisma/client';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SubmitRegistrationDto {
  @ApiProperty() @IsUUID() termId!: string;
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  sectionIds!: string[];
}

export class RegistrationDecisionDto {
  @ApiProperty({ enum: ApprovalOutcome })
  @IsEnum(ApprovalOutcome)
  outcome!: ApprovalOutcome;
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(1000) reason!: string;
}

export class DropEnrollmentDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}
