import { Controller, Get, UseGuards } from '@nestjs/common';
import { type AdminImageGalleryResponse, AdminPath } from '@guide-me-app/core';
import { AdminTokenGuard } from '../admin-token.guard';
import { AdminImageGalleryService } from './admin-image-gallery.service';

@Controller()
@UseGuards(AdminTokenGuard)
export class AdminImageGalleryController {
  constructor(private readonly service: AdminImageGalleryService) {}

  @Get(AdminPath.ImageGallery.list)
  list(): Promise<AdminImageGalleryResponse> {
    return this.service.list();
  }
}
