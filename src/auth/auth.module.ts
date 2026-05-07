import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '@/users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

/**
 * Wires both Passport strategies (access + refresh), the AuthService, the
 * AuthController, and re-exports the guards so other modules can import
 * them without re-importing PassportModule themselves.
 */
@Module({
  imports: [
    UsersModule,
    PassportModule,
    // Per-call options (secret + expiresIn) are passed to signAsync in
    // AuthService, so this registration is intentionally bare — no global
    // secret, no global expiresIn.
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, JwtAuthGuard, JwtRefreshGuard],
  exports: [JwtAuthGuard, JwtRefreshGuard],
})
export class AuthModule {}
