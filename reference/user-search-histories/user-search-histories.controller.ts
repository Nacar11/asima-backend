import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserSearchHistoriesService } from '@/user-search-histories/user-search-histories.service';
import { QueryUserSearchHistoryDto } from '@/user-search-histories/dto/query-user-search-history.dto';
import { FindAllUserSearchHistory } from '@/user-search-histories/domain/find-all-user-search-history';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

/**
 * Controller for user search histories endpoints.
 */
@ApiTags('User Search Histories')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'user-search-histories',
  version: '1',
})
export class UserSearchHistoriesController {
  constructor(private readonly service: UserSearchHistoriesService) {}

  /**
   * Get paginated search histories for the current user.
   */
  @Get()
  @ApiOperation({
    summary: 'Get user search histories',
    description:
      'Retrieves paginated search history entries for the authenticated user.',
  })
  async findAll(
    @Query() query: QueryUserSearchHistoryDto,
    @CurrentUser() currentUser: User,
  ): Promise<FindAllUserSearchHistory> {
    return this.service.findAll(query, currentUser);
  }

  /**
   * Delete all search history entries for the current user.
   * Intended to support the "clear search history" action in the UI.
   */
  @Delete('batch-delete')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Clear user search histories',
    description:
      'Deletes all search history entries for the authenticated user in a single operation.',
  })
  async batchDelete(@CurrentUser() currentUser: User): Promise<void> {
    await this.service.batchDelete(currentUser);
  }

  /**
   * Get top popular search keywords across all users.
   */
  @Get('popular')
  @ApiOperation({
    summary: 'Get popular search keywords',
    description:
      'Retrieves the most popular search keywords based on global search usage.',
  })
  async getAllPopularSearches() {
    return this.service.getAllPopularSearches();
  }
}
