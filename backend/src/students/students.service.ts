import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.student.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        course: true,
        semester: true,
        user: { select: { email: true } },
        institution: { select: { id: true, name: true, city: true } },
      },
    });
  }
}
