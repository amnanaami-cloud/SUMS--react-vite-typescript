import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleKey } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

export class LoginDto {
  @ApiProperty({ description: 'Email, student university ID, or employee ID' })
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  identifier!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ enum: RoleKey, description: 'Requested portal only; never grants the role' })
  @IsOptional()
  @IsEnum(RoleKey)
  requestedRole?: RoleKey;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  identifier!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  token!: string;

  @ApiProperty({ minLength: 8 })
  @Matches(passwordPattern, { message: 'PASSWORD_POLICY_FAILED' })
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty({ minLength: 8 })
  @Matches(passwordPattern, { message: 'PASSWORD_POLICY_FAILED' })
  newPassword!: string;
}

export class AdminResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}
