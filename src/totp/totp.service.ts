import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { CryptoService } from '../crypto/crypto.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TotpService {
  private readonly issuer: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    config: ConfigService,
  ) {
    this.issuer = config.get<string>('TOTP_ISSUER') ?? 'MonAppMFA';
  }

  async setup(userId: string, email: string) {
    const secret = authenticator.generateSecret();
    const encryptedSecret = this.crypto.encrypt(secret);

    await this.prisma.totpEntry.upsert({
      where: { userId },
      update: { encryptedSecret, isEnabled: false },
      create: { userId, encryptedSecret, isEnabled: false },
    });

    const uri = authenticator.keyuri(email, this.issuer, secret);
    const qrCode = await QRCode.toDataURL(uri);

    return { qrCode, manualEntryKey: secret };
  }

  async verify(userId: string, code: string): Promise<{ valid: boolean }> {
    const entry = await this.prisma.totpEntry.findUnique({ where: { userId } });
    if (!entry) {
      return { valid: false };
    }

    const secret = this.crypto.decrypt(entry.encryptedSecret);
    const valid = authenticator.verify({ token: code, secret });
    return { valid };
  }

  async confirm(userId: string, code: string): Promise<{ success: boolean }> {
    const entry = await this.prisma.totpEntry.findUnique({ where: { userId } });
    if (!entry) {
      throw new BadRequestException('Aucun setup 2FA en cours pour cet utilisateur.');
    }
    if (entry.isEnabled) {
      throw new BadRequestException('La 2FA est déjà activée.');
    }

    const secret = this.crypto.decrypt(entry.encryptedSecret);
    const valid = authenticator.verify({ token: code, secret });
    if (!valid) {
      throw new UnauthorizedException('Code TOTP invalide.');
    }

    await this.prisma.totpEntry.update({
      where: { userId },
      data: { isEnabled: true },
    });

    return { success: true };
  }

  async status(userId: string): Promise<{ isEnabled: boolean; isSetup: boolean }> {
    const entry = await this.prisma.totpEntry.findUnique({ where: { userId } });
    return {
      isEnabled: entry?.isEnabled ?? false,
      isSetup: !!entry,
    };
  }

  async remove(userId: string): Promise<void> {
    const entry = await this.prisma.totpEntry.findUnique({ where: { userId } });
    if (!entry) {
      throw new NotFoundException('Aucune entrée TOTP pour cet utilisateur.');
    }
    await this.prisma.totpEntry.delete({ where: { userId } });
  }
}
