import { IsString } from 'class-validator';

export class RevokeSessionDto {
  @IsString()
  token: string;
}
