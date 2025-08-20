import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { of } from 'rxjs';

import { AppController } from '../src/app.controller';
import { TcpClientService } from '../src/tcp-client.service';
import { AuthGuard } from '../src/guard/auth.guard';
import { RolesGuard } from '../src/guard/roles.guard';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  // keep handles to the mock so we can assert calls
  const tcp = {
    sendAuthReq: jest.fn(),
    sendDocumentReq: jest.fn(),
  };

  // Simple pass-through guards for e2e (injects a user, allows all)
  class AllowAuthGuard {
    canActivate(ctx: any) {
      const req = ctx.switchToHttp().getRequest();
      req.user = { id: 'u-1', email: 'u@example.com', role: 'admin' };
      return true;
    }
  }
  class AllowRolesGuard {
    canActivate() {
      return true;
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: TcpClientService, useValue: tcp }],
    })
      .overrideGuard(AuthGuard)
      .useClass(AllowAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(AllowRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  // -------- AUTH --------
  it('POST /auth/google -> returns token and forwards correct payload', async () => {
    tcp.sendAuthReq.mockReturnValue(of({ token: 'abc' }));

    const res = await request(app.getHttpServer())
      .post('/auth/google')
      .set('Origin', 'http://localhost') 
      .send({ code: 'code-123' })
      .expect(201); // Nest default for POST handler that returns a body

    expect(res.body).toEqual({ token: 'abc' });
    expect(tcp.sendAuthReq).toHaveBeenCalledWith(
      { cmd: 'get_auth_token' },
      { code: 'code-123' ,origin: 'http://localhost' },
    );
  });

  // -------- USERS --------
  it('GET /users -> forwards to get_all_users', async () => {
    tcp.sendAuthReq.mockReturnValue(of([{ id: '1' }]));

    const res = await request(app.getHttpServer())
      .get('/users')
      .expect(200);

    expect(res.body).toEqual([{ id: '1' }]);
    expect(tcp.sendAuthReq).toHaveBeenCalledWith({ cmd: 'get_all_users' }, {});
  });

  it('GET /users/:id -> forwards to get_user_by_id', async () => {
    tcp.sendAuthReq.mockReturnValue(of({ id: '42' }));

    const res = await request(app.getHttpServer())
      .get('/users/42')
      .expect(200);

    expect(res.body).toEqual({ id: '42' });
    expect(tcp.sendAuthReq).toHaveBeenCalledWith(
      { cmd: 'get_user_by_id' },
      { id: '42' },
    );
  });

  it('PUT /users/role -> forwards to update_user_role', async () => {
    tcp.sendAuthReq.mockReturnValue(of({ ok: true }));

    const res = await request(app.getHttpServer())
      .put('/users/role')
      .send({ id: 'u1', role: 'admin' })
      .expect(200);

    expect(res.body).toEqual({ ok: true });
    expect(tcp.sendAuthReq).toHaveBeenCalledWith(
      { cmd: 'update_user_role' },
      { id: 'u1', role: 'admin' },
    );
  });

  it('DELETE /users/:id -> forwards to remove_user', async () => {
    tcp.sendAuthReq.mockReturnValue(of({ deleted: 1 }));

    const res = await request(app.getHttpServer())
      .delete('/users/u1')
      .expect(200);

    expect(res.body).toEqual({ deleted: 1 });
    expect(tcp.sendAuthReq).toHaveBeenCalledWith(
      { cmd: 'remove_user' },
      { id: 'u1' },
    );
  });

  // -------- DOCUMENTS --------
  it('POST /documents -> multipart upload + body -> forwards to create_document', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ id: 'doc1' }));

    const res = await request(app.getHttpServer())
      .post('/documents')
      .field('title', 'My First document')
      .field('description', 'This is a test description')
      .attach('file', Buffer.from('PDFDATA'), { filename: 'resume.pdf', contentType: 'application/pdf' })
      .expect(201);

    expect(res.body).toEqual({ id: 'doc1' });

    // Assert command shape (cannot check buffer equality easily here, but we can check presence)
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'create_document' },
      expect.objectContaining({
        dto: { title: 'My First document', description: 'This is a test description' },
        user: expect.objectContaining({ id: 'u-1' }),
        file: expect.objectContaining({
          originalname: 'resume.pdf',
          buffer: expect.any(Buffer),
          mimetype: 'application/pdf',
        }),
      }),
    );
  });

  it('GET /documents -> forwards user to get_all_document', async () => {
    tcp.sendDocumentReq.mockReturnValue(of([{ id: 'd1' }]));

    const res = await request(app.getHttpServer())
      .get('/documents')
      .expect(200);

    expect(res.body).toEqual([{ id: 'd1' }]);
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'get_all_document' },
      { user: expect.objectContaining({ id: 'u-1' }) },
    );
  });

  it('GET /documents/:id -> forwards id + user', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ id: 'd1' }));

    const res = await request(app.getHttpServer())
      .get('/documents/d1')
      .expect(200);

    expect(res.body).toEqual({ id: 'd1' });
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'get_document_by_id' },
      { id: 'd1', user: expect.objectContaining({ id: 'u-1' }) },
    );
  });

  it('PUT /documents/:id -> forwards update payload', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ ok: true }));

    const res = await request(app.getHttpServer())
      .put('/documents/d1')
      .send({ title: 'Updated Title', description: 'Updated Description' })
      .expect(200);

    expect(res.body).toEqual({ ok: true });
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'update_document' },
      {
        id: 'd1',
        dto: { title: 'Updated Title', description: 'Updated Description' },
        user: expect.objectContaining({ id: 'u-1' }),
      },
    );
  });

  it('DELETE /documents/:id -> forwards delete payload', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ deleted: 1 }));

    const res = await request(app.getHttpServer())
      .delete('/documents/d1')
      .expect(200);

    expect(res.body).toEqual({ deleted: 1 });
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'delete_document' },
      { id: 'd1', user: expect.objectContaining({ id: 'u-1' }) },
    );
  });

  it('POST /documents/bulk/find -> forwards ids list', async () => {
    tcp.sendDocumentReq.mockReturnValue(of([{ id: 'd1' }, { id: 'd2' }]));

    const res = await request(app.getHttpServer())
      .post('/documents/bulk/find')
      .send({ ids: ['d1', 'd2'] })
      .expect(201);

    expect(res.body).toEqual([{ id: 'd1' }, { id: 'd2' }]);
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'find_documents_by_ids' },
      { ids: ['d1', 'd2'] },
    );
  });

  it('GET /documents/:id/download -> streams with headers', async () => {
    const dataB64 = Buffer.from('CONTENT').toString('base64');
    tcp.sendDocumentReq.mockReturnValue(
      of({ dataB64, filename: 'file.txt', mimeType: 'text/plain' }),
    );

    const res = await request(app.getHttpServer())
      .get('/documents/doc-1/download')
      .expect(200);

    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.headers['content-disposition']).toBe('attachment; filename="file.txt"');
    expect(res.headers['content-length']).toBe(String(Buffer.from('CONTENT').length));
    expect(res.text).toBe('CONTENT');

    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'download_documents_by_id' },
      { id: 'doc-1', user: expect.objectContaining({ id: 'u-1' }) },
    );
  });

  it('GET /documents/:id/download -> 404 when file missing', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ filename: 'x' }));

    const res = await request(app.getHttpServer())
      .get('/documents/doc-2/download')
      .expect(404);

    expect(res.body.message).toContain('File not available');
  });

  // -------- INGESTION --------
  it('POST /ingestion/job/trigger -> forwards dto + user', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ jobId: 'J1' }));

    const res = await request(app.getHttpServer())
      .post('/ingestion/job/trigger')
      .send({ documentIds: ['d1', 'd2'] }) // matches controller @ApiBody docs
      .expect(201);

    expect(res.body).toEqual({ jobId: 'J1' });
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'trigger_job' },
      { dto: { documentIds: ['d1','d2'] }, user: expect.objectContaining({ id: 'u-1' }) },
    );
  });

  it('GET /ingestion/job/status/:jobId -> forwards jobId + user', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ status: 'done' }));

    const res = await request(app.getHttpServer())
      .get('/ingestion/job/status/J1')
      .expect(200);

    expect(res.body).toEqual({ status: 'done' });
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'get_job_status' },
      { jobId: 'J1', user: expect.objectContaining({ id: 'u-1' }) },
    );
  });

  it('GET /ingestion/jobs -> forwards limit/offset + user', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ items: [], total: 0 }));

    const res = await request(app.getHttpServer())
      .get('/ingestion/jobs?limit=25&offset=10')
      .expect(200);

    expect(res.body).toEqual({ items: [], total: 0 });
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'list_jobs' },
      { user: expect.objectContaining({ id: 'u-1' }), limit: 25, offset: 10 },
    );
  });
});
