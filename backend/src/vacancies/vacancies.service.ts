import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, VacancyStatus } from '@prisma/client';
import { AuthUser } from '../auth/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { UpdateVacancyDto } from './dto/update-vacancy.dto';

const vacancySelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  openings: true,
  company: { select: { id: true, name: true, segment: true } },
} as const;

@Injectable()
export class VacanciesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser) {
    if (user.role === Role.COMPANY) {
      const company = await this.companyOf(user.id);
      if (!company) return [];
      return this.prisma.vacancy.findMany({
        where: { companyId: company.id },
        orderBy: { title: 'asc' },
        select: vacancySelect,
      });
    }

    return this.prisma.vacancy.findMany({
      where: user.role === Role.ADMIN ? undefined : { status: VacancyStatus.ABERTA },
      orderBy: { title: 'asc' },
      select: vacancySelect,
    });
  }

  async create(user: AuthUser, dto: CreateVacancyDto) {
    const company = await this.companyOf(user.id);
    if (!company) throw new BadRequestException('Empresa não vinculada a este usuário');

    return this.prisma.vacancy.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        openings: dto.openings,
        companyId: company.id,
      },
      select: vacancySelect,
    });
  }

  async updateStatus(user: AuthUser, id: string, dto: UpdateVacancyDto) {
    const company = await this.companyOf(user.id);
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id }, select: { companyId: true } });
    if (!company || !vacancy || vacancy.companyId !== company.id) {
      throw new NotFoundException('Vaga não encontrada');
    }

    return this.prisma.vacancy.update({
      where: { id },
      data: { status: dto.status },
      select: vacancySelect,
    });
  }

  private companyOf(userId: string) {
    return this.prisma.company.findUnique({ where: { userId }, select: { id: true } });
  }
}
