import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { IngestionApiService, IngestionJob } from './ingestion.service';

describe('IngestionApiService', () => {
  let service: IngestionApiService;
  let http: HttpTestingController;

  const base = '/api/ingestion';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IngestionApiService,
        provideHttpClientTesting(), // provides HttpClient + HttpTestingController
      ],
    });

    service = TestBed.inject(IngestionApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify(); // ensure no unmatched requests
  });

  function makeJob(partial: Partial<IngestionJob> = {}): IngestionJob {
    return {
      id: partial.id ?? 'job-1',
      createdAt: partial.createdAt ?? new Date().toISOString(),
      updatedAt: partial.updatedAt ?? new Date().toISOString(),
      status: partial.status ?? 'queued',
      progress: partial.progress ?? 0,
      documentIds: partial.documentIds ?? ['doc-1'],
      errorMessage: partial.errorMessage,
    };
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('trigger() should POST and return job', () => {
    const payloadIds = ['a', 'b'];
    const mockJob = makeJob({ id: 'new-job', status: 'queued', documentIds: payloadIds });

    let result: IngestionJob | undefined;
    service.trigger(payloadIds, false).subscribe(r => (result = r));

    const req = http.expectOne(`${base}/job/trigger`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ documentIds: payloadIds }); // reindex not sent by service
    req.flush(mockJob);

    expect(result).toEqual(mockJob);
  });

  it('getJob() should GET by id', () => {
    const mockJob = makeJob({ id: 'x1' });

    let result: IngestionJob | undefined;
    service.getJob('x1').subscribe(r => (result = r));

    const req = http.expectOne(`${base}/job/status/x1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockJob);

    expect(result).toEqual(mockJob);
  });

  it('listJobs() should GET with pagination params', () => {
    const mock = [makeJob({ id: '1' }), makeJob({ id: '2' })];

    let result: IngestionJob[] | undefined;
    service.listJobs(25, 100).subscribe(r => (result = r));

    const req = http.expectOne(r =>
      r.url === `${base}/jobs` &&
      r.params.get('limit') === '25' &&
      r.params.get('offset') === '100'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    expect(result).toEqual(mock);
  });

  it('cancel() should POST and return canceled flag', () => {
    let result: { canceled: boolean } | undefined;
    service.cancel('stop-1').subscribe(r => (result = r));

    const req = http.expectOne(`${base}/cancel/stop-1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ canceled: true });

    expect(result).toEqual({ canceled: true });
  });

  it('pollJob() should poll until terminal status (inclusive)', fakeAsync(() => {
    const jobId = 'poll-1';
    const ms = 1000;
    const emissions: IngestionJob[] = [];

    service.pollJob(jobId, ms).subscribe(j => emissions.push(j));

    // 1st tick -> queued
    tick(ms);
    let req = http.expectOne(`${base}/job/status/${jobId}`);
    req.flush(makeJob({ id: jobId, status: 'queued', progress: 0 }));

    // 2nd tick -> running
    tick(ms);
    req = http.expectOne(`${base}/job/status/${jobId}`);
    req.flush(makeJob({ id: jobId, status: 'running', progress: 42 }));

    // 3rd tick -> succeeded (final, should still emit because takeWhile(..., true))
    tick(ms);
    req = http.expectOne(`${base}/job/status/${jobId}`);
    req.flush(makeJob({ id: jobId, status: 'succeeded', progress: 100 }));

    // let completion propagate
    tick(0);

    expect(emissions.length).toBe(3);
    expect(emissions[0].status).toBe('queued');
    expect(emissions[1].status).toBe('running');
    expect(emissions[2].status).toBe('succeeded');

    // No more requests after completion
    tick(ms);
    http.expectNone(`${base}/job/status/${jobId}`);
  }));
});
