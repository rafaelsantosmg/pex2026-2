import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.institution.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        city: true,
        _count: { select: { students: true } },
      },
    });
  }
}
