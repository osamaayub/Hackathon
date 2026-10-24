import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateScheduleItemDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsDateString()
  time?: string;
}
