import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  RateRequest,
  RateResponse,
  RatingTargetType,
  RatingValue,
  RemoveRatingResponse,
} from '@guide-me-app/core';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { RatingsService } from './ratings.service';

const VALID_TARGETS: RatingTargetType[] = ['city', 'excursion', 'place'];
const VALID_VALUES = new Set<RatingValue>([1, 2, 3, 4, 5]);

type AuthedRequest = { clerkUserId: string };

@Controller()
@UseGuards(ClerkAuthGuard)
export class RatingsController {
  constructor(private readonly service: RatingsService) {}

  @Post('me/ratings')
  rate(
    @Req() req: AuthedRequest,
    @Body() body: RateRequest,
  ): Promise<RateResponse> {
    if (
      !body ||
      !VALID_TARGETS.includes(body.targetType) ||
      !body.targetId ||
      !VALID_VALUES.has(body.value as RatingValue)
    ) {
      throw new BadRequestException('Invalid rating payload.');
    }
    return this.service.rate(
      req.clerkUserId,
      body.targetType,
      body.targetId,
      body.value,
    );
  }

  @Delete('me/ratings/:type/:id')
  unrate(
    @Req() req: AuthedRequest,
    @Param('type') type: string,
    @Param('id') id: string,
  ): Promise<RemoveRatingResponse> {
    if (!VALID_TARGETS.includes(type as RatingTargetType) || !id) {
      throw new BadRequestException('Invalid rating reference.');
    }
    return this.service.unrate(req.clerkUserId, type as RatingTargetType, id);
  }
}
