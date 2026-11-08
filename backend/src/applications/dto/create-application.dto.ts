import { IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @IsUUID('4', { message: 'Vaga inválida' })
  vacancyId!: string;
}
