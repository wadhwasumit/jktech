import {  Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from './user-role.enum';
import { UsersService } from './user.service';
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService, private configService: ConfigService,  private prisma: PrismaService,private userService:UsersService) {}

  async validateOAuthLogin(profile: any): Promise<string> {
    const payload = { id: profile.id, email: profile.email };
    return this.jwtService.sign(payload);
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  generateToken(user: any) {
    return this.jwtService.sign(user);
  }
  // Helper that handles proxies/CDNs too
  
  async getGoogleAuthToken(code: string,origion:string) {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = origion+'/auth/callback'; // this.configService.get('GOOGLE_CALLBACK_URL');

    const { data } = await axios.post(tokenUrl, {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    if (!data.id_token) {
      throw new UnauthorizedException('Invalid token');
    }
    console.log('JWT secret = ',this.configService.get('JWT_SECRET'),': data is: ', JSON.stringify(data));

    let user = await this.getUserProfile(data.access_token)
    console.log('user', user);
    if(user) {
      user = await this.handelUserCreation(user)
    }

    const jwtToken = this.generateToken({ sub: data.id_token, ...user});

    return { access_token: jwtToken, id: user.id , role: user.role || UserRole.VIEWER };
  }

  async getUserProfile(accessToken: string): Promise<any> {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return data;
  }

  async handelUserCreation(profile: any) {
    const { id, email, name, picture } = profile;

    console.log('before orisma db select')
    let user = await this.prisma.user.findUnique({
      where: { googleId: id },
    });

    console.log('after orisma db select', user)

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId: id,
          email: email,
          name: name,
          image: picture,
          role: UserRole.VIEWER, // default role
        },
      });
      console.log('inside prisma db select', user)

    }
    return user;
  }
}
