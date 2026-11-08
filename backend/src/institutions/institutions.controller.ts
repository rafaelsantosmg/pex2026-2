import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { InstitutionsService } from './institutions.service';

@Controller('institutions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class InstitutionsController {
  constructor(private readonly institutions: InstitutionsService) {}

  @Get()
  list() {
    return this.institutions.list();
  }
}
