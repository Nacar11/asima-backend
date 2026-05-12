import { ApiProperty } from '@nestjs/swagger';

export class RefreshResponseDto {
  @ApiProperty({ description: 'New access token (replaces the previous one)' })
  access_token!: string;

  @ApiProperty({ description: 'New refresh token (rotation — replace your stored value)' })
  refresh_token!: string;

  @ApiProperty({ example: 900 })
  token_expires_in!: number;
}
