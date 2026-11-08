import { IsEnum } from 'class-validator';
import { VacancyStatus } from '@prisma/client';

export class UpdateVacancyDto {
  @IsEnum(VacancyStatus, { message: 'Situação de vaga inválida' })
  status!: VacancyStatus;
}
