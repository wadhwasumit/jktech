import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { Document } from './document.entity';
import { IngestionJob } from './ingestion-job.entity';

@Entity('User')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ unique: true })
  googleId: string;

  @Column({ nullable: true })
  image: string;

  @Column({ default: UserRole.VIEWER  })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  // @OneToMany(() => Document, document => document.uploadedBy)
  // documents: Document[];

  // @OneToMany(() => IngestionJob, job => job.createdBy)
  // ingestionJobs: IngestionJob[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}