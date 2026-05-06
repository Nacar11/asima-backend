import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthFirebaseLoginDto {
  @ApiProperty({
    description: 'Firebase ID token obtained from Firebase Auth SDK on mobile',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsNotEmpty()
  @IsString()
  idToken: string;
}
