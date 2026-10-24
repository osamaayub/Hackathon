import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  hackathonId: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
