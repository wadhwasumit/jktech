import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { TcpClientService } from './tcp-client.service';
import { AuthGuard } from './guard/auth.guard';
import { RolesGuard } from './guard/roles.guard';
import { StreamableFile } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { Response } from 'express';

describe('AppController', () => {
  let controller: AppController;
  let tcp: { sendAuthReq: jest.Mock; sendDocumentReq: jest.Mock };
  const mockUser = { id: 'u-1', email: 'u@example.com', role: 'admin' };

  // Silence controller logs during test
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => void 0);

  beforeEach(async () => {
    tcp = {
      sendAuthReq: jest.fn(),
      sendDocumentReq: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: TcpClientService, useValue: tcp }],
    })
      .overrideGuard(AuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AppController>(AppController);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(() => logSpy.mockRestore());

  // ---------- AUTH ----------
  it('POST /auth/google -> should request get_auth_token', async () => {
    tcp.sendAuthReq.mockReturnValue(of({ token: 'abc' }));
    const req = {} as any;                       // not used by the method, but required by signature
    const origin = 'http://localhost';
    const code = 'code-123';

    // Act
    const res$ = controller.googleLogin(req, origin, code);
    const res  = await firstValueFrom(await res$);

    expect(tcp.sendAuthReq).toHaveBeenCalledWith(
      { cmd: 'get_auth_token' },
      { code: 'code-123',origin: 'http://localhost' },
    );
    expect(res).toEqual({ token: 'abc' });
  });

  // ---------- USERS ----------
  it('GET /users -> should fetch all users (admin)', async () => {
    tcp.sendAuthReq.mockReturnValue(of([{ id: '1' }]));
    const res = await firstValueFrom(await controller.getAllUsers());
    expect(tcp.sendAuthReq).toHaveBeenCalledWith({ cmd: 'get_all_users' }, {});
    expect(res).toEqual([{ id: '1' }]);
  });

  it('GET /users/:id -> should fetch single user by id', async () => {
    tcp.sendAuthReq.mockReturnValue(of({ id: '42' }));
    const res = await firstValueFrom(await controller.getUserById('42'));
    expect(tcp.sendAuthReq).toHaveBeenCalledWith(
      { cmd: 'get_user_by_id' },
      { id: '42' },
    );
    expect(res).toEqual({ id: '42' });
  });

  it('PUT /users/role -> should update user role', async () => {
    tcp.sendAuthReq.mockReturnValue(of({ ok: true }));
    const body = { id: 'u1', role: 'admin' };
    const res = await firstValueFrom(await controller.updateUserRole(body));
    expect(tcp.sendAuthReq).toHaveBeenCalledWith(
      { cmd: 'update_user_role' },
      { id: 'u1', role: 'admin' },
    );
    expect(res).toEqual({ ok: true });
  });

  it('DELETE /users/:id -> should remove user', async () => {
    tcp.sendAuthReq.mockReturnValue(of({ deleted: 1 }));
    const res = await firstValueFrom(await controller.removeUser('u1'));
    expect(tcp.sendAuthReq).toHaveBeenCalledWith(
      { cmd: 'remove_user' },
      { id: 'u1' },
    );
    expect(res).toEqual({ deleted: 1 });
  });

  // ---------- DOCUMENTS ----------
  it('POST /documents -> should create document with file', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ id: 'doc1' }));
    const req = { user: mockUser } as any;
    const body = { title: 'My First', description: 'desc' };
    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'resume.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 10,
      buffer: Buffer.from('PDFDATA'),
      destination: '', filename: '', path: '', stream: undefined as any,
    };

    const res = await firstValueFrom(await controller.createDocument(req, body, file));
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'create_document' },
      {
        dto: { title: 'My First', description: 'desc' },
        user: mockUser,
        file: expect.objectContaining({ originalname: 'resume.pdf', buffer: expect.any(Buffer) }),
      },
    );
    expect(res).toEqual({ id: 'doc1' });
  });

  it('GET /documents -> should forward user to get_all_document', async () => {
    tcp.sendDocumentReq.mockReturnValue(of([{ id: 'd1' }]));
    const req = { user: mockUser } as any;
    const res = await firstValueFrom(await controller.getAllDocuments(req));
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'get_all_document' },
      { user: mockUser },
    );
    expect(res).toEqual([{ id: 'd1' }]);
  });

  it('GET /documents/:id -> should forward id + user', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ id: 'd1' }));
    const req = { user: mockUser } as any;
    const res = await firstValueFrom(await controller.getDocumentById(req, 'd1'));
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'get_document_by_id' },
      { id: 'd1', user: mockUser },
    );
    expect(res).toEqual({ id: 'd1' });
  });

  it('PUT /documents/:id -> should update document', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ ok: true }));
    const req = { user: mockUser } as any;
    const res = await firstValueFrom(
    await  controller.updateDocument(req, 'd1', { title: 'T2', description: 'D2' }),
    );
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'update_document' },
      { id: 'd1', dto: { title: 'T2', description: 'D2' }, user: mockUser },
    );
    expect(res).toEqual({ ok: true });
  });

  it('DELETE /documents/:id -> should delete document', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ deleted: 1 }));
    const req = { user: mockUser } as any;
    const res = await firstValueFrom(await controller.deleteDocument(req, 'd1'));
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'delete_document' },
      { id: 'd1', user: mockUser },
    );
    expect(res).toEqual({ deleted: 1 });
  });

  it('POST /documents/bulk/find -> should pass ids array', async () => {
    tcp.sendDocumentReq.mockReturnValue(of([{ id: 'd1' }, { id: 'd2' }]));
    const res = await firstValueFrom(await controller.findDocumentsByIds(['d1', 'd2']));
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'find_documents_by_ids' },
      { ids: ['d1', 'd2'] },
    );
    expect(res).toEqual([{ id: 'd1' }, { id: 'd2' }]);
  });

  it('GET /documents/:id/download -> should set headers and return StreamableFile', async () => {
    const dataB64 = Buffer.from('CONTENT').toString('base64');
    tcp.sendDocumentReq.mockReturnValue(of({ dataB64, filename: 'file.txt', mimeType: 'text/plain' }));

    const req = { user: mockUser } as any;
    const res = { set: jest.fn() } as unknown as Response;

    const out = await controller.downloadDocument(req, 'doc-1', res);
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'download_documents_by_id' },
      { id: 'doc-1', user: mockUser },
    );
    expect(res.set).toHaveBeenCalled();
    expect(out).toBeInstanceOf(StreamableFile);
  });

  it('GET /documents/:id/download -> throws NotFound when no dataB64', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ filename: 'x' }));
    const req = { user: mockUser } as any;
    const res = { set: jest.fn() } as unknown as Response;
    await expect(controller.downloadDocument(req, 'doc-2', res)).rejects.toThrow('File not available');
  });

  it('PATCH /documents/ingested -> should mark docs ingested', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ updated: 2 }));
    const res = await firstValueFrom(await controller.markDocumentsIngested(['a', 'b']));
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'mark_documents_ingested' },
      { ids: ['a', 'b'] },
    );
    expect(res).toEqual({ updated: 2 });
  });

  // ---------- INGESTION ----------
  it('POST /ingestion/job/trigger -> should forward dto + user', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ jobId: 'J1' }));
    const req = { user: mockUser } as any;
    const res = await firstValueFrom(await controller.trigger(req, ['d1', 'd2']));
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'trigger_job' },
      { dto: ['d1', 'd2'], user: mockUser },
    );
    expect(res).toEqual({ jobId: 'J1' });
  });

  it('GET /ingestion/job/status/:jobId -> should forward jobId + user', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ status: 'done' }));
    const req = { user: mockUser } as any;
    const res = await firstValueFrom(await controller.status(req, 'J1'));
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'get_job_status' },
      { jobId: 'J1', user: mockUser },
    );
    expect(res).toEqual({ status: 'done' });
  });

  it('GET /ingestion/jobs -> should pass limit/offset + user', async () => {
    tcp.sendDocumentReq.mockReturnValue(of({ items: [], total: 0 }));
    const req = { user: mockUser } as any;
    const res = await firstValueFrom(await controller.list(req, 25 as any, 10 as any));
    expect(tcp.sendDocumentReq).toHaveBeenCalledWith(
      { cmd: 'list_jobs' },
      { user: mockUser, limit: 25, offset: 10 },
    );
    expect(res).toEqual({ items: [], total: 0 });
  });
});
