import { Module } from '@nestjs/common';
import { DocumentsService } from './document.service';
import { DocumentController } from './document.controller';
import { Document } from '../entities/document.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
  ],
  controllers: [DocumentController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentModule { }
