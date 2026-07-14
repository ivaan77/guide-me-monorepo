import { Module } from '@nestjs/common';
import { BlogModule } from '../../blog/blog.module';
import { DiscoverModule } from '../../discover/discover.module';
import { UsersModule } from '../../users/users.module';
import { AdminImageGalleryController } from './admin-image-gallery.controller';
import { AdminImageGalleryService } from './admin-image-gallery.service';

@Module({
  imports: [BlogModule, DiscoverModule, UsersModule],
  controllers: [AdminImageGalleryController],
  providers: [AdminImageGalleryService],
})
export class AdminImageGalleryModule {}
