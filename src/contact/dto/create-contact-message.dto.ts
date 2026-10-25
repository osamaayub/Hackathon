import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const CONTACT_TOPICS = ['general', 'support', 'sponsorship', 'organizer', 'bug'] as const;

export class CreateContactMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsIn(CONTACT_TOPICS)
  topic: (typeof CONTACT_TOPICS)[number];

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;
}
