import { IsString, MaxLength, MinLength } from 'class-validator';
import { SignUpDto } from './sign-up.dto.js';

export class AdminSignUpDto extends SignUpDto {
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  inviteCode: string;
}
