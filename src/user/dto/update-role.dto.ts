import { IsIn } from 'class-validator';

export class UpdateRoleDto {
  @IsIn(['PARTICIPANT', 'ADMIN'])
  role: 'PARTICIPANT' | 'ADMIN';
}
