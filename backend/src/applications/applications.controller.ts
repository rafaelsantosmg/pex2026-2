import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.applications.list(user);
  }

  @Post()
  @Roles(Role.STUDENT)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateApplicationDto) {
    return this.applications.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.STUDENT, Role.COMPANY)
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applications.updateStatus(user, id, dto);
  }
}
