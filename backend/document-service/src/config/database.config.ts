import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Document } from '../entities/document.entity';
import { IngestionJob } from '../entities/ingestion-job.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'postgres',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'auth_db',
  entities: [Document, IngestionJob],
  // entities: ['dist/**/*.entity.{js,ts}'],
  synchronize: true, // Set to false in production
  logging: true,
  // migrations: ['dist/migrations/*.{js,ts}'],
  // migrationsTransactionMode: 'none', // <-- needed for CREATE DATABASE
};