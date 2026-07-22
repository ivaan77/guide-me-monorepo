import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  type AdminDraftListResponse,
  type AdminDraftResponse,
  type AdminDraftUpsertRequest,
  AdminPath,
  DRAFT_ENTITY_TYPES,
  type DraftEntityType,
} from '@guide-me-app/core';
import { AdminTokenGuard } from '../admin-token.guard';
import { AdminDraftService } from './admin-draft.service';

// Single-account admin auth for now; when real per-user auth lands the
// hardcoded id here becomes `req.session.userId` (or similar). The rest
// of the pipeline already threads authorId through.
const CURRENT_ADMIN_ID = 'admin';

function assertEntityType(raw: string): DraftEntityType {
  if ((DRAFT_ENTITY_TYPES as readonly string[]).includes(raw)) {
    return raw as DraftEntityType;
  }
  throw new BadRequestException(`Unknown draft entityType: ${raw}`);
}

@Controller()
@UseGuards(AdminTokenGuard)
export class AdminDraftController {
  constructor(private readonly service: AdminDraftService) {}

  @Get(AdminPath.Drafts.listByType)
  list(
    @Param('entityType') entityType: string,
  ): Promise<AdminDraftListResponse> {
    return this.service.listByType(
      assertEntityType(entityType),
      CURRENT_ADMIN_ID,
    );
  }

  @Get(AdminPath.Drafts.one)
  getOne(
    @Param('entityType') entityType: string,
    @Param('slug') slug: string,
  ): Promise<AdminDraftResponse> {
    return this.service.getOne(
      assertEntityType(entityType),
      slug,
      CURRENT_ADMIN_ID,
    );
  }

  @Put(AdminPath.Drafts.one)
  upsert(
    @Param('entityType') entityType: string,
    @Param('slug') slug: string,
    @Body() body: AdminDraftUpsertRequest,
  ): Promise<AdminDraftResponse> {
    return this.service.upsert(
      assertEntityType(entityType),
      slug,
      CURRENT_ADMIN_ID,
      body,
    );
  }

  @Delete(AdminPath.Drafts.one)
  @HttpCode(204)
  async remove(
    @Param('entityType') entityType: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    await this.service.remove(
      assertEntityType(entityType),
      slug,
      CURRENT_ADMIN_ID,
    );
  }
}
