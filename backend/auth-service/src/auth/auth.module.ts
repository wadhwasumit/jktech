import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from './user.service';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  controllers: [AuthController,UsersController],
  providers: [AuthService, UsersService, GoogleStrategy, JwtStrategy, ConfigService, PrismaService],
  exports: [JwtModule]
})
export class AuthModule { }
