import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, Prisma, Role } from '@prisma/client';
import { AuthUser } from '../auth/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

const applicationInclude = {
  events: { orderBy: { createdAt: 'asc' as const }, select: { id: true, status: true, note: true, createdAt: true } },
  vacancy: { select: { id: true, title: true, company: { select: { id: true, name: true } } } },
  student: { select: { id: true, name: true, course: true, semester: true } },
};

const openStatuses: ApplicationStatus[] = [
  ApplicationStatus.ENVIADA,
  ApplicationStatus.EM_ANALISE,
  ApplicationStatus.ENTREVISTA,
];

const companyStatuses: ApplicationStatus[] = [
  ApplicationStatus.EM_ANALISE,
  ApplicationStatus.ENTREVISTA,
  ApplicationStatus.APROVADA,
  ApplicationStatus.REPROVADA,
];

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser) {
    if (user.role === Role.ADMIN) {
      return this.prisma.application.findMany({
        include: applicationInclude,
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === Role.STUDENT) {
      const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) return [];
      return this.prisma.application.findMany({
        where: { studentId: student.id },
        include: applicationInclude,
        orderBy: { createdAt: 'desc' },
      });
    }

    const company = await this.prisma.company.findUnique({ where: { userId: user.id } });
    if (!company) return [];
    return this.prisma.application.findMany({
      where: { vacancy: { companyId: company.id } },
      include: applicationInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(user: AuthUser, dto: CreateApplicationDto) {
    const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) throw new ForbiddenException('Acesso não autorizado para este perfil');

    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: dto.vacancyId } });
    if (!vacancy) throw new NotFoundException('Vaga não encontrada');
    if (vacancy.status !== 'ABERTA') {
      throw new BadRequestException('Esta vaga não está aberta para candidatura');
    }

    try {
      return await this.prisma.application.create({
        data: {
          studentId: student.id,
          vacancyId: vacancy.id,
          events: { create: { status: ApplicationStatus.ENVIADA, note: 'Candidatura registrada' } },
        },
        include: applicationInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Você já se candidatou a esta vaga');
      }
      throw error;
    }
  }

  async updateStatus(user: AuthUser, id: string, dto: UpdateApplicationDto) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: {
        status: true,
        student: { select: { userId: true } },
        vacancy: { select: { company: { select: { userId: true } } } },
      },
    });
    if (!application) throw new NotFoundException('Candidatura não encontrada');

    if (user.role === Role.STUDENT) {
      if (application.student.userId !== user.id) {
        throw new NotFoundException('Candidatura não encontrada');
      }
      if (dto.status !== ApplicationStatus.CANCELADA) {
        throw new ForbiddenException('O estudante só pode cancelar a própria candidatura');
      }
      if (!openStatuses.includes(application.status)) {
        throw new BadRequestException('Esta candidatura não pode mais ser cancelada');
      }
    } else if (user.role === Role.COMPANY) {
      if (application.vacancy.company.userId !== user.id) {
        throw new NotFoundException('Candidatura não encontrada');
      }
      if (!companyStatuses.includes(dto.status)) {
        throw new ForbiddenException('A empresa não pode usar este estágio');
      }
      if (!openStatuses.includes(application.status)) {
        throw new BadRequestException('Esta candidatura já foi encerrada');
      }
    } else {
      throw new ForbiddenException('Acesso não autorizado para este perfil');
    }

    if (application.status === dto.status) {
      throw new BadRequestException('A candidatura já está neste estágio');
    }

    const note = dto.note?.trim();
    return this.prisma.application.update({
      where: { id },
      data: {
        status: dto.status,
        events: { create: { status: dto.status, note: note ? note : null } },
      },
      include: applicationInclude,
    });
  }
}
