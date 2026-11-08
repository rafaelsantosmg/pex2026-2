import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.company.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        segment: true,
        user: { select: { email: true } },
        _count: { select: { vacancies: true } },
      },
    });
  }
}
