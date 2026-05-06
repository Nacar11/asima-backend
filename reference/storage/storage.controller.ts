import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StorageService } from './storage.service';
import { ApiBearerAuth, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadStorageDto } from './dto/upload.dto';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'storage',
  version: '1',
})
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadStorageDto,
  ) {
    // Get the file with type checking
    const uploadedFile = body.base64_file || file;

    // Validate that we have a file
    if (!uploadedFile) {
      throw new BadRequestException('No file provided');
    }

    const filePath = body.folder_path
      ? `${body.folder_path}/${body.filename}`
      : body.filename;

    return this.storageService.put(uploadedFile, filePath);
  }

  @Get(':path')
  @ApiParam({
    name: 'path',
    type: String,
    required: true,
  })
  get(@Param('path') path: string) {
    return this.storageService.get(path);
  }

  @Put(':path')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiParam({
    name: 'path',
    type: String,
    required: true,
  })
  update(
    @Param('path') path: string,
    @Body() body: UploadStorageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Get the file with type checking
    const uploadedFile = body.base64_file || file;

    // Validate that we have a file
    if (!uploadedFile) {
      throw new BadRequestException('No file provided');
    }

    const filePath = body.folder_path
      ? `${body.folder_path}/${body.filename}`
      : body.filename;

    return this.storageService.update(uploadedFile, filePath, path);
  }

  @Delete(':path')
  @ApiParam({
    name: 'path',
    type: String,
    required: true,
  })
  destroy(@Param('path') path: string) {
    return this.storageService.delete(path);
  }
}
