import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { usuario: loginDto.usuario },
      select: {
        id: true,
        usuario: true,
        grupoId: true,
        clave: true,
        estado: true,
        grupo: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.clave) {
      throw new UnauthorizedException('Usuario sin contraseña configurada');
    }

    const hashedPassword = this.hashPassword(loginDto.password);
    const isPasswordValid = this.safeCompare(hashedPassword, user.clave);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.estado) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const tokens = await this.generateTokens(user.id, user.usuario, user.grupoId ?? 0);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        usuario: user.usuario,
        grupoId: user.grupoId,
        grupo: user.grupo,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          usuario: true,
          grupoId: true,
          estado: true,
        },
      });

      if (!user || !user.estado) {
        throw new UnauthorizedException('Usuario no válido');
      }

      const tokens = await this.generateTokens(user.id, user.usuario, user.grupoId ?? 0);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        usuario: true,
        grupoId: true,
        personaId: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
        online: true,
        grupo: true,
        persona: true,
      },
    });

    if (!user || !user.estado) {
      return null;
    }

    return user;
  }

  private async generateTokens(userId: number, usuario: string, grupoId: number) {
    const payload = { sub: userId, usuario, grupoId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '7d',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  hashPassword(password: string): string {
    return createHash('md5').update(password).digest('hex');
  }

  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
