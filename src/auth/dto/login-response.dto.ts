import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from './auth-user.dto';

export class LoginResponseDto {
  @ApiProperty({ description: 'Short-lived JWT (15 min by default)' })
  access_token!: string;

  @ApiProperty({ description: 'Long-lived JWT for /auth/refresh (7 days by default)' })
  refresh_token!: string;

  @ApiProperty({ example: 900, description: 'Access-token lifetime in seconds' })
  token_expires_in!: number;

  @ApiProperty({ type: () => AuthUserDto })
  user!: AuthUserDto;
}
