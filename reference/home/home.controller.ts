import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { HomeService } from './home.service';

@ApiTags('Home')
@Controller()
export class HomeController {
  constructor(private service: HomeService) {}

  @Get()
  appInfo() {
    return this.service.appInfo();
  }

  @Post()
  @HttpCode(200)
  postInfo() {
    return;
  }
}
