// src/module/guards/optional-jwt-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard tùy chọn JWT:
 * Nếu request có header Authorization hợp lệ thì gán user vào request.
 * Nếu không có header hoặc token không hợp lệ, không throw UnauthorizedException mà coi như guest (user = null).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = any>(
    _err: any,
    user: any,
    _info: any,
    _context: ExecutionContext,
    _status?: any,
  ): TUser {
    return (user || null) as TUser;
  }
}
