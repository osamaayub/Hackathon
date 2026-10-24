import { IsString } from 'class-validator';

export class UnlinkAccountDto {
  @IsString()
  accountId: string;
}
