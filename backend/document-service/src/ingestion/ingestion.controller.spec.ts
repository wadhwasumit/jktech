import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { TriggerIngestionDto } from '../dtos/trigger-ingestion.dto';
import { IngestionJob } from '../entities/ingestion-job.entity';

describe('IngestionController', () => {
  let controller: IngestionController;

  const ingestionServiceMock = {
    triggerIngestion: jest.fn(),
    getJob: jest.fn(),
    getAllJobs: jest.fn(),
  };

  const mockUser = { id: 'u1', role: 'ADMIN' } as any;
  const req = { user: mockUser } as any;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [{ provide: IngestionService, useValue: ingestionServiceMock }],
    }).compile();

    controller = module.get<IngestionController>(IngestionController);
  });

  // ---------------- REST: POST /ingestion/job/trigger ----------------
  it('trigger() calls service.triggerIngestion with dto & user and returns job', async () => {
    const dto = { documentIds: ['a', 'b'] } as unknown as TriggerIngestionDto;
    const job = { id: 'job-1', status: 'QUEUED' } as unknown as IngestionJob;

    ingestionServiceMock.triggerIngestion.mockResolvedValue(job);

    const result = await controller.trigger(req, dto);

    expect(ingestionServiceMock.triggerIngestion).toHaveBeenCalledWith(dto, mockUser);
    expect(result).toEqual(job);
  });

  // ---------------- REST: GET /ingestion/job/status/:jobId ----------------
  it('status() calls service.getJob with jobId & user', async () => {
    const job = { id: 'job-2', status: 'RUNNING' } as unknown as IngestionJob;
    ingestionServiceMock.getJob.mockResolvedValue(job);

    const result = await controller.status(req, 'job-2');

    expect(ingestionServiceMock.getJob).toHaveBeenCalledWith('job-2', mockUser);
    expect(result).toEqual(job);
  });

  // ---------------- REST: GET /ingestion/jobs (defaults) ----------------
  it('list() uses default limit=50 & offset=0 when not provided', async () => {
    const jobs = [{ id: 'j1' }, { id: 'j2' }] as unknown as IngestionJob[];
    ingestionServiceMock.getAllJobs.mockResolvedValue(jobs);

    // Call without passing limit/offset (simulate defaults)
    const result = await controller.list(req, undefined as any, undefined as any);

    expect(ingestionServiceMock.getAllJobs).toHaveBeenCalledWith(mockUser, 50, 0);
    expect(result).toEqual(jobs);
  });

  // ---------------- REST: GET /ingestion/jobs (explicit query) ----------------
  it('list() parses limit/offset as numbers from query strings', async () => {
    const jobs = [{ id: 'j3' }] as unknown as IngestionJob[];
    ingestionServiceMock.getAllJobs.mockResolvedValue(jobs);

    // Controller uses Number() on incoming values
    const result = await controller.list(req, '10' as any, '5' as any);

    expect(ingestionServiceMock.getAllJobs).toHaveBeenCalledWith(mockUser, 10, 5);
    expect(result).toEqual(jobs);
  });

  // ---------------- TCP: { cmd: "trigger_job" } ----------------
  it('triggerJobTCP calls service.triggerIngestion with dto & user', async () => {
    const dto = { documentIds: ['x'] } as unknown as TriggerIngestionDto;
    const job = { id: 'job-3', status: 'QUEUED' } as unknown as IngestionJob;

    ingestionServiceMock.triggerIngestion.mockResolvedValue(job);

    const result = await controller.triggerJobTCP({ dto, user: mockUser });

    expect(ingestionServiceMock.triggerIngestion).toHaveBeenCalledWith(dto, mockUser);
    expect(result).toEqual(job);
  });

  // ---------------- TCP: { cmd: "get_job_status" } ----------------
  it('createJobTCP calls service.getJob with jobId & user', async () => {
    const job = { id: 'job-4', status: 'DONE' } as unknown as IngestionJob;
    ingestionServiceMock.getJob.mockResolvedValue(job);

    const result = await controller.createJobTCP({ jobId: 'job-4', user: mockUser });

    expect(ingestionServiceMock.getJob).toHaveBeenCalledWith('job-4', mockUser);
    expect(result).toEqual(job);
  });

  // ---------------- TCP: { cmd: "list_jobs" } ----------------
  it('findAllJobsTCP calls service.getAllJobs with provided user/limit/offset', async () => {
    const jobs = [{ id: 'j5' }] as unknown as IngestionJob[];
    ingestionServiceMock.getAllJobs.mockResolvedValue(jobs);

    const result = await controller.findAllJobsTCP({
      user: mockUser,
      limit: 7,
      offset: 2,
    });

    expect(ingestionServiceMock.getAllJobs).toHaveBeenCalledWith(mockUser, 7, 2);
    expect(result).toEqual(jobs);
  });

  it('findAllJobsTCP works when limit/offset are undefined (delegates as-is)', async () => {
    const jobs = [{ id: 'j6' }] as unknown as IngestionJob[];
    ingestionServiceMock.getAllJobs.mockResolvedValue(jobs);

    const result = await controller.findAllJobsTCP({
      user: mockUser,
      limit: undefined,
      offset: undefined,
    });

    expect(ingestionServiceMock.getAllJobs).toHaveBeenCalledWith(mockUser, undefined, undefined);
    expect(result).toEqual(jobs);
  });
});
