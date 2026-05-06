import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { StoreMembersController } from './store-members.controller';
import { StoreMembersService } from './store-members.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { UserSellerAssignmentEntity } from '@/user-seller-assignments/persistence/entities/user-seller-assignment.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { MailModule } from '@/mail/mail.module';
import { PasswordResetTokensModule } from '@/password-reset-tokens/password-reset-tokens.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserGroupEntity,
      UserAssignmentEntity,
      UserSellerAssignmentEntity,
      SellerEntity,
    ]),
    JwtModule.register({}),
    MailModule,
    PasswordResetTokensModule,
  ],
  controllers: [StoreMembersController],
  providers: [StoreMembersService],
  exports: [StoreMembersService],
})
export class StoreMembersModule {}
