import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('pex12345', 10);

  await prisma.applicationEvent.deleteMany();
  await prisma.application.deleteMany();
  await prisma.vacancy.deleteMany();
  await prisma.student.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();

  const institution = await prisma.institution.create({
    data: {
      name: 'Centro Universitário Carlos Drummond de Andrade',
      city: 'São Paulo',
    },
  });

  const admin = await prisma.user.create({
    data: { email: 'admin@pex.local', passwordHash, role: Role.ADMIN },
  });

  const anaUser = await prisma.user.create({
    data: { email: 'ana.lima@pex.local', passwordHash, role: Role.STUDENT },
  });

  const brunoUser = await prisma.user.create({
    data: { email: 'bruno.costa@pex.local', passwordHash, role: Role.STUDENT },
  });

  const companyUser = await prisma.user.create({
    data: { email: 'contato@oficinanorte.local', passwordHash, role: Role.COMPANY },
  });

  const ana = await prisma.student.create({
    data: {
      name: 'Ana Lima',
      course: 'Análise e Desenvolvimento de Sistemas',
      semester: 4,
      userId: anaUser.id,
      institutionId: institution.id,
    },
  });

  await prisma.student.create({
    data: {
      name: 'Bruno Costa',
      course: 'Análise e Desenvolvimento de Sistemas',
      semester: 2,
      userId: brunoUser.id,
      institutionId: institution.id,
    },
  });

  const company = await prisma.company.create({
    data: {
      name: 'Oficina Norte',
      segment: 'Tecnologia',
      userId: companyUser.id,
    },
  });

  const developer = await prisma.vacancy.create({
    data: {
      title: 'Desenvolvedor júnior',
      description: 'Apoio no desenvolvimento de sistemas internos e correção de defeitos.',
      openings: 2,
      companyId: company.id,
    },
  });

  await prisma.vacancy.create({
    data: {
      title: 'Suporte de TI',
      description: 'Atendimento a chamados e apoio aos usuários da empresa.',
      openings: 1,
      companyId: company.id,
    },
  });

  await prisma.application.create({
    data: {
      studentId: ana.id,
      vacancyId: developer.id,
      events: {
        create: {
          status: 'ENVIADA',
          note: 'Candidatura registrada',
        },
      },
    },
  });

  console.log('Seed concluído.', {
    admin: admin.email,
    estudantes: [anaUser.email, brunoUser.email],
    empresa: companyUser.email,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
