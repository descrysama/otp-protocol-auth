import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ConfirmTotpDto, SetupTotpDto, VerifyTotpDto } from './dto';
import { TotpService } from './totp.service';

@Controller('totp')
export class TotpController {
  constructor(private readonly totp: TotpService) {}

  @Post('setup')
  @HttpCode(200)
  setup(@Body() dto: SetupTotpDto) {
    return this.totp.setup(dto.userId, dto.email);
  }

  @Post('verify')
  @HttpCode(200)
  verify(@Body() dto: VerifyTotpDto) {
    return this.totp.verify(dto.userId, dto.code);
  }

  @Post('confirm')
  @HttpCode(200)
  confirm(@Body() dto: ConfirmTotpDto) {
    return this.totp.confirm(dto.userId, dto.code);
  }

  @Get('status/:userId')
  status(@Param('userId') userId: string) {
    return this.totp.status(userId);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('userId') userId: string) {
    return this.totp.remove(userId);
  }
}
