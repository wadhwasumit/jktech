// import { Global, Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// // import { MongooseModule } from '@nestjs/mongoose';
// import { DocumentModule } from './document/document.module';
// import { CacheModule } from '@nestjs/cache-manager';
// import { redisStore } from 'cache-manager-redis-store';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { ConsulModule } from './consule/consule.module';
// import { HealthController } from './health.controller';
// import { PrometheusModule } from '@willsoto/nestjs-prometheus';

// @Module({
//   imports: [
//     PrometheusModule.register(),
//     // MongooseModule.forRoot('mongodb://mongo1,mongo2,mongo3/documentdb', {
//     //   replicaSet: 'rs0',
//     // }),
//     ConfigModule.forRoot(),
//     CacheModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => ({
//         store: redisStore,
//         host: configService.get('REDIS_HOST', 'localhost'),
//         port: configService.get<number>('REDIS_PORT', 6379),
//         ttl: 60 * 60, // Cache for 1 hour
//       }),
//     }),
//     DocumentModule,
//     ConsulModule
//   ],
//   controllers: [AppController, HealthController],
//   providers: [AppService],
//   exports: [CacheModule]
// })
// export class AppModule { }

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsulModule } from './consule/consule.module';
import { HealthController } from './health.controller';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { databaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentModule } from './document/document.module';
import { IngestionModule } from './ingestion/ingestion.module';

@Module({
  imports: [
    PrometheusModule.register(), 
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    ConsulModule,
    DocumentModule  ,
    IngestionModule
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}