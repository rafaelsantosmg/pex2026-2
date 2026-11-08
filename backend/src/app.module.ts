import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApplicationsModule } from './applications/applications.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';
import { VacanciesModule } from './vacancies/vacancies.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    InstitutionsModule,
    CompaniesModule,
    StudentsModule,
    VacanciesModule,
    ApplicationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
