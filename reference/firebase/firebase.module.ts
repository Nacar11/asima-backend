import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

/**
 * Firebase Module.
 *
 * Global module that provides Firebase Admin SDK services
 * for push notifications via FCM.
 *
 * @version 1
 * @since 1.0.0
 */
@Global()
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
