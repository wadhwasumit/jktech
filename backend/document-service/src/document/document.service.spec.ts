import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DocumentsService } from './document.service';
import { Document } from '../entities/document.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';

let mkdirSpy: jest.SpyInstance;
let writeFileSpy: jest.SpyInstance;

beforeEach(() => {
  mkdirSpy = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined as any);
  writeFileSpy = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined as any);
  jest.spyOn(console, 'log').mockImplementation(() => {}); // optional: silence logs
});

afterEach(() => {
  mkdirSpy.mockRestore();
  writeFileSpy.mockRestore();
  jest.restoreAllMocks();
});


// (optional) quiet the console chatter from the service
jest.spyOn(console, 'log').mockImplementation(() => {});

// Helper to build a mock TypeORM repository
type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepo = <T = any>(): MockRepo<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  findByIds: jest.fn(), // TypeORM v0.3 removed this; your service calls it, so we mock it here
  findBy: jest.fn(),
});

describe('DocumentsService', () => {
  let service: DocumentsService;
  let repo: MockRepo<Document>;

  const adminUser: User = { id: 'admin-1', role: UserRole.ADMIN } as any;
  const normalUser: User = { id: 'user-1', role: UserRole.VIEWER } as any;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useValue: createMockRepo<Document>(),
        },
      ],
    }).compile();

    service = module.get(DocumentsService);
    repo = module.get(getRepositoryToken(Document));
    // Create spies AFTER module creation (and after any clear/reset)
    mkdirSpy = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined as any);
    writeFileSpy = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined as any);

  });

  afterEach(() => {
    mkdirSpy.mockRestore();
    writeFileSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('writes file and saves the document', async () => {
      const dto = { title: 'My Doc', description: 'desc' } as any;
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'note.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 3,
        buffer: Buffer.from('abc'),
        destination: '', filename: '', path: '', stream: undefined as any,
      };

      const createdDoc: Partial<Document> = {
        id: 'doc-1',
        ...dto,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: normalUser.id,
      };
      (repo.create as jest.Mock).mockReturnValue(createdDoc);
      (repo.save as jest.Mock).mockResolvedValue(createdDoc);

      const result = await service.create(dto, file, normalUser);

      // mkdir + writeFile assertions (NOTE: use the *spies*, not *_Mock)
      expect(mkdirSpy).toHaveBeenCalledWith(expect.stringContaining('uploads'), { recursive: true });

      expect(writeFileSpy).toHaveBeenCalledTimes(1);
      const [writtenPath, writtenContents] = writeFileSpy.mock.calls[0];
      expect(String(writtenPath)).toEqual(expect.stringContaining('uploads'));
      expect(writtenContents).toBe(Buffer.from('abc').toString('base64'));

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My Doc',
          description: 'desc',
          originalName: 'note.txt',
          mimeType: 'text/plain',
          size: 3,
          uploadedById: 'user-1',
          filename: expect.any(String),
          filePath: expect.any(String),
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(createdDoc);
      expect(result).toEqual(createdDoc);
    });
  });

  describe('findAll', () => {
    it('returns all documents for admin', async () => {
      const docs = [{ id: '1' }, { id: '2' }] as any;
      (repo.find as jest.Mock).mockResolvedValue(docs);

      const result = await service.findAll(adminUser);
      expect(repo.find).toHaveBeenCalledWith();
      expect(result).toBe(docs);
    });

    it('returns only user documents for non-admin', async () => {
      const docs = [{ id: '3', uploadedById: 'user-1' }] as any;
      (repo.find as jest.Mock).mockResolvedValue(docs);

      const result = await service.findAll(normalUser);
      expect(repo.find).toHaveBeenCalledWith({ where: { uploadedById: 'user-1' } });
      expect(result).toBe(docs);
    });
  });

  describe('findById', () => {
    it('returns the document when user has access', async () => {
      const doc = { id: 'd1', uploadedById: 'user-1' } as any;
      (repo.findOne as jest.Mock).mockResolvedValue(doc);

      const result = await service.findById('d1', normalUser);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'd1' } });
      expect(result).toBe(doc);
    });

    it('throws NotFound if not exists', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findById('missing', normalUser)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden if user is not owner and not admin', async () => {
      const doc = { id: 'd1', uploadedById: 'other-user' } as any;
      (repo.findOne as jest.Mock).mockResolvedValue(doc);
      await expect(service.findById('d1', normalUser)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('update', () => {
    it('updates document when permitted', async () => {
      const existing = { id: 'd1', uploadedById: 'user-1', title: 'Old' } as any;
      const updated = { ...existing, title: 'New' } as any;

      // Spy findById to isolate update path (avoids re-testing permissions here)
      const findByIdSpy = jest.spyOn(service, 'findById').mockResolvedValue(existing);
      (repo.save as jest.Mock).mockResolvedValue(updated);

      const dto = { title: 'New' } as any;
      const result = await service.update('d1', dto, normalUser);

      expect(findByIdSpy).toHaveBeenCalledWith('d1', normalUser);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'd1', title: 'New' }));
      expect(result).toEqual(updated);
    });

    it('throws Forbidden when user cannot update', async () => {
      const notOwned = { id: 'd1', uploadedById: 'other' } as any;
      jest.spyOn(service, 'findById').mockResolvedValue(notOwned);
      await expect(service.update('d1', { title: 'x' } as any, normalUser)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('removes when permitted', async () => {
      const doc = { id: 'd1', uploadedById: 'user-1' } as any;
      jest.spyOn(service, 'findById').mockResolvedValue(doc);
      (repo.remove as jest.Mock).mockResolvedValue(undefined);

      await service.remove('d1', normalUser);
      expect(repo.remove).toHaveBeenCalledWith(doc);
    });

    it('throws Forbidden when not permitted', async () => {
      const doc = { id: 'd1', uploadedById: 'other' } as any;
      jest.spyOn(service, 'findById').mockResolvedValue(doc);
      await expect(service.remove('d1', normalUser)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('findByIds', () => {
    it('delegates to repository.findByIds', async () => {
      const ids = ['a', 'b'];
      const docs = [{ id: 'a' }, { id: 'b' }] as any;
      (repo.findBy as jest.Mock).mockResolvedValue(docs);
      const result = await service.findByIds(ids);
      expect(repo.findBy).toHaveBeenCalledTimes(1);
      const arg = (repo.findBy as jest.Mock).mock.calls[0][0];
      expect(arg).toEqual(expect.objectContaining({ id: expect.any(Object) }));
      if (arg.id && 'value' in arg.id) {
        expect(arg.id.value).toEqual(ids);
      }
      expect(result).toBe(docs);
    });
  });

  describe('markAsIngested', () => {
    it('updates isIngested for all ids using In(ids)', async () => {
      const ids = ['x', 'y'];
      (repo.update as jest.Mock).mockResolvedValue(undefined);

      await service.markAsIngested(ids);

      expect(repo.update).toHaveBeenCalledTimes(1);
      const [whereArg, updateArg] = (repo.update as jest.Mock).mock.calls[0];

      // Check second arg
      expect(updateArg).toEqual({ isIngested: true });

      // Check the FindOperator(In) value contains our ids
      // (TypeORM's In(...) returns a FindOperator with a private shape; we assert the value)
      // @ts-ignore
      expect(whereArg.id.value).toEqual(ids);
    });
  });
});
