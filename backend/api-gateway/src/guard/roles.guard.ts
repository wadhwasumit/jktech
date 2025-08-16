// src/auth/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    // roles defined on method or controller
    const required = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    console.log('Required roles:', required);
    // no roles metadata => allow
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    console.log('User:',  req.user);
    const user = req.user as { role?: string; roles?: string[] } | undefined;
    
    if (!user) throw new ForbiddenException('Unauthenticated');    
    const userRoles = Array.isArray(user.roles)
      ? user.roles
      : user.role
      ? [user.role]
      : [];
    console.log('User roles array:', userRoles);
    const ok = required.some((r) => userRoles.includes(r));
    if (!ok) throw new ForbiddenException('Admin permissions required');

    return true;
  }
}
