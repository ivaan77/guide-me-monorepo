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
  UseGuards,
} from '@nestjs/common';
import {
  type AdminBlogListResponse,
  type AdminBlogResponse,
  AdminPath,
} from '@guide-me-app/core';
import { AdminTokenGuard } from '../admin-token.guard';
import { AdminBlogService } from './admin-blog.service';
import { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';

@Controller()
@UseGuards(AdminTokenGuard)
export class AdminBlogController {
  constructor(private readonly service: AdminBlogService) {}

  @Get(AdminPath.Blog.posts)
  list(): Promise<AdminBlogListResponse> {
    return this.service.list();
  }

  @Get(AdminPath.Blog.postBySlug)
  getBySlug(@Param('slug') slug: string): Promise<AdminBlogResponse> {
    return this.service.getBySlug(slug);
  }

  @Post(AdminPath.Blog.posts)
  create(@Body() dto: CreateBlogDto): Promise<AdminBlogResponse> {
    return this.service.create(dto);
  }

  @Patch(AdminPath.Blog.postBySlug)
  update(
    @Param('slug') slug: string,
    @Body() dto: UpdateBlogDto,
  ): Promise<AdminBlogResponse> {
    return this.service.update(slug, dto);
  }

  @Delete(AdminPath.Blog.postBySlug)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('slug') slug: string): Promise<void> {
    return this.service.delete(slug);
  }
}
