import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';

// Verifies the Clerk session JWT from `Authorization: Bearer <token>`.
// On success, sets `request.clerkUserId` to the subject claim — controllers
// read that to scope queries by user. Lazy user-record creation happens in
// the UsersService on first authed request, not here.
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      this.logger.error(
        'CLERK_SECRET_KEY env var is not set. Authenticated endpoints are inaccessible.',
      );
      throw new ServiceUnavailableException('Auth is not configured.');
    }

    const request = context.switchToHttp().getRequest();
    const auth: string | undefined = request.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header.');
    }
    const token = auth.slice('Bearer '.length).trim();

    try {
      const payload = await verifyToken(token, { secretKey });
      if (!payload.sub) {
        throw new UnauthorizedException('Token has no subject claim.');
      }
      request.clerkUserId = payload.sub;
      return true;
    } catch (err) {
      this.logger.warn(
        `Clerk token verification failed: ${err instanceof Error ? err.message : err}`,
      );
      throw new UnauthorizedException('Invalid session token.');
    }
  }
}
