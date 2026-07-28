import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RoleKey } from '@prisma/client';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]))
      return true;
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user) return false;
    const roles =
      this.reflector.getAllAndOverride<RoleKey[]>(ROLES_KEY, [context.getHandler(), context.getClass()]) ?? [];
    const permissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]) ?? [];
    if (roles.length > 0 && !roles.includes(user.activeRole)) throw new ForbiddenException('ROLE_NOT_ALLOWED');
    if (permissions.length > 0 && !permissions.every((permission) => user.permissions.includes(permission))) {
      throw new ForbiddenException('PERMISSION_DENIED');
    }
    return true;
  }
}
