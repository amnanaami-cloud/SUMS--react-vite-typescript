import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty() @IsObject() value!: Record<string, unknown>;
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class UpdateAcademicPolicyDto extends UpdateSettingDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() termId?: string;
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(100) sourceRef!: string;
  @ApiProperty() @IsDateString() effectiveFrom!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveTo?: string;
}
