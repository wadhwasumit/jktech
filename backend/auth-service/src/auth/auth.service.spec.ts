import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';      // <-- adjust path if different
import { UsersService } from './user.service';                    // <-- adjust path if different
import { UserRole } from './user-role.enum';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthService', () => {
  let service: AuthService;

  // ---- Mocks ----
  const jwtServiceMock = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((key: string) => {
      const map: Record<string, any> = {
        GOOGLE_CLIENT_ID: 'test-google-client-id',
        GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
        JWT_SECRET: 'test-secret',
      };
      return map[key];
    }),
  };

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  // You’re not using UsersService inside AuthService right now, but DI requires a provider
  const usersServiceMock = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockReset();
    mockedAxios.get.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: UsersService, useValue: usersServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('validateOAuthLogin: returns a JWT', async () => {
    jwtServiceMock.sign.mockReturnValue('signed.jwt.token');

    const token = await service.validateOAuthLogin({ id: 'gid', email: 'a@b.com' });

    expect(jwtServiceMock.sign).toHaveBeenCalledWith({ id: 'gid', email: 'a@b.com' });
    expect(token).toBe('signed.jwt.token');
  });

  it('generateToken: signs a payload', () => {
    jwtServiceMock.sign.mockReturnValue('signed.jwt.token');

    const token = service.generateToken({ sub: 'u1' });

    expect(jwtServiceMock.sign).toHaveBeenCalledWith({ sub: 'u1' });
    expect(token).toBe('signed.jwt.token');
  });

  it('validateToken: returns payload when valid', async () => {
    const payload = { sub: 'u1' };
    jwtServiceMock.verify.mockReturnValue(payload);

    const result = await service.validateToken('good');

    expect(jwtServiceMock.verify).toHaveBeenCalledWith('good');
    expect(result).toEqual(payload);
  });

  it('validateToken: throws UnauthorizedException when invalid', async () => {
    jwtServiceMock.verify.mockImplementation(() => {
      throw new Error('bad');
    });

    await expect(service.validateToken('bad')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('getGoogleAuthToken: exchanges code, creates user if missing, returns app JWT', async () => {
    // 1) Google token exchange => id_token present
    mockedAxios.post.mockResolvedValue({
      data: {
        access_token: 'google-access',
        id_token: 'google-id-token',
      },
    });

    // 2) Google profile fetch
    mockedAxios.get.mockResolvedValue({
      data: {
        id: 'gid-123',
        email: 'user@example.com',
        name: 'User Name',
        picture: 'http://pic',
      },
    });

    // 3) DB: user not found, create
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaMock.user.create as jest.Mock).mockResolvedValue({
      id: 'db-user-id',
      googleId: 'gid-123',
      email: 'user@example.com',
      name: 'User Name',
      image: 'http://pic',
      role: UserRole.VIEWER,
    });

    // 4) App JWT
    jwtServiceMock.sign.mockReturnValue('app.jwt.token');
    const ORIGIN = 'http://localhost';
    const result = await service.getGoogleAuthToken('the-auth-code',ORIGIN);

    // Assert token POST
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      {
        code: 'the-auth-code',
        client_id: 'test-google-client-id',
        client_secret: 'test-google-client-secret',
        redirect_uri: 'http://localhost/auth/callback',
        grant_type: 'authorization_code',
      },
    );

    // Assert profile GET
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: 'Bearer google-access' } },
    );

    // Assert Prisma calls
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { googleId: 'gid-123' },
    });
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        googleId: 'gid-123',
        email: 'user@example.com',
        name: 'User Name',
        image: 'http://pic',
        role: UserRole.VIEWER,
      },
    });

    // Assert final JWT generation and response
    expect(jwtServiceMock.sign).toHaveBeenCalledWith({
      sub: 'google-id-token',
      id: 'db-user-id',
      googleId: 'gid-123',
      email: 'user@example.com',
      name: 'User Name',
      image: 'http://pic',
      role: UserRole.VIEWER,
    });

    expect(result).toEqual({
      access_token: 'app.jwt.token',
      id: 'db-user-id',
      role: UserRole.VIEWER,
    });
  });

  it('getGoogleAuthToken: throws UnauthorizedException when id_token is missing', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        access_token: 'google-access',
        // id_token missing
      },
    });
    const ORIGIN = 'http://localhost';
    await expect(service.getGoogleAuthToken('code',ORIGIN)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('handelUserCreation: returns existing user if found', async () => {
    const existing = { id: 'u1', googleId: 'gid', role: UserRole.EDITOR };
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(existing);

    const result = await service.handelUserCreation({
      id: 'gid',
      email: 'e@x',
      name: 'N',
      picture: 'P',
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { googleId: 'gid' } });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(result).toBe(existing);
  });

  it('handelUserCreation: creates user if not found', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaMock.user.create as jest.Mock).mockResolvedValue({
      id: 'u2',
      googleId: 'gid',
      email: 'e@x',
      name: 'N',
      image: 'P',
      role: UserRole.VIEWER,
    });

    const result = await service.handelUserCreation({
      id: 'gid',
      email: 'e@x',
      name: 'N',
      picture: 'P',
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        googleId: 'gid',
        email: 'e@x',
        name: 'N',
        image: 'P',
        role: UserRole.VIEWER,
      },
    });

    expect(result).toEqual({
      id: 'u2',
      googleId: 'gid',
      email: 'e@x',
      name: 'N',
      image: 'P',
      role: UserRole.VIEWER,
    });
  });
});
