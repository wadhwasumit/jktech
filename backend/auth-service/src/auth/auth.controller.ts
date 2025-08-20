import { Body, Controller, Get, Post, Req, UseGuards, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Request } from 'express';
@Controller('auth')
export class AuthController {
  constructor(private configService: ConfigService, private authService: AuthService) {}

  getOriginUrl(req: Request, origin?: string) {
    if (origin) return origin; // when browser sends Origin (CORS / non-GET, etc.)

    // prefer forwarded headers when behind a proxy/load balancer
    const xfProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0];
    const xfHost  = (req.headers['x-forwarded-host']  as string)?.split(',')[0];

    const proto = xfProto || req.protocol || (req.socket as any).encrypted ? 'https' : 'http';
    const host  = xfHost  || req.get('host');

    return `${proto}://${host}`;
  }
  
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthCallback(@Req() req) {
    console.log('inside callbackurl', req.user);
    const token = this.authService.generateToken(req.user);
    console.log('JWT_SECRET:', this.configService.get<string>('JWT_SECRET'));
    return { access_token: token };
  }

  @Post('google')
  async googleLogin(@Req() req: any, @Headers('origin') originHeader: string,@Body('code') code: string) {
    const origin=this.getOriginUrl(req,originHeader);
    return this.authService.getGoogleAuthToken(code,origin);
  }

  @MessagePattern({ cmd: 'get_auth_token' })
  googleLoginTCP(data: any) {
    console.log('data from tcp is: ', data)
    return this.authService.getGoogleAuthToken(data.code,data.origin);

  }

}
