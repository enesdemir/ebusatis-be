import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User } from '../../modules/users/entities/user.entity';

/**
 * Guard that restricts access to Super Admin (platform-level) users only.
 * Must be used after JwtAuthGuard to ensure req.user is populated.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;
    if (!user || !user.isSuperAdmin) {
      throw new ForbiddenException('Platform admin access required');
    }
    return true;
  }
}
