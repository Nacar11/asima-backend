import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/users/domain/user';

export class AuthMeResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  tokenExpires: number;

  @ApiProperty({
    type: () => User,
  })
  user: User;

  @ApiProperty()
  user_assignments?: string[];

  @ApiProperty()
  user_permissions?: Record<string, any>;

  @ApiProperty({ nullable: true })
  cart_id?: number | null;
}
