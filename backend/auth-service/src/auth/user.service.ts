import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from './user-role.enum';

type GoogleProfile = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // NOTE: here `id` is the Google id; rename to findByGoogleId if you prefer.
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id: id },
    });
  }

  async create(profile: GoogleProfile) {
    const { id, email, name, picture } = profile;

    // Upsert avoids race conditions and handles first-time + repeat logins
    const user = await this.prisma.user.upsert({
      where: { googleId: id },
      update: {
        // keep these updated on each login if you want
        email,
        name,
        image: picture,
      },
      create: {
        googleId: id,
        email,
        name,
        image: picture,
        role: UserRole.VIEWER, // default role
      },
    });

    return user;
  }

  async updateRole(id: string, role: string) {
    // id is googleId
    console.log('Updating user role:', id, role);
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: id },
      data: { role }, // ensure your Prisma enum matches values in UserRole
    });
  }

  async remove(id: string): Promise<boolean> {
    // id is googleId
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('User not found');

    await this.prisma.user.delete({
      where: { id: id },
    });
    return true
  }
}
