import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IngestionService } from './ingestion.service';            // <-- adjust path if needed
import { IngestionJob } from '../entities/ingestion-job.entity'; // <-- adjust path
import { DocumentsService } from '../document/document.service'; // <-- adjust path
import { PythonMockService } from '../python-mock/python-mock.service'; // <-- adjust path

import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { IngestionStatus } from '../common/enums/ingestion-status.enum';  // <-- adjust path
import { UserRole } from '../common/enums/user-role.enum';               // <-- adjust path

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepo = <T = any>(): MockRepo<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
});

const createDocsServiceMock = () => ({
  findByIds: jest.fn(),
  markAsIngested: jest.fn(),
});

const createPythonMock = () => ({
  ingestDocuments: jest.fn(),
});

describe('IngestionService', () => {
  let service: IngestionService;
  let repo: MockRepo<IngestionJob>;
  let docsService: ReturnType<typeof createDocsServiceMock>;
  let pyMock: ReturnType<typeof createPythonMock>;

  const adminUser = { id: 'admin-1', role: UserRole.ADMIN } as any;
  const user = { id: 'user-1', role: UserRole.VIEWER } as any;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: getRepositoryToken(IngestionJob), useValue: createMockRepo<IngestionJob>() },
        { provide: DocumentsService, useFactory: createDocsServiceMock },
        { provide: PythonMockService, useFactory: createPythonMock },
      ],
    }).compile();

    service = module.get(IngestionService);
    repo = module.get(getRepositoryToken(IngestionJob));
    docsService = module.get(DocumentsService);
    pyMock = module.get(PythonMockService);
  });

  describe('triggerIngestion', () => {
    it('creates job, saves, and kicks off async processing', async () => {
      const dto = { documentIds: ['d1', 'd2'] } as any;
      const documents = [{ id: 'd1', title: 'A' }, { id: 'd2', title: 'B' }];
      (docsService.findByIds as jest.Mock).mockResolvedValue(documents);

      const created = { id: undefined, status: IngestionStatus.PENDING } as any;
      const saved = { id: 'job-1', status: IngestionStatus.PENDING } as any;

      (repo.create as jest.Mock).mockReturnValue(created);
      (repo.save as jest.Mock).mockResolvedValue(saved);

      const spyProcess = jest
        // @ts-ignore private method
        .spyOn(service as any, 'processIngestionAsync')
        .mockResolvedValue(undefined);

      const result = await service.triggerIngestion(dto, user);

      // validates doc presence
      expect(docsService.findByIds).toHaveBeenCalledWith(['d1', 'd2']);

      // creates/saves job with ingestedDocuments + createdById + PENDING
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdById: user.id,
          status: IngestionStatus.PENDING,
          ingestedDocuments: [
            { id: 'd1', name: 'A' },
            { id: 'd2', name: 'B' },
          ],
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(created);

      // fires the async processor
      expect(spyProcess).toHaveBeenCalledWith('job-1', documents);

      // returns saved job
      expect(result).toBe(saved);
    });

    it('throws NotFound if some document IDs are missing', async () => {
      const dto = { documentIds: ['d1', 'd2'] } as any;
      (docsService.findByIds as jest.Mock).mockResolvedValue([{ id: 'd1', title: 'A' }]);
      await expect(service.triggerIngestion(dto, user)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('processIngestionAsync (private)', () => {
    it('success path: sets PROCESSING -> COMPLETED and marks docs ingested', async () => {
      const jobId = 'job-1';
      const docs = [{ id: 'd1' }, { id: 'd2' }];

      // PROCESSING update, then COMPLETED update
      (repo.update as jest.Mock).mockResolvedValue(undefined);
      (pyMock.ingestDocuments as jest.Mock).mockResolvedValue({ success: true });

      // @ts-ignore private
      await (service as any).processIngestionAsync(jobId, docs);

      // 1st: PROCESSING with startedAt
      expect(repo.update).toHaveBeenNthCalledWith(
        1,
        jobId,
        expect.objectContaining({
          status: IngestionStatus.PROCESSING,
          startedAt: expect.any(Date),
        }),
      );
      // 2nd: COMPLETED with completedAt
      expect(repo.update).toHaveBeenNthCalledWith(
        2,
        jobId,
        expect.objectContaining({
          status: IngestionStatus.COMPLETED,
          completedAt: expect.any(Date),
        }),
      );

      expect(docsService.markAsIngested).toHaveBeenCalledWith(['d1', 'd2']);
    });

    it('backend failure: sets FAILED with errorMessage', async () => {
      const jobId = 'job-2';
      const docs = [{ id: 'x' }];

      (repo.update as jest.Mock).mockResolvedValue(undefined);
      (pyMock.ingestDocuments as jest.Mock).mockResolvedValue({ success: false, error: 'boom' });

      // @ts-ignore private
      await (service as any).processIngestionAsync(jobId, docs);

      // PROCESSING first
      expect(repo.update).toHaveBeenNthCalledWith(
        1,
        jobId,
        expect.objectContaining({ status: IngestionStatus.PROCESSING, startedAt: expect.any(Date) }),
      );

      // FAILED with errorMessage
      expect(repo.update).toHaveBeenNthCalledWith(
        2,
        jobId,
        expect.objectContaining({ status: IngestionStatus.FAILED, errorMessage: 'boom' }),
      );

      expect(docsService.markAsIngested).not.toHaveBeenCalled();
    });

    it('exception path: sets FAILED with thrown error message', async () => {
      const jobId = 'job-3';
      const docs = [{ id: 'y' }];

      (repo.update as jest.Mock).mockResolvedValue(undefined);
      (pyMock.ingestDocuments as jest.Mock).mockRejectedValue(new Error('kaput'));

      // @ts-ignore private
      await (service as any).processIngestionAsync(jobId, docs);

      // PROCESSING first
      expect(repo.update).toHaveBeenNthCalledWith(
        1,
        jobId,
        expect.objectContaining({ status: IngestionStatus.PROCESSING, startedAt: expect.any(Date) }),
      );

      // FAILED with errorMessage = 'kaput'
      expect(repo.update).toHaveBeenNthCalledWith(
        2,
        jobId,
        expect.objectContaining({ status: IngestionStatus.FAILED, errorMessage: 'kaput' }),
      );
    });
  });

  describe('getJob', () => {
    it('returns job if found and authorized', async () => {
      const job = { id: 'job-1', createdById: user.id } as any;
      (repo.findOne as jest.Mock).mockResolvedValue(job);

      const result = await service.getJob('job-1', user);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'job-1' } });
      expect(result).toBe(job);
    });

    it('throws NotFound when missing', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getJob('job-x', user)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden for non-admin requesting others job', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({ id: 'job-2', createdById: 'other' } as any);
      await expect(service.getJob('job-2', user)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('admin can access others job', async () => {
      const job = { id: 'job-3', createdById: 'other' } as any;
      (repo.findOne as jest.Mock).mockResolvedValue(job);
      const result = await service.getJob('job-3', adminUser);
      expect(result).toBe(job);
    });
  });

  describe('getAllJobs', () => {
    it('admin gets all jobs with paging', async () =>{
      // prettier-ignore
      const baseOptions = { order: { createdAt: 'DESC' }, skip: 10, take: 5 };
      const jobs = [{ id: '1' }, { id: '2' }] as any;
      (repo.find as jest.Mock).mockResolvedValue(jobs);

      const result = await service.getAllJobs(adminUser, 5, 10);

      expect(repo.find).toHaveBeenCalledWith(baseOptions);
      expect(result).toBe(jobs);
    });

    it('non-admin gets only own jobs with paging', async () => {
      const jobs = [{ id: '3' }] as any;
      (repo.find as jest.Mock).mockResolvedValue(jobs);

      const result = await service.getAllJobs(user, 20, 0);
      expect(repo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
        where: { createdById: user.id },
      });
      expect(result).toBe(jobs);
    });
  });
});
