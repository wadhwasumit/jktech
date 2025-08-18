import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngestedDocument, IngestionJob } from '../entities/ingestion-job.entity';
import { TriggerIngestionDto} from '../dtos/trigger-ingestion.dto';
import { User } from '../entities/user.entity';
import { DocumentsService } from '../document/document.service';
import { PythonMockService } from '../python-mock/python-mock.service';
import { IngestionStatus } from '../common/enums/ingestion-status.enum';
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(IngestionJob)
    private readonly ingestionJobRepository: Repository<IngestionJob>,
    private readonly documentsService: DocumentsService,
    private readonly pythonMockService: PythonMockService,
  ) {}

  async triggerIngestion(triggerIngestionDto: TriggerIngestionDto, user: User): Promise<IngestionJob> {
    // Validate that all documents exist and user has access
    const documents = await this.documentsService.findByIds(triggerIngestionDto.documentIds);
    
    if (documents.length !== triggerIngestionDto.documentIds.length) {
      throw new NotFoundException('One or more documents not found');
    }
    const ingestedDocuments: IngestedDocument[] = documents.map(d => ({
      id: d.id,
      name: d.title,
    }));
    // Create ingestion job
    const job = this.ingestionJobRepository.create({
      ingestedDocuments: ingestedDocuments,
      // createdBy: user,
      createdById: user.id,
      status: IngestionStatus.PENDING,
    });

    const savedJob = await this.ingestionJobRepository.save(job);

    // Trigger Python backend (or mock service)
    this.processIngestionAsync(savedJob.id, documents);

    return savedJob;
  }

  private async processIngestionAsync(jobId: string, documents: any[]): Promise<void> {
    try {
      // Update job status to processing
      await this.updateJobStatus(jobId, IngestionStatus.PROCESSING, new Date());

      // Call Python backend (or mock service)
      const result = await this.pythonMockService.ingestDocuments(documents);

      if (result.success) {
        await this.updateJobStatus(jobId, IngestionStatus.COMPLETED, null, new Date());
        // Mark documents as ingested
        const documentIds = documents.map(doc => doc.id);
        await this.documentsService.markAsIngested(documentIds);
      } else {
        await this.updateJobStatus(jobId, IngestionStatus.FAILED, null, null, result.error);
      }
    } catch (error) {
      await this.updateJobStatus(jobId, IngestionStatus.FAILED, null, null, error.message);
    }
  }

  private async updateJobStatus(
    jobId: string, 
    status: IngestionStatus, 
    startedAt?: Date, 
    completedAt?: Date, 
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = { status };
    if (startedAt) updateData.startedAt = startedAt;
    if (completedAt) updateData.completedAt = completedAt;
    if (errorMessage) updateData.errorMessage = errorMessage;

    await this.ingestionJobRepository.update(jobId, updateData);
  }

  async getJob(jobId: string, user: User): Promise<IngestionJob> {
    const job = await this.ingestionJobRepository.findOne({
      where: { id: jobId },
      // relations: ['createdBy'],
    });

    if (!job) {
      throw new NotFoundException('Ingestion job not found');
    }

    if (user.role !== UserRole.ADMIN && job.createdById !== user.id) {
      throw new ForbiddenException('You do not have permission to access this job');
    }

    return job;
  }

  async getAllJobs(user: User,limit:number,offset:number): Promise<IngestionJob[]> {
    const baseOptions: any = {
    order: { createdAt: 'DESC' },
    skip: offset,   // number of rows to skip
    take: limit,    // number of rows to fetch
  };

  if (user.role === UserRole.ADMIN) {
    return await this.ingestionJobRepository.find(baseOptions);
  }

  return await this.ingestionJobRepository.find({
    ...baseOptions,
    where: { createdById: user.id },
  });
  }
}