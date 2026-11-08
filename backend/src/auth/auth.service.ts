import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

const sessionSelect = {
  id: true,
  email: true,
  role: true,
  student: {
    select: {
      id: true,
      name: true,
      course: true,
      semester: true,
      institution: { select: { id: true, name: true, city: true } },
    },
  },
  company: { select: { id: true, name: true, segment: true } },
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      select: { ...sessionSelect, passwordHash: true },
    });

    const matches = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;
    if (!user || !matches) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { passwordHash: _password, ...session } = user;
    return { accessToken, user: session };
  }

  me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: sessionSelect,
    });
  }
}
