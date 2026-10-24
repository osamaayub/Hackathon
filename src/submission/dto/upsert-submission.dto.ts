import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpsertSubmissionDto {
  @IsUrl()
  link: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;
}
