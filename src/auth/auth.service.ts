import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import ms from 'ms';
import { Response } from 'express';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { TokenPayload } from './token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  login(user: User, response: Response) {
    const expiresIn = ms(this.configService.getOrThrow('JWT_EXPIRATION'));

    if (typeof expiresIn !== 'number') {
      throw new Error('Invalid JWT_EXPIRATION format');
    }

    const expires = new Date();
    expires.setMilliseconds(expires.getMilliseconds() + expiresIn);

    const tokenPayload: TokenPayload = {
      userId: user.id,
    };
    const token = this.jwtService.sign(tokenPayload);

    response.cookie('Authentication', token, {
      secure: true,
      httpOnly: true,
      expires,
    });
    return { tokenPayload };
  }

  async verifyUser(email: string, password: string) {
    try {
      const user = await this.userService.getUser({ email });

      const authenticated = await bcrypt.compare(password, user.password);

      if (!authenticated) {
        throw new UnauthorizedException('Credentials are not valid.');
      }
      return user;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Credentials are not valid.');
    }
  }

  verifyToken(jwt: string) {
    this.jwtService.verify(jwt);
  }
}
