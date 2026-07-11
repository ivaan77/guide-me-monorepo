import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { DiscoverModule } from '../discover/discover.module';
import { RatingsModule } from '../ratings/ratings.module';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    DiscoverModule,
    RatingsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, ClerkAuthGuard],
  exports: [UsersRepository],
})
export class UsersModule {}
