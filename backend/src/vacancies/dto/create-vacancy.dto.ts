import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateVacancyDto {
  @IsString()
  @MinLength(3, { message: 'O título deve ter ao menos 3 caracteres' })
  @MaxLength(120, { message: 'O título deve ter no máximo 120 caracteres' })
  title!: string;

  @IsString()
  @MinLength(10, { message: 'Descreva a vaga com ao menos 10 caracteres' })
  @MaxLength(2000, { message: 'A descrição deve ter no máximo 2000 caracteres' })
  description!: string;

  @IsInt({ message: 'Informe o número de vagas' })
  @Min(1, { message: 'Informe ao menos 1 vaga' })
  @Max(99, { message: 'O número de vagas deve ser no máximo 99' })
  openings!: number;
}
