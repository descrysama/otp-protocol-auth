import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const raw = config.get<string>('TOTP_ENCRYPTION_KEY') ?? '';
    const key = Buffer.from(raw, 'hex');
    if (key.length !== 32) {
      throw new Error(
        'TOTP_ENCRYPTION_KEY doit être une clé de 32 octets encodée en hex (64 caractères).',
      );
    }
    this.key = key;
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGO, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(payload: string): string {
    const [ivHex, tagHex, dataHex] = payload.split(':');
    if (!ivHex || !tagHex || !dataHex) {
      throw new Error('Payload chiffré invalide.');
    }
    const decipher = crypto.createDecipheriv(
      ALGO,
      this.key,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]).toString('utf8');
  }
}
