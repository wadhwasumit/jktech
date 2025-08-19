import { Test, TestingModule } from '@nestjs/testing';
import { DocumentController } from './document.controller';
import { DocumentsService } from './document.service'; // adjust path if needed
import { NotFoundException } from '@nestjs/common';
import { Response } from 'express';

// ---- Mock fs.promises + createReadStream ----
const fsAccessMock = jest.fn();
const fsReadFileMock = jest.fn();
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    promises: {
      access: (...args: any[]) => fsAccessMock(...args),
      readFile: (...args: any[]) => fsReadFileMock(...args),
    },
    createReadStream: jest.fn(),
  };
});
import { createReadStream } from 'fs';

// ---- Helper: mock DocumentsService shape ----
const mockDocsService = () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByIds: jest.fn(),
  markAsIngested: jest.fn(),
});

describe('DocumentController', () => {
  let controller: DocumentController;
  let service: ReturnType<typeof mockDocsService>;

  const adminUser = { id: 'admin-1', role: 'ADMIN' };
  const normalUser = { id: 'user-1', role: 'VIEWER' };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        { provide: DocumentsService, useFactory: mockDocsService },
      ],
    }).compile();

    controller = module.get(DocumentController);
    service = module.get(DocumentsService);
  });

  // ---------------- HTTP ROUTES ----------------

  describe('GET /documents', () => {
    it('calls service.findAll with req.user', async () => {
      const docs = [{ id: 'a' }];
      (service.findAll as jest.Mock).mockResolvedValue(docs);

      const result = await controller.findAll({ user: adminUser });
      expect(service.findAll).toHaveBeenCalledWith(adminUser);
      expect(result).toBe(docs);
    });
  });

  describe('GET /documents/:id', () => {
    it('returns document by id via service', async () => {
      const doc = { id: 'd1' };
      (service.findById as jest.Mock).mockResolvedValue(doc);

      const result = await controller.findById('d1', { user: normalUser });
      expect(service.findById).toHaveBeenCalledWith('d1', normalUser);
      expect(result).toBe(doc);
    });
  });

  describe('POST /documents', () => {
    it('creates document with dto, file and user', async () => {
      const dto: any = { title: 'T' };
      const file: any = { originalname: 'x.txt', buffer: Buffer.from('a') };
      const created = { id: 'new' };
      (service.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(dto, file, { user: normalUser });
      expect(service.create).toHaveBeenCalledWith(dto, file, normalUser);
      expect(result).toBe(created);
    });
  });

  describe('PUT /documents/:id', () => {
    it('updates doc via service.update', async () => {
      const dto: any = { title: 'New' };
      const updated = { id: 'd1', title: 'New' };
      (service.update as jest.Mock).mockResolvedValue(updated);

      const result = await controller.update('d1', dto, { user: normalUser });
      expect(service.update).toHaveBeenCalledWith('d1', dto, normalUser);
      expect(result).toBe(updated);
    });
  });

  describe('DELETE /documents/:id', () => {
    it('removes the document and returns message', async () => {
      (service.remove as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.delete('d1', { user: normalUser });
      expect(service.remove).toHaveBeenCalledWith('d1', normalUser);
      expect(result).toEqual({ message: 'Document deleted successfully' });
    });
  });

  describe('GET /documents/:id/download', () => {
    const makeRes = () => {
      const headers: Record<string, string> = {};
      return {
        setHeader: jest.fn((k: string, v: string) => (headers[k] = v)),
        // emulate express Response so .pipe(res) is accepted:
        // we only need a marker that pipe was called
        ended: false,
        end: jest.fn(function (this: any) { this.ended = true; }),
      } as unknown as Response & { ended: boolean };
    };

    it('streams the file when present', async () => {
      const res = makeRes();
      const doc = {
        id: 'd1',
        filePath: '/tmp/file.bin',
        originalName: 'orig.bin',
        mimeType: 'application/octet-stream',
      };
      (service.findById as jest.Mock).mockResolvedValue(doc);
      fsAccessMock.mockResolvedValue(undefined);

      // mock createReadStream().pipe(res)
      const fakeReadable = { pipe: jest.fn((target) => { (target as any).end(); }) } as any;
      (createReadStream as jest.Mock).mockReturnValue(fakeReadable);

      await controller.download('d1', { user: normalUser }, res);

      expect(service.findById).toHaveBeenCalledWith('d1', normalUser);
      expect(fsAccessMock).toHaveBeenCalledWith('/tmp/file.bin');
      expect(createReadStream).toHaveBeenCalledWith('/tmp/file.bin');
      expect(fakeReadable.pipe).toHaveBeenCalledWith(res);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="orig.bin"',
      );
      expect((res as any).ended).toBe(true);
    });

    it('throws NotFound if filePath missing', async () => {
      (service.findById as jest.Mock).mockResolvedValue({ id: 'd1', filePath: null });
      const res = makeRes();
      await expect(controller.download('d1', { user: normalUser }, res)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFound if file missing on disk', async () => {
      (service.findById as jest.Mock).mockResolvedValue({ id: 'd1', filePath: '/tmp/miss' });
      fsAccessMock.mockRejectedValue(new Error('nope'));
      const res = makeRes();
      await expect(controller.download('d1', { user: normalUser }, res)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('POST /documents/bulk/find', () => {
    it('finds by ids via service', async () => {
      const ids = ['a', 'b'];
      const docs = [{ id: 'a' }, { id: 'b' }];
      (service.findByIds as jest.Mock).mockResolvedValue(docs);

      const result = await controller.findByIds(ids);
      expect(service.findByIds).toHaveBeenCalledWith(ids);
      expect(result).toBe(docs);
    });
  });

  describe('PATCH /documents/ingested', () => {
    it('marks as ingested via service', async () => {
      const ids = ['x', 'y'];
      (service.markAsIngested as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.markAsIngested(ids);
      expect(service.markAsIngested).toHaveBeenCalledWith(ids);
      expect(result).toEqual({ message: 'Marked as ingested' });
    });
  });

  // ---------------- TCP MESSAGE HANDLERS ----------------

  describe('TCP: get_document_by_id', () => {
    it('delegates to service.findById', async () => {
      const doc = { id: 'd' };
      (service.findById as jest.Mock).mockResolvedValue(doc);
      const result = await controller.findByIdTCP({ id: 'd', user: normalUser });
      expect(service.findById).toHaveBeenCalledWith('d', normalUser);
      expect(result).toBe(doc);
    });
  });

  describe('TCP: create_document', () => {
    it('delegates to service.create', async () => {
      const dto: any = { title: 'T' };
      const file: any = { originalname: 'f.txt' };
      const created = { id: 'new' };
      (service.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.createTCP({ dto, user: normalUser, file });
      expect(service.create).toHaveBeenCalledWith(dto, file, normalUser);
      expect(result).toBe(created);
    });
  });

  describe('TCP: get_all_document', () => {
    it('delegates to service.findAll', async () => {
      const docs = [{ id: '1' }];
      (service.findAll as jest.Mock).mockResolvedValue(docs);
      const result = await controller.findAllTCP({ user: adminUser });
      expect(service.findAll).toHaveBeenCalledWith(adminUser);
      expect(result).toBe(docs);
    });
  });

  describe('TCP: update_document', () => {
    it('delegates to service.update', async () => {
      const updated = { id: 'd1', title: 'N' };
      (service.update as jest.Mock).mockResolvedValue(updated);
      const result = await controller.updateTCP({ id: 'd1', dto: { title: 'N' } as any, user: normalUser });
      expect(service.update).toHaveBeenCalledWith('d1', { title: 'N' }, normalUser);
      expect(result).toBe(updated);
    });
  });

  describe('TCP: delete_document', () => {
    it('delegates to service.remove and returns message', async () => {
      (service.remove as jest.Mock).mockResolvedValue(undefined);
      const result = await controller.deleteTCP({ id: 'd1', user: normalUser });
      expect(service.remove).toHaveBeenCalledWith('d1', normalUser);
      expect(result).toEqual({ message: 'Document deleted successfully' });
    });
  });

  describe('TCP: download_documents_by_id', () => {
    it('returns base64 payload when file exists', async () => {
      const doc = {
        id: 'd1',
        filePath: '/tmp/f.bin',
        originalName: 'orig.bin',
        mimeType: 'application/octet-stream',
      };
      (service.findById as jest.Mock).mockResolvedValue(doc);
      fsReadFileMock.mockResolvedValue(Buffer.from('abc'));

      const result = await controller.downloadDocumentByIdTCP({ id: 'd1', user: normalUser });

      expect(service.findById).toHaveBeenCalledWith('d1', normalUser);
      expect(fsReadFileMock).toHaveBeenCalledWith('/tmp/f.bin');
      expect(result).toEqual({
        filename: 'orig.bin',
        mimeType: 'application/octet-stream',
        size: 3,
        dataB64: Buffer.from('abc').toString('base64'),
      });
    });

    it('throws NotFound when filePath missing', async () => {
      (service.findById as jest.Mock).mockResolvedValue({ id: 'd1', filePath: null });
      await expect(controller.downloadDocumentByIdTCP({ id: 'd1', user: normalUser }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFound when readFile fails', async () => {
      (service.findById as jest.Mock).mockResolvedValue({ id: 'd1', filePath: '/tmp/missing' });
      fsReadFileMock.mockRejectedValue(new Error('nope'));
      await expect(controller.downloadDocumentByIdTCP({ id: 'd1', user: normalUser }))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('TCP: find_documents_by_ids', () => {
    it('delegates to service.findByIds', async () => {
      const ids = ['a', 'b'];
      const docs = [{ id: 'a' }, { id: 'b' }];
      (service.findByIds as jest.Mock).mockResolvedValue(docs);
      const result = await controller.findByIdsTCP({ ids });
      expect(service.findByIds).toHaveBeenCalledWith(ids);
      expect(result).toBe(docs);
    });
  });

  describe('TCP: mark_documents_ingested', () => {
    it('delegates to service.markAsIngested', async () => {
      const ids = ['x'];
      (service.markAsIngested as jest.Mock).mockResolvedValue(undefined);
      const result = await controller.markAsIngestedTCP({ ids });
      expect(service.markAsIngested).toHaveBeenCalledWith(ids);
      expect(result).toEqual({ message: 'Marked as ingested' });
    });
  });
});
