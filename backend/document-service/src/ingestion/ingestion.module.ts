import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { PythonMockService } from '../python-mock/python-mock.service';
import { DocumentsService } from '../document/document.service';
import { IngestionController } from './ingestion.controller';
import { IngestionJob } from '../entities/ingestion-job.entity';
import { Document } from '../entities/document.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [
    TypeOrmModule.forFeature([Document,IngestionJob]),
  ],
  controllers: [IngestionController],
  providers: [IngestionService,DocumentsService,PythonMockService],
  exports: [IngestionService],
})
export class IngestionModule { }
