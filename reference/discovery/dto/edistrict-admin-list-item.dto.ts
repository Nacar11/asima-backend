import { ApiProperty } from '@nestjs/swagger';

export class EdistrictAdminListItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'anjo-world' })
  key: string;

  @ApiProperty({ example: 'Anjo World' })
  name: string;

  @ApiProperty({ example: 'Browse services on', nullable: true })
  subtitle: string | null;

  @ApiProperty({ example: 'Anjo World Hub', nullable: true })
  store_name: string | null;

  @ApiProperty({
    example: 'https://cdn.example.com/banner.webp',
    nullable: true,
  })
  image_url: string | null;

  @ApiProperty({
    example: 'https://cdn.example.com/bg-banner.webp',
    nullable: true,
  })
  background_image_url: string | null;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 1 })
  display_order: number;

  @ApiProperty({ example: false })
  is_members_only: boolean;
}
