import { INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
const request = require('supertest'); // <-- avoids esModuleInterop hassle

// Adjust paths to match your project layout
import { AuthController } from '../src/auth/auth.controller';
import { UsersController } from '../src/auth/users.controller';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/auth/user.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

// Build a concrete guard class for 'google' (the mixin result)
const GoogleGuard = AuthGuard('google');

const authServiceMock = {
  getGoogleAuthToken: jest.fn(),
  generateToken: jest.fn(),
};

const usersServiceMock = {
  findAll: jest.fn(),
  findById: jest.fn(),
  updateRole: jest.fn(),
  remove: jest.fn(),
};

const configServiceMock = {
  get: jest.fn(),
};

@Module({
  controllers: [AuthController, UsersController],
  providers: [
    { provide: AuthService, useValue: authServiceMock },
    { provide: UsersService, useValue: usersServiceMock },
    { provide: ConfigService, useValue: configServiceMock },
  ],
})
class TestAuthModule {}

describe('Auth & Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [TestAuthModule],
    })
      // Override the Google passport guard so routes are reachable
      .overrideGuard(GoogleGuard)
      .useValue({
        canActivate: (ctx) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { id: 'u1', email: 'admin@example.com', name: 'Admin' };
          return true;
        },
      })
      .compile();

    app = modRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  // ---------- AUTH ----------

  it('GET /auth/google → guard lets request through', async () => {
    await request(app.getHttpServer())
      .get('/auth/google')
      .expect(200);
  });

  it('GET /auth/google/callback → returns token from generateToken(req.user)', async () => {
    configServiceMock.get.mockReturnValue('test-secret');
    authServiceMock.generateToken.mockReturnValue('jwt-token-123');

    await request(app.getHttpServer())
      .get('/auth/google/callback')
      .expect(200)
      .expect({ access_token: 'jwt-token-123' });

    expect(authServiceMock.generateToken).toHaveBeenCalledWith({
      id: 'u1',
      email: 'admin@example.com',
      name: 'Admin',
    });
    expect(configServiceMock.get).toHaveBeenCalledWith('JWT_SECRET');
  });

  it('POST /auth/google → calls getGoogleAuthToken(code)', async () => {
    const body = { code: 'google-auth-code' };
    const result = { access_token: 'jwt-from-google', id_token: 'idtoken-xyz', expires_in: 3600 };
    authServiceMock.getGoogleAuthToken.mockResolvedValue(result);

    await request(app.getHttpServer())
      .post('/auth/google')
      .set('Origin', 'http://localhost')   
      .send(body)
      .expect((res) => expect([200, 201]).toContain(res.status))
      .expect(result);

    expect(authServiceMock.getGoogleAuthToken).toHaveBeenCalledWith('google-auth-code', 'http://localhost');
  });

  // ---------- USERS ----------

  it('GET /users → returns all users', async () => {
    const users = [
      { id: 'u1', email: 'admin@example.com', role: 'ADMIN' },
      { id: 'u2', email: 'viewer@example.com', role: 'VIEWER' },
    ];
    usersServiceMock.findAll.mockResolvedValue(users);

    await request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect(users);

    expect(usersServiceMock.findAll).toHaveBeenCalled();
  });

  it('GET /users/:id → returns a user by id', async () => {
    const user = { id: 'u2', email: 'viewer@example.com', role: 'VIEWER' };
    usersServiceMock.findById.mockResolvedValue(user);

    await request(app.getHttpServer())
      .get('/users/u2')
      .expect(200)
      .expect(user);

    expect(usersServiceMock.findById).toHaveBeenCalledWith('u2');
  });

  it('PATCH /users/:id/role → updates role (controller expects a JSON string body)', async () => {
    usersServiceMock.updateRole.mockResolvedValue({ updated: true });

    await request(app.getHttpServer())
      .patch('/users/u3/role')
      .set('Content-Type', 'application/json')
      .send({ role: 'EDITOR' }) // because @Body() role: string
      .expect(200)
      .expect({ updated: true });

    expect(usersServiceMock.updateRole).toHaveBeenCalledWith('u3',  { role: 'EDITOR' });
  });

  it('DELETE /users/:id → removes user', async () => {
    usersServiceMock.remove.mockResolvedValue({ deleted: true });

    await request(app.getHttpServer())
      .delete('/users/u9')
      .expect(200)
      .expect({ deleted: true });

    expect(usersServiceMock.remove).toHaveBeenCalledWith('u9');
  });
});
