import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allow = this.reflector.getAllAndOverride<boolean>('allow', [
      context.getHandler(),
      context.getClass(),
    ]);

    // const guards = this.reflector.getAllAndOverride<string[]>('guards', [
    //   context.getHandler(),
    //   context.getClass(),
    // ]);

    if (allow) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.authUser;

    if (!user) {
      throw new UnauthorizedException();
    }

    // if (!guards?.includes(AuthGuardType.TWO_FACTOR) && twoFactorAuthRequired) {
    //   throw new UnauthorizedException();
    // }

    if (request.user)
      // if (user.organization?.status === OrganizationStatus.DEACTIVATED) {
      //   throw new UnauthorizedException(
      //     'Organization account has been deactivated. Please contact support',
      //   );
      // }

      // if (user.status === UserStatus.DEACTIVATED) {
      //   throw new UnauthorizedException(
      //     'This account is deactivated. Please contact support',
      //   );
      // }

      //   const types = this.reflector.getAllAndMerge<string[]>('types', [
      //     context.getHandler(),
      //     context.getClass(),
      //   ]);
      // if (
      //   !types?.length ||
      //   user.type === UserType.SUPER_ADMIN ||
      //   types.includes(user.type)
      // ) {
      //   return true;
      // }

      throw new ForbiddenException();
  }
}
