import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  AddFavoriteRequest,
  AddFavoriteResponse,
  FavoriteType,
  MeResponse,
  RemoveFavoriteResponse,
} from '@guide-me-app/core';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { UsersService } from './users.service';

const VALID_TYPES: FavoriteType[] = ['city', 'excursion', 'place'];

type AuthedRequest = { clerkUserId: string };

@Controller()
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('me')
  me(@Req() req: AuthedRequest): Promise<MeResponse> {
    return this.service.getOrCreate(req.clerkUserId);
  }

  @Post('me/favorites')
  addFavorite(
    @Req() req: AuthedRequest,
    @Body() body: AddFavoriteRequest,
  ): Promise<AddFavoriteResponse> {
    if (!VALID_TYPES.includes(body?.type) || !body?.id) {
      throw new BadRequestException('Invalid favorite payload.');
    }
    return this.service.addFavorite(req.clerkUserId, body);
  }

  @Delete('me/favorites/:type/:id')
  removeFavorite(
    @Req() req: AuthedRequest,
    @Param('type') type: string,
    @Param('id') id: string,
  ): Promise<RemoveFavoriteResponse> {
    if (!VALID_TYPES.includes(type as FavoriteType) || !id) {
      throw new BadRequestException('Invalid favorite reference.');
    }
    return this.service.removeFavorite(req.clerkUserId, {
      type: type as FavoriteType,
      id,
    });
  }
}
