import { IsDateString, IsString, MinLength } from 'class-validator';

export class CreateScheduleItemDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsDateString()
  time: string;
}
