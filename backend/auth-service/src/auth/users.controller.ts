import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UsersService } from './user.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (admin only)' })
  findAllUsers() {
    return this.usersService.findAll();
  }
  @Get(':id')
  @ApiOperation({ summary: 'List users (admin only)' })
  findUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
//   @Post()
//   @ApiOperation({ summary: 'Create user (admin only)' })
//   create(@Body() dto: CreateUserDto) {
//     return this.usersService.create(dto);
//   }

  @Patch(':id/role')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Update user role (admin only)' })
  updateRoleUser(@Param('id') id: string, @Body() role: string) {
    return this.usersService.updateRole(id, role);
  }

  @Delete(':id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Delete user (admin only)' })
  removeUser(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @MessagePattern({ cmd: 'get_all_users' })
  findAllUsersTcp() {
    return this.usersService.findAll();
  }

 @MessagePattern({ cmd: 'get_user_by_id' })
  findUserByIdTcp(data: any) {
    return this.usersService.findById(data.id);
  }

  @MessagePattern({ cmd: 'update_user_role' })
  updateUserRoleTcp(roleData: { id: string; role: string }) {
    console.log('Updating user role via TCP:', roleData);
    return this.usersService.updateRole(roleData.id, roleData.role);
  }

  @MessagePattern({ cmd: 'remove_user' })
  removeUserTcp(data: any) {
    return this.usersService.remove(data.id);
  }
}
