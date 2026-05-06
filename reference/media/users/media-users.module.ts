import { Module } from '@nestjs/common';
import { MediaUsersService } from './services/media-users.service';
import { MediaSharedModule } from '@/media/shared/media-shared.module';

@Module({
  imports: [MediaSharedModule],
  providers: [MediaUsersService],
  exports: [MediaUsersService],
})
export class MediaUsersModule {}
