import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminDraftController } from './admin-draft.controller';
import { AdminDraft, AdminDraftSchema } from './admin-draft.schema';
import { AdminDraftService } from './admin-draft.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminDraft.name, schema: AdminDraftSchema },
    ]),
  ],
  controllers: [AdminDraftController],
  providers: [AdminDraftService],
})
export class AdminDraftModule {}
