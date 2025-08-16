import { Module } from '@nestjs/common';
import { DocumentsService } from './document.service';
import { DocumentController } from './document.controller';
// import { MongooseModule } from '@nestjs/mongoose';
import { Document } from '../entities/document.entity';
// import * as redisStore from 'cache-manager-redis-store';
// import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    // MongooseModule.forFeature([{ name: DocumentDto.name, schema: DocumentSchema }]),
    // CacheModule.register({
    //   store: redisStore,
    //   host: 'redis', // Update if using Docker (use service name)
    //   port: 6379,
    //   ttl: 3600, // Cache expiration time in seconds
    // }),

  ],
  controllers: [DocumentController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentModule { }
