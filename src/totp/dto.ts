import { IsEmail, IsString, IsUUID, Length } from 'class-validator';

export class SetupTotpDto {
  @IsUUID()
  userId: string;

  @IsEmail()
  email: string;
}

export class VerifyTotpDto {
  @IsUUID()
  userId: string;

  @IsString()
  @Length(6, 6, { message: 'Le code doit contenir 6 chiffres.' })
  code: string;
}

export class ConfirmTotpDto {
  @IsUUID()
  userId: string;

  @IsString()
  @Length(6, 6, { message: 'Le code doit contenir 6 chiffres.' })
  code: string;
}
