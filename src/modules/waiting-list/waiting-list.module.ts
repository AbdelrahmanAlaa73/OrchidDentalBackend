import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WaitingListItem, WaitingListItemSchema } from './schemas/waiting-list-item.schema';
import { WaitingListService } from './waiting-list.service';
import { WaitingListController } from './waiting-list.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: WaitingListItem.name, schema: WaitingListItemSchema }])],
  controllers: [WaitingListController],
  providers: [WaitingListService],
  exports: [WaitingListService, MongooseModule],
})
export class WaitingListModule {}
