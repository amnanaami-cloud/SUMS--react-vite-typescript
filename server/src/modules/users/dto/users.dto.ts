import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, RoleKey } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[12]\d{9}$/)
  universityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^E\d{8}$/)
  employeeId?: string;

  @ApiProperty() @IsString() @MaxLength(100) firstNameEn!: string;
  @ApiProperty() @IsString() @MaxLength(100) lastNameEn!: string;
  @ApiProperty() @IsString() @MaxLength(100) firstNameAr!: string;
  @ApiProperty() @IsString() @MaxLength(100) lastNameAr!: string;

  @ApiProperty({ minLength: 8 })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/)
  initialPassword!: string;

  @ApiProperty({ enum: RoleKey, isArray: true })
  @IsArray()
  @IsEnum(RoleKey, { each: true })
  roles!: RoleKey[];
}

export class UpdateProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) addressEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) addressAr?: string;
  @ApiPropertyOptional({ enum: ['ar', 'en'] }) @IsOptional() @Matches(/^(ar|en)$/) preferredLanguage?: string;
}

export class UpdateAccountStatusDto {
  @ApiProperty({ enum: AccountStatus }) @IsEnum(AccountStatus) status!: AccountStatus;
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class ReplaceRolesDto {
  @ApiProperty({ enum: RoleKey, isArray: true })
  @IsArray()
  @IsEnum(RoleKey, { each: true })
  roles!: RoleKey[];
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(500) reason!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) scopeType?: string;
  @ApiPropertyOptional() @ValidateIf((o: ReplaceRolesDto) => Boolean(o.scopeType)) @IsUUID() scopeId?: string;
}

export class CreateStudentDto extends CreateUserDto {
  @ApiProperty() @IsUUID() programId!: string;
  @ApiProperty() @IsInt() @Min(1) currentLevel!: number;
  @ApiProperty() @IsDateString() admissionDate!: string;
}
