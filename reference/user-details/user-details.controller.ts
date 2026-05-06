import {
  Controller,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserDetail } from '@/user-details/domain/user-detail';
import { UpdateUserDetailDto } from '@/user-details/dto/update-user-detail.dto';
import { UserDetailsService } from '@/user-details/user-details.service';
import { User } from '@/users/domain/user';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';

@ApiTags('User Details')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('user-details')
export class UserDetailsController {
  constructor(private readonly userDetailsService: UserDetailsService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Update user detail by ID' })
  @ApiResponse({
    status: 200,
    description: 'User detail successfully updated',
    type: UserDetail,
  })
  @ApiResponse({
    status: 404,
    description: 'User detail not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - you can only edit your own user details',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - username is already taken',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateUserDetailDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserDetail> {
    return await this.userDetailsService.update(id, input, currentUser);
  }
}
