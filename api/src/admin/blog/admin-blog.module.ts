import { Module } from '@nestjs/common';
import { BlogModule } from '../../blog/blog.module';
import { UsersModule } from '../../users/users.module';
import { AdminBlogController } from './admin-blog.controller';
import { AdminBlogService } from './admin-blog.service';

@Module({
  imports: [BlogModule, UsersModule],
  controllers: [AdminBlogController],
  providers: [AdminBlogService],
})
export class AdminBlogModule {}
