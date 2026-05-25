import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

// Shared-secret guard for admin endpoints. Compares the x-admin-token header
// against ADMIN_TOKEN from env. Placeholder until real auth lands.
@Injectable()
export class AdminTokenGuard implements CanActivate {
  private readonly logger = new Logger(AdminTokenGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) {
      this.logger.error(
        'ADMIN_TOKEN env var is not set. Admin endpoints are inaccessible.',
      );
      throw new ServiceUnavailableException(
        'Admin endpoint is not configured.',
      );
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-admin-token'];
    if (token !== expected) {
      throw new UnauthorizedException('Invalid or missing admin token.');
    }
    return true;
  }
}
