import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MemberSchedulesService } from '@/member-schedules/member-schedules.service';
import { CreateMemberScheduleDto } from '@/member-schedules/dto/create-member-schedule.dto';
import { UpdateMemberScheduleDto } from '@/member-schedules/dto/update-member-schedule.dto';
import { QueryMemberScheduleDto } from '@/member-schedules/dto/query-member-schedule.dto';
import { MemberSchedule } from '@/member-schedules/domain/member-schedule';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Member Schedules')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'member-schedules',
  version: '1',
})
export class MemberSchedulesController {
  constructor(private readonly service: MemberSchedulesService) {}

  @Post()
  @ApiCreatedResponse({ type: MemberSchedule })
  create(
    @Body() dto: CreateMemberScheduleDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiOkResponse({ type: MemberSchedule, isArray: true })
  async findAll(@Query() query: QueryMemberScheduleDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: MemberSchedule })
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: MemberSchedule })
  update(
    @Param('id') id: number,
    @Body() dto: UpdateMemberScheduleDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: number, @CurrentUser() currentUser: User) {
    return this.service.remove(id, currentUser);
  }
}
