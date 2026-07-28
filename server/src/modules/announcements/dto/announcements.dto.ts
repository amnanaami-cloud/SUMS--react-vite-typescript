import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AudienceType, NotificationSeverity, RoleKey } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty() @IsString() @MaxLength(200) titleEn!: string;
  @ApiProperty() @IsString() @MaxLength(200) titleAr!: string;
  @ApiProperty() @IsString() @MaxLength(5000) bodyEn!: string;
  @ApiProperty() @IsString() @MaxLength(5000) bodyAr!: string;
  @ApiProperty({ enum: NotificationSeverity }) @IsEnum(NotificationSeverity) severity!: NotificationSeverity;
  @ApiProperty({ enum: AudienceType }) @IsEnum(AudienceType) audienceType!: AudienceType;
  @ApiPropertyOptional({ enum: RoleKey }) @IsOptional() @IsEnum(RoleKey) roleKey?: RoleKey;
  @ApiPropertyOptional() @IsOptional() @IsUUID() targetId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sectionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
}
