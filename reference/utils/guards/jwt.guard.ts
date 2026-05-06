import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ClsService } from 'nestjs-cls';

/**
 * A custom authentication guard that extends the `AuthGuard('jwt')` from the `@nestjs/passport` package.
 * This guard is responsible for handling JWT-based authentication and setting the authenticated user
 * in the `ClsService` for later use within the application.
 *
 * Supports @Public() decorator to skip authentication for specific routes.
 *
 * @extends {AuthGuard('jwt')}
 * @implements {CanActivate}
 */
@Injectable()
export class JwtGuard extends AuthGuard('jwt') implements CanActivate {
  /**
   * Creates an instance of `JwtGuard`.
   * This constructor injects the `ClsService` to manage the current user in the context.
   *
   * @constructor
   * @param {ClsService} clsService - An instance of the `ClsService` used to set the authenticated user.
   * @param {Reflector} reflector - Used to access route metadata like @Public() decorator.
   */
  constructor(
    private readonly clsService: ClsService,
    private readonly reflector: Reflector,
  ) {
    super();
  }

  /**
   * Checks if the route is marked as public using @Public() decorator.
   * If public, allows access without authentication but still tries to extract user if token exists.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // For public routes, try to authenticate but don't throw if it fails
      return this.handlePublicRoute(context);
    }

    // For protected routes, require authentication
    return super.canActivate(context) as Promise<boolean>;
  }

  /**
   * Handles public routes by attempting to extract user if token exists,
   * but allowing access even if no token is provided.
   */
  private async handlePublicRoute(context: ExecutionContext): Promise<boolean> {
    try {
      // Try to authenticate, but don't fail if no token
      const result = await super.canActivate(context);
      return result as boolean;
    } catch {
      // Allow access even if authentication fails for public routes
      return true;
    }
  }

  /**
   * Handles the request by verifying the JWT and setting the authenticated user in the `ClsService`.
   * If authentication fails or the user is not found, it throws an `UnauthorizedException`.
   *
   * @param {any} err - The error, if any, that occurred during authentication.
   * @param {any} user - The authenticated user, if available.
   * @param {any} info - Additional information related to authentication, such as error messages.
   *
   * @returns {any} - The authenticated user object if successful.
   * @throws {UnauthorizedException} - If authentication fails or the user is not found.
   */
  handleRequest(err, user, info) {
    // If there's an error or no user, throw an UnauthorizedException
    if (err || !user) {
      throw new UnauthorizedException(info);
    }

    // Store the authenticated user in the ClsService
    this.clsService.set('currentUser', user);

    // Return the authenticated user
    return user;
  }
}
