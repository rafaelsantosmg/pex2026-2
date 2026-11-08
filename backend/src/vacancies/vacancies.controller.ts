import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { UpdateVacancyDto } from './dto/update-vacancy.dto';
import { VacanciesService } from './vacancies.service';

@Controller('vacancies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VacanciesController {
  constructor(private readonly vacancies: VacanciesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.vacancies.list(user);
  }

  @Post()
  @Roles(Role.COMPANY)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVacancyDto) {
    return this.vacancies.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.COMPANY)
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVacancyDto,
  ) {
    return this.vacancies.updateStatus(user, id, dto);
  }
}
