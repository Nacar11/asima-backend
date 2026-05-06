import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FormSubmissionsService } from '@/form-submissions/form-submissions.service';
import { CreateFormSubmissionDto } from '@/form-submissions/dto/create-form-submission.dto';
import { QueryFormSubmissionDto } from '@/form-submissions/dto/query-form-submission.dto';
import { FormSubmission } from '@/form-submissions/domain/form-submission';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

@ApiTags('Form Submissions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'form-submissions',
  version: '1',
})
export class FormSubmissionsController {
  constructor(private readonly service: FormSubmissionsService) {}

  @Post()
  @ApiCreatedResponse({ type: FormSubmission })
  create(
    @Body() dto: CreateFormSubmissionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @ApiOkResponse({ type: FormSubmission, isArray: true })
  async findAll(@Query() query: QueryFormSubmissionDto) {
    const { data, totalCount } = await this.service.findAll(query);
    return { data, totalCount };
  }

  @Get('my-submissions')
  @ApiOkResponse({ type: FormSubmission, isArray: true })
  findMySubmissions(@CurrentUser() currentUser: User) {
    return this.service.findByCustomerId(currentUser.id);
  }

  @Get('by-booking/:bookingId')
  @ApiParam({ name: 'bookingId', type: Number })
  @ApiOkResponse({ type: FormSubmission })
  findByBooking(@Param('bookingId') bookingId: number) {
    return this.service.findByBookingId(bookingId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: FormSubmission })
  findOne(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
