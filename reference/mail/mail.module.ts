import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailerModule } from '@/mailer/mailer.module';
import { MailTestController } from './mail-test.controller';

@Module({
  imports: [ConfigModule, MailerModule],
  controllers: [MailTestController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
