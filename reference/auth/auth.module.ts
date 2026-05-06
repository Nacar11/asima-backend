import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AnonymousStrategy } from './strategies/anonymous.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { FacebookMockService } from './strategies/facebook-mock.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleMockService } from './strategies/google-mock.strategy';
import { FirebaseAuthService } from './strategies/firebase-auth.service';
import { DevOnlyGuard } from '@/utils/guards/dev-only.guard';
import {
  GoogleOAuthGuard,
  FacebookOAuthGuard,
} from './guards/oauth-cancel.guard';
import { MailModule } from '@/mail/mail.module';
import { SessionModule } from '@/session/session.module';
import { UsersModule } from '@/users/users.module';
import { UserAssignmentsModule } from '../user-assignments/user-assignments.module';
import { SocialAccountsModule } from '@/social-accounts/social-accounts.module';
import { PasswordResetTokensModule } from '@/password-reset-tokens/password-reset-tokens.module';
import { UserDetailsModule } from '@/user-details/user-details.module';
import { LoggersModule } from '@/loggers/loggers.module';
import { SellersModule } from '@/sellers/sellers.module';
import { StorageModule } from '@/storage/storage.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSellerAssignmentEntity } from '@/user-seller-assignments/persistence/entities/user-seller-assignment.entity';
import { ShoppingCartPersistenceModule } from '@/shopping-carts/persistence/persistence.module';
import { ReferralCodesModule } from '@/referral-codes/referral-codes.module';

@Module({
  imports: [
    UsersModule,
    SessionModule,
    PassportModule,
    MailModule,
    UserAssignmentsModule,
    SocialAccountsModule,
    PasswordResetTokensModule,
    UserDetailsModule,
    LoggersModule,
    SellersModule,
    StorageModule.register(),
    ShoppingCartPersistenceModule,
    ReferralCodesModule,
    TypeOrmModule.forFeature([UserSellerAssignmentEntity]),
    JwtModule.register({}),
    StorageModule.register(),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    AnonymousStrategy,
    FacebookStrategy,
    FacebookMockService,
    GoogleStrategy,
    GoogleMockService,
    FirebaseAuthService,
    DevOnlyGuard,
    GoogleOAuthGuard,
    FacebookOAuthGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
