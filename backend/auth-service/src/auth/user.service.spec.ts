import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './user.service';                 // <-- adjust if filename differs
import { PrismaService } from '../../prisma/prisma.service';    // <-- adjust path
import { UserRole } from './user-role.enum';

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('returns users ordered by createdAt desc', async () => {
      const users = [{ id: '1' }, { id: '2' }];
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue(users);

      const result = await service.findAll();

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toBe(users);
    });
  });

  describe('findById', () => {
    it('returns a user by id', async () => {
      const user = { id: 'u1' };
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await service.findById('u1');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
      });
      expect(result).toBe(user);
    });
  });

  describe('create', () => {
    it('upserts a user using googleId and returns it', async () => {
      const profile = {
        id: 'google-123',
        email: 'user@example.com',
        name: 'User Name',
        picture: 'http://pic',
      };

      const created = {
        id: 'db-id',
        googleId: 'google-123',
        email: 'user@example.com',
        name: 'User Name',
        image: 'http://pic',
        role: UserRole.VIEWER,
      };

      (prismaMock.user.upsert as jest.Mock).mockResolvedValue(created);

      const result = await service.create(profile);

      expect(prismaMock.user.upsert).toHaveBeenCalledWith({
        where: { googleId: 'google-123' },
        update: {
          email: 'user@example.com',
          name: 'User Name',
          image: 'http://pic',
        },
        create: {
          googleId: 'google-123',
          email: 'user@example.com',
          name: 'User Name',
          image: 'http://pic',
          role: UserRole.VIEWER,
        },
      });
      expect(result).toBe(created);
    });

    it('handles optional picture field', async () => {
      const profile = {
        id: 'google-456',
        email: 'p@example.com',
        name: 'P Name',
        // picture omitted
      };

      const created = {
        id: 'db-id-2',
        googleId: 'google-456',
        email: 'p@example.com',
        name: 'P Name',
        image: undefined,
        role: UserRole.VIEWER,
      };

      (prismaMock.user.upsert as jest.Mock).mockResolvedValue(created);

      const result = await service.create(profile as any);

      expect(prismaMock.user.upsert).toHaveBeenCalledWith({
        where: { googleId: 'google-456' },
        update: {
          email: 'p@example.com',
          name: 'P Name',
          image: undefined,
        },
        create: {
          googleId: 'google-456',
          email: 'p@example.com',
          name: 'P Name',
          image: undefined,
          role: UserRole.VIEWER,
        },
      });
      expect(result).toBe(created);
    });
  });

  describe('updateRole', () => {
    it('updates role when user exists', async () => {
      // findById -> prisma.user.findUnique
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        role: UserRole.VIEWER,
      });

      const updated = { id: 'u1', role: UserRole.EDITOR };
      (prismaMock.user.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.updateRole('u1', UserRole.EDITOR);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { role: UserRole.EDITOR },
      });
      expect(result).toBe(updated);
    });

    it('throws NotFoundException when user is missing', async () => {
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateRole('missing', UserRole.EDITOR))
        .rejects
        .toBeInstanceOf(NotFoundException);

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes and returns true when user exists', async () => {
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' });
      (prismaMock.user.delete as jest.Mock).mockResolvedValue({ id: 'u1' });

      const result = await service.remove('u1');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
      });
      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: 'u1' },
      });
      expect(result).toBe(true);
    });

    it('throws NotFoundException when user does not exist', async () => {
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('nope'))
        .rejects
        .toBeInstanceOf(NotFoundException);

      expect(prismaMock.user.delete).not.toHaveBeenCalled();
    });
  });
});
