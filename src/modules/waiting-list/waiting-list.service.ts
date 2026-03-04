import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WaitingListItem } from './schemas/waiting-list-item.schema';
import { CreateWaitingListItemDto } from './dto/create-waiting-list-item.dto';

@Injectable()
export class WaitingListService {
  constructor(@InjectModel(WaitingListItem.name) private waitingListModel: Model<WaitingListItem>) {}

  async findAll() {
    return this.waitingListModel.find().populate('patientId', 'name nameAr phone').sort({ preferredDate: 1, urgency: -1 }).lean();
  }

  async create(dto: CreateWaitingListItemDto) {
    const item = await this.waitingListModel.create({
      ...dto,
      patientId: new Types.ObjectId(dto.patientId),
    });
    return this.waitingListModel.findById(item._id).populate('patientId', 'name nameAr phone').lean();
  }

  async remove(id: string) {
    const deleted = await this.waitingListModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Waiting list item not found');
  }
}
