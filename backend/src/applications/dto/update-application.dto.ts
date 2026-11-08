import { ApplicationStatus } from '@prisma/client';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const statuses = [
  ApplicationStatus.EM_ANALISE,
  ApplicationStatus.ENTREVISTA,
  ApplicationStatus.APROVADA,
  ApplicationStatus.REPROVADA,
  ApplicationStatus.CANCELADA,
] as const;

export class UpdateApplicationDto {
  @IsIn(statuses, { message: 'Estágio de candidatura inválido' })
  status!: ApplicationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'A observação deve ter no máximo 500 caracteres' })
  note?: string;
}
