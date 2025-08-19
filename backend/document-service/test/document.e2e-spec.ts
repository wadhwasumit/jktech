import { INestApplication, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import  request from 'supertest';
import { DocumentController } from '../src/document/document.controller';
import { DocumentsService } from '../src/document/document.service';
import  fs from 'fs';
import  path from 'path';

const documentsServiceMock = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByIds: jest.fn(),
  markAsIngested: jest.fn(),
};

const fakeUser = { id: 'u1', role: 'ADMIN' };

class InjectUserMiddleware {
  use(req: any, _res: any, next: () => void) {
    req.user = fakeUser;
    next();
  }
}

@Module({
  controllers: [DocumentController],
  providers: [{ provide: DocumentsService, useValue: documentsServiceMock }],
})
class TestDocModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(InjectUserMiddleware).forRoutes('*');
  }
}

describe('DocumentController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [TestDocModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /documents → returns list visible to user', async () => {
    const docs = [{ id: 'd1', title: 'A' }];
    documentsServiceMock.findAll.mockResolvedValue(docs);

    await request(app.getHttpServer())
      .get('/documents')
      .expect(200)
      .expect(docs);

    expect(documentsServiceMock.findAll).toHaveBeenCalledWith(fakeUser);
  });

  it('GET /documents/:id → returns a document', async () => {
    const doc = { id: 'd1', title: 'A', filePath: null };
    documentsServiceMock.findById.mockResolvedValue(doc);

    await request(app.getHttpServer())
      .get('/documents/d1')
      .expect(200)
      .expect(doc);

    expect(documentsServiceMock.findById).toHaveBeenCalledWith('d1', fakeUser);
  });

  it('POST /documents (multipart) → creates a document with file', async () => {
    const created = { id: 'new-id', title: 'Project Plan' };
    documentsServiceMock.create.mockResolvedValue(created);

    await request(app.getHttpServer())
      .post('/documents')
      .field('title', 'Project Plan')
      .field('description', 'Initial planning doc')
      .attach('file', Buffer.from('hello world'), 'hello.txt')
      .expect(201)
      .expect(created);

    const [dtoArg, fileArg, userArg] = documentsServiceMock.create.mock.calls[0];
    expect(dtoArg).toMatchObject({ title: 'Project Plan', description: 'Initial planning doc' });
    expect(fileArg).toBeDefined();
    expect(userArg).toEqual(fakeUser);
  });

  it('PUT /documents/:id → updates a document', async () => {
    const updated = { id: 'd1', title: 'Updated' };
    documentsServiceMock.update.mockResolvedValue(updated);

    await request(app.getHttpServer())
      .put('/documents/d1')
      .send({ title: 'Updated' })
      .expect(200)
      .expect(updated);

    expect(documentsServiceMock.update).toHaveBeenCalledWith('d1', { title: 'Updated' }, fakeUser);
  });

  it('DELETE /documents/:id → removes document', async () => {
    documentsServiceMock.remove.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete('/documents/d1')
      .expect(200)
      .expect({ message: 'Document deleted successfully' });

    expect(documentsServiceMock.remove).toHaveBeenCalledWith('d1', fakeUser);
  });

  it('POST /documents/bulk/find → returns documents by ids', async () => {
    const docs = [{ id: 'a' }, { id: 'b' }];
    documentsServiceMock.findByIds.mockResolvedValue(docs);

    await request(app.getHttpServer())
      .post('/documents/bulk/find')
      .send({ ids: ['a', 'b'] })
      .expect(201) // Nest default for POST without @HttpCode is 201
      .expect(docs);

    expect(documentsServiceMock.findByIds).toHaveBeenCalledWith(['a', 'b']);
  });

  it('PATCH /documents/ingested → marks docs as ingested', async () => {
    documentsServiceMock.markAsIngested.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .patch('/documents/ingested')
      .send({ ids: ['a', 'b'] })
      .expect(200)
      .expect({ message: 'Marked as ingested' });

    expect(documentsServiceMock.markAsIngested).toHaveBeenCalledWith(['a', 'b']);
  });

  it('GET /documents/:id/download → streams file with headers', async () => {
    // prepare a temp file
    const tmpDir = fs.mkdtempSync(path.join(fs.realpathSync.native(process.cwd()), 'tmp-'));
    const filePath = path.join(tmpDir, 'f.bin');
    fs.writeFileSync(filePath, Buffer.from('content'));

    documentsServiceMock.findById.mockResolvedValue({
      id: 'd1',
      filePath,
      originalName: 'orig.bin',
      mimeType: 'application/octet-stream',
    });

    const res = await request(app.getHttpServer())
      .get('/documents/d1/download')
      .expect(200);

    // headers
    expect(res.header['content-type']).toBe('application/octet-stream');
    expect(res.header['content-disposition']).toBe('attachment; filename="orig.bin"');
    // body streamed
    expect(res.body).toEqual(Buffer.from('content'));

    // cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
