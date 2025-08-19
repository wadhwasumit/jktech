import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';          // <- adjust if filename differs
import { UsersService } from './user.service';                 // <- adjust path

describe('UsersController', () => {
  let controller: UsersController;

  const usersServiceMock = {
    findAll: jest.fn(),
    findById: jest.fn(),
    updateRole: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --------------- HTTP handlers ---------------

  it('GET /users -> findAllUsers: returns users', async () => {
    const users = [{ id: '1' }, { id: '2' }];
    usersServiceMock.findAll.mockResolvedValue(users);

    const result = await controller.findAllUsers();

    expect(usersServiceMock.findAll).toHaveBeenCalledTimes(1);
    expect(result).toBe(users);
  });

  it('GET /users/:id -> findUserById: returns a user', async () => {
    const user = { id: 'u1' };
    usersServiceMock.findById.mockResolvedValue(user);

    const result = await controller.findUserById('u1');

    expect(usersServiceMock.findById).toHaveBeenCalledWith('u1');
    expect(result).toBe(user);
  });

  it('PATCH /users/:id/role -> updateRoleUser: updates role and returns updated user', async () => {
    const updated = { id: 'u1', role: 'editor' };
    usersServiceMock.updateRole.mockResolvedValue(updated);

    // Controller signature currently expects the raw string body for role.
    const result = await controller.updateRoleUser('u1', 'editor' as any);

    expect(usersServiceMock.updateRole).toHaveBeenCalledWith('u1', 'editor');
    expect(result).toBe(updated);
  });

  it('DELETE /users/:id -> removeUser: deletes and returns true', async () => {
    usersServiceMock.remove.mockResolvedValue(true);

    const result = await controller.removeUser('u1');

    expect(usersServiceMock.remove).toHaveBeenCalledWith('u1');
    expect(result).toBe(true);
  });

  it('DELETE /users/:id -> removeUser: bubbles NotFoundException', async () => {
    usersServiceMock.remove.mockRejectedValue(new NotFoundException('User not found'));

    await expect(controller.removeUser('missing'))
      .rejects
      .toBeInstanceOf(NotFoundException);

    expect(usersServiceMock.remove).toHaveBeenCalledWith('missing');
  });

  // --------------- TCP handlers (MessagePattern) ---------------

  it('@MessagePattern(get_all_users) -> findAllUsersTcp: returns users', async () => {
    const users = [{ id: '1' }];
    usersServiceMock.findAll.mockResolvedValue(users);

    const result = await controller.findAllUsersTcp();

    expect(usersServiceMock.findAll).toHaveBeenCalledTimes(1);
    expect(result).toBe(users);
  });

  it('@MessagePattern(get_user_by_id) -> findUserByIdTcp: returns user', async () => {
    const user = { id: 'u1' };
    usersServiceMock.findById.mockResolvedValue(user);

    const result = await controller.findUserByIdTcp({ id: 'u1' });

    expect(usersServiceMock.findById).toHaveBeenCalledWith('u1');
    expect(result).toBe(user);
  });

  it('@MessagePattern(update_user_role) -> updateUserRoleTcp: updates role', async () => {
    const updated = { id: 'u1', role: 'admin' };
    usersServiceMock.updateRole.mockResolvedValue(updated);

    const result = await controller.updateUserRoleTcp({ id: 'u1', role: 'admin' });

    expect(usersServiceMock.updateRole).toHaveBeenCalledWith('u1', 'admin');
    expect(result).toBe(updated);
  });

  it('@MessagePattern(remove_user) -> removeUserTcp: removes user', async () => {
    usersServiceMock.remove.mockResolvedValue(true);

    const result = await controller.removeUserTcp({ id: 'u1' });

    expect(usersServiceMock.remove).toHaveBeenCalledWith('u1');
    expect(result).toBe(true);
  });
});
