import { User } from '@/users/domain/user';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserAssignmentsService } from './user-assignments.service';
import { CreateUserAssignmentDto } from '@/user-assignments/dto/create-user-assignment.dto';
import { CreateUserAssignmentsDto } from '@/user-assignments/dto/create-user-assignments.dto';
import { UpdateUserAssignmentDto } from '@/user-assignments/dto/update-user-assignment.dto';
import { FindAllUserAssignmentsDto } from '@/user-assignments/dto/find-all-user-assignments.dto';
import { UserAssignment } from '@/user-assignments/domain/user-assignment';
import {
  PaginatedResponseDto,
  PaginatedResponse,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { IPaginatedResult } from '@/utils/types/paginated-result';

@ApiTags('UserAssignments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'user-assignments',
  version: '1',
})
export class UserAssignmentsController {
  constructor(
    private readonly userAssignmentsService: UserAssignmentsService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: UserAssignment,
  })
  create(
    @Body() createUserAssignmentDto: CreateUserAssignmentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.userAssignmentsService.create(
      createUserAssignmentDto,
      currentUser,
    );
  }

  @Post('bulk')
  @ApiCreatedResponse({
    type: UserAssignment,
  })
  createBulk(
    @Body() createUserAssignmentsDto: CreateUserAssignmentsDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.userAssignmentsService.createBulk(
      createUserAssignmentsDto,
      currentUser,
    );
  }

  @Get()
  @ApiOkResponse({
    type: PaginatedResponse(UserAssignment),
  })
  async findAllWithPagination(
    @Query() query: FindAllUserAssignmentsDto,
  ): Promise<PaginatedResponseDto<UserAssignment>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 50;
    if (limit > 50) limit = 50;

    const results: IPaginatedResult<UserAssignment> =
      await this.userAssignmentsService.findAllWithPagination({
        paginationOptions: { page, limit },
      });

    return paginate(results, { page, limit });
  }

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: UserAssignment,
    isArray: true,
  })
  findAll() {
    return this.userAssignmentsService.findAll();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: UserAssignment,
  })
  findById(@Param('id') id: number) {
    return this.userAssignmentsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: UserAssignment,
  })
  update(
    @Param('id') id: number,
    @Body() updateUserAssignmentDto: UpdateUserAssignmentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.userAssignmentsService.update(
      id,
      updateUserAssignmentDto,
      currentUser,
    );
  }

  // @Patch(':id/bulk')
  // @ApiParam({
  //   name: 'id',
  //   type: Number,
  //   required: true,
  // })
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   type: Array<UserAssignment>,
  // })
  // bulkUpdate(
  //   @Param('id') id: number,
  //   @Body() updateUserAssignmentsDto: UpdateUserAssignmentsDto,
  //   @CurrentUser() currentUser: User,
  // ) {
  //   return this.userAssignmentsService.bulkUpdate(
  //     id,
  //     updateUserAssignmentsDto,
  //     currentUser,
  //   );
  // }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.userAssignmentsService.remove(id, currentUser);
  }
}
